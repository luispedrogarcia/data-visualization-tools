#!/usr/bin/env python

import sys
print sys.executable

from urllib2 import parse_http_list as _parse_list_header

import ast, flask, functools, gzip, json, numpy, os, psycopg2, random, re, struct, sys, tempfile, time
from flask import after_this_request, request
from cStringIO import StringIO as IO

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def exec_ipynb(filename_or_url):
    nb = (urllib2.urlopen(filename_or_url) if re.match(r'https?:', filename_or_url) else open(filename_or_url)).read()
    jsonNb = json.loads(nb)
    #check for the modified formatting of Jupyter Notebook v4
    if(jsonNb['nbformat'] == 4):
        exec '\n'.join([''.join(cell['source']) for cell in jsonNb['cells'] if cell['cell_type'] == 'code']) in globals()
    else:
        exec '\n'.join([''.join(cell['input']) for cell in jsonNb['worksheets'][0]['cells'] if cell['cell_type'] == 'code']) in globals()

exec_ipynb('timelapse-utilities.ipynb')

set_default_psql_database('census2010')


app = flask.Flask(__name__)


def gzipped(f):
    @functools.wraps(f)
    def view_func(*args, **kwargs):
        @after_this_request
        def zipper(response):
            accept_encoding = request.headers.get('Accept-Encoding', '')
            
            if 'gzip' not in accept_encoding.lower():
                return response
            
            response.direct_passthrough = False
            
            if (response.status_code < 200 or
                response.status_code >= 300 or
                'Content-Encoding' in response.headers):
                return response
            nbytes = len(response.data)
            start_time = time.time()
            gzip_buffer = IO()
            gzip_file = gzip.GzipFile(mode='wb',
                                      fileobj=gzip_buffer)
            gzip_file.write(response.data)
            gzip_file.close()
            
            response.data = gzip_buffer.getvalue()
            duration = int(1000 * (time.time() - start_time))
            print '{duration}ms to gzip {nbytes} bytes'.format(**locals())

            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Vary'] = 'Accept-Encoding'
            response.headers['Content-Length'] = len(response.data)
            
            return response
        
        return f(*args, **kwargs)
    
    return view_func

def pack_color(color):
    return color['r'] + color['g'] * 256.0 + color['b'] * 256.0 * 256.0;

def unpack_color(f):
    b = floor(f / 256.0 / 256.0)
    g = floor((f - b * 256.0 * 256.0) / 256.0)
    r = floor(f - b * 256.0 * 256.0 - g * 256.0)
    return {'r':r,'g':g,'b':b}

def pack_color(color):
    return color['r'] + color['g'] * 256.0 + color['b'] * 256.0 * 256.0;

def parse_color(color):
    if type(color) == str or type(color) == unicode:
        if len(color) == 7:
            color = color[1:]
        if len(color) == 6:
            return pack_color({'r': int(color[0:2], 16),
                               'g': int(color[2:4], 16),
                               'b': int(color[4:6], 16)})
    raise Exception('cannot parse color %s' % color)

def parse_colors(colors):
    packed = [parse_color(color) for color in colors]
    return numpy.array(packed, dtype = numpy.float32)

color3dark1 = parse_colors(['#1b9e77','#d95f02','#7570b3'])
color3dark2 = parse_colors(['#66c2a5','#fc8d62','#8da0cb'])

color4dark1 = parse_colors(['#1b9e77','#d95f02','#7570b3','#e7298a'])
color4dark2 = parse_colors(['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4'])
color4dark3 = parse_colors(['#e41a1c','#377eb8','#4daf4a','#984ea3'])
color4dark4 = parse_colors(['#66c2a5','#fc8d62','#8da0cb','#e78ac3'])
color4dark5 = parse_colors(['#e41a1c','#4daf4a','#984ea3','#ff7f00'])

color5dark1 = parse_colors(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99'])
color5dark2 = parse_colors(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00'])
color5dark3 = parse_colors(['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854'])

color3light1 = parse_colors(['#7fc97f','#beaed4','#fdc086'])
color3light2 = parse_colors(['#1b9e77','#d95f02','#7570b3'])
color3light3 = parse_colors(['#66c2a5','#fc8d62','#8da0cb'])

color4light1 = parse_colors(['#1b9e77','#d95f02','#7570b3','#e7298a'])
color4light2 = parse_colors(['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4'])
color4light3 = parse_colors(['#e41a1c','#377eb8','#4daf4a','#984ea3'])

color5light1 = parse_colors(['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e'])
color5light2 = parse_colors(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00'])
color5light3 = parse_colors(['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854'])

prototile_record_format = '<ffii'  # x, y, block id, seq within block
prototile_record_len = struct.calcsize(prototile_record_format)

tile_record_format = '<fff'  # x, y, color
tile_record_len = struct.calcsize(tile_record_format)

default_psql_database = 'census2010'

def query_psql(query, quiet=False, database=None):
    database = database or default_psql_database
    conn = psycopg2.connect(dbname=database, host='/var/run/postgresql')
    before = time.time()
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    elapsed = time.time() - before
    if not quiet:
        sys.stdout.write('Execution of %s\ntook %g seconds and returned %d rows\n' % (query.strip(), elapsed, len(rows)))
    return rows

column_cache = {}

def load_column(dataset, column):
    cache_key = '{dataset}.{column}'.format(**locals())
    if cache_key in column_cache:
        return column_cache[cache_key]
    cache_dir = 'columncache'
    cache_filename = '{cache_dir}/{dataset}/{column}.numpy'.format(**locals())
    data = numpy.load(open(cache_filename))
    print 'Read {cache_filename}'.format(**locals())
    column_cache[cache_key] = data
    return data

binary_operators = {
    ast.Add:  numpy.add,
    ast.Sub:  numpy.subtract,
    ast.Mult: numpy.multiply,
    ast.Div:  numpy.divide,
}

unary_operators = {
    ast.USub: numpy.negative, # negation (unary subtraction)
}

functions = {
    'max': numpy.maximum,
    'min': numpy.minimum,
}

def eval_(node):
    if isinstance(node, ast.Num): # <number>
        return node.n
    elif isinstance(node, ast.BinOp): # <left> <operator> <right>
        return binary_operators[type(node.op)](eval_(node.left), eval_(node.right))
    elif isinstance(node, ast.UnaryOp): # <operator> <operand> e.g., -1
        return unary_operators[type(node.op)](eval_(node.operand))
    elif isinstance(node, ast.Call):
        return apply(functions[node.func.id], [eval_(arg) for arg in node.args])
    elif isinstance(node, ast.Attribute):
        return load_column(node.value.id, node.attr)
    raise Exception('cannot parse %s' % ast.dump(node))

    
def eval_layer_column(expr):
    return eval_(ast.parse(expr, mode='eval').body)

def assemble_cols(cols):
    return numpy.hstack([c.reshape(len(c), 1) for c in cols])

populations = {}
colors = {}

# working age

working_age_males = (
    load_column('census2010_block2010', 'p012006') +     # Male 15 to 17 years
    load_column('census2010_block2010', 'p012007') +     # Male 18 and 19 years
    load_column('census2010_block2010', 'p012008') +     # Male 20 years
    load_column('census2010_block2010', 'p012009') +     # Male 21 years
    load_column('census2010_block2010', 'p012010') +     # Male 22 to 24 years
    load_column('census2010_block2010', 'p012011') +     # Male 25 to 29 years
    load_column('census2010_block2010', 'p012012') +     # Male 30 to 34 years
    load_column('census2010_block2010', 'p012013') +     # Male 35 to 39 years
    load_column('census2010_block2010', 'p012014') +     # Male 40 to 44 years
    load_column('census2010_block2010', 'p012015') +     # Male 45 to 49 years
    load_column('census2010_block2010', 'p012016') +     # Male 50 to 54 years
    load_column('census2010_block2010', 'p012017') +     # Male 55 to 59 years
    load_column('census2010_block2010', 'p012018') +     # Male 60 and 61 years
    load_column('census2010_block2010', 'p012019')       # Male 62 to 64 years
)
working_age_females = (
    load_column('census2010_block2010', 'p012030') +     # Female 15 to 17 years
    load_column('census2010_block2010', 'p012031') +     # Female 18 and 19 years
    load_column('census2010_block2010', 'p012032') +     # Female 20 years
    load_column('census2010_block2010', 'p012033') +     # Female 21 years
    load_column('census2010_block2010', 'p012034') +     # Female 22 to 24 years
    load_column('census2010_block2010', 'p012035') +     # Female 25 to 29 years
    load_column('census2010_block2010', 'p012036') +     # Female 30 to 34 years
    load_column('census2010_block2010', 'p012037') +     # Female 35 to 39 years
    load_column('census2010_block2010', 'p012038') +     # Female 40 to 44 years
    load_column('census2010_block2010', 'p012039') +     # Female 45 to 49 years
    load_column('census2010_block2010', 'p012040') +     # Female 50 to 54 years
    load_column('census2010_block2010', 'p012041') +     # Female 55 to 59 years
    load_column('census2010_block2010', 'p012042') +     # Female 60 and 61 years
    load_column('census2010_block2010', 'p012043')       # Female 62 to 64 years
)


# jobs2011
# p2010 = load_column('census2010_block2010', 'p001001')
# ce01 = load_column('lodes2011', 'rac_jt01_ce01') # $1250 or less
# ce02 = load_column('lodes2011', 'rac_jt01_ce02') # $1250 - $3333
# ce03 = load_column('lodes2011', 'rac_jt01_ce03') # > $3333
# nonworking = working_age_females + working_age_males - ce01 - ce02 - ce03
# populations['jobs2011'] = assemble_cols([ce01+ce02, ce03, nonworking])

populations['jobs2011'] = assemble_cols([
    eval_layer_column('lodes2011.rac_jt01_ce01 + lodes2011.rac_jt01_ce02'),
    eval_layer_column('lodes2011.rac_jt01_ce03'),
    eval_layer_column('census2010_block2010.p012006 + census2010_block2010.p012007 + census2010_block2010.p012008 + census2010_block2010.p012009 + census2010_block2010.p012010 + census2010_block2010.p012011 + census2010_block2010.p012012 + census2010_block2010.p012013 + census2010_block2010.p012014 + census2010_block2010.p012015 + census2010_block2010.p012016 + census2010_block2010.p012017 + census2010_block2010.p012018 + census2010_block2010.p012019 + census2010_block2010.p012030 + census2010_block2010.p012031 + census2010_block2010.p012032 + census2010_block2010.p012033 + census2010_block2010.p012034 + census2010_block2010.p012035 + census2010_block2010.p012036 + census2010_block2010.p012037 + census2010_block2010.p012038 + census2010_block2010.p012039 + census2010_block2010.p012040 + census2010_block2010.p012041 + census2010_block2010.p012042 + census2010_block2010.p012043 - lodes2011.rac_jt01_c000')])

assert populations['jobs2011'].dtype == numpy.float32

colors['jobs2011'] = numpy.array([
    [pack_color({'r':0, 'g':255, 'b':0}),   
     pack_color({'r':255, 'g':0, 'b':0}),   
     pack_color({'r':0, 'g':0, 'b':255})],
       ],
     dtype = numpy.float32)


#     pack_color({'r':112, 'g':176, 'b':255}),
#     pack_color({'r': 75, 'g':255, 'b':  0}),
#     pack_color({'r':255, 'g':  0, 'b':  0}),
#     pack_color({'r':255, 'g':171, 'b':  0})

#colors['jobs2011'] = color4dark5

# .Accent .q0-4{fill:rgb(127,201,127)} .Accent .q1-4{fill:rgb(190,174,212)} .Accent .q2-4{fill:rgb(253,192,134)} .Accent .q3-4{fill:rgb(255,255,153)}


#jobchange
j2007 = load_column('lodes2007', 'rac_jt01_c000')
j2008 = load_column('lodes2008', 'rac_jt01_c000')
j2009 = load_column('lodes2009', 'rac_jt01_c000')
j2010 = load_column('lodes2010', 'rac_jt01_c000')
# todo: get jt03 from 2010 to omit federal jobs
#  or compare jt00 and jt02 for all non-federal jobs

populations['jobchange'] = assemble_cols([
        numpy.minimum(j2007, j2009),
        numpy.maximum(0, j2007-j2009),
        numpy.maximum(0, j2009-j2007)
            ])

colors['jobchange'] = numpy.array(
    [pack_color({'r':0, 'g':0, 'b':255}),   # blue:  both 2006 and 2010                                      
     pack_color({'r':255, 'g':0, 'b':0}),   # red: disappeared                                               
     pack_color({'r':0, 'g':255, 'b':0})],   # green: added                                                  
    dtype = numpy.float32);


# popchange2000_2010
p2000 = load_column('census2000_block2010', 'p001001')
p2010 = load_column('census2010_block2010', 'p001001')

populations['popchange2000_2010'] = assemble_cols([
        numpy.minimum(p2000, p2010),
        numpy.maximum(0, p2000-p2010),
        numpy.maximum(0, p2010-p2000)
            ])

colors['popchange2000_2010'] = numpy.array(
    [pack_color({'r':0, 'g':0, 'b':255}),   # blue:  both 2000 and 2010                                      
     pack_color({'r':255, 'g':0, 'b':0}),   # red: disappeared                                               
     pack_color({'r':0, 'g':255, 'b':0})],   # green: added                                                  
    dtype = numpy.float32);

#populations['jobs2011'] = populations['popchange2000_2010']
#colors['jobs2011'] = colors['popchange2000_2010']

#cols = [numpy.subtract(numpy.multiply(p2000, 1.0), 0.0)]

#@app.after_request
#def after_request(response):
#    print "got an after request"
#    print 'Content-Length was ', response.headers['Content-Length']
#    response.headers['Content-Length']=None
#    #response.headers.remove('Content-Length')
#    response.headers['Content-Encoding'] = 'gzip'
#    return response

def compute_tile_data_python(prototile_path, incount, tile, populations):
    raise 'Dont call me'
    prototile = open(prototile_path).read()
    assert(incount == len(prototile) / prototile_record_len)
    
    outcount = 0
    for i in range(incount):
        (x, y, blockidx, seq) = struct.unpack_from(prototile_record_format,
                                                   prototile,
                                                   i * prototile_record_len)
        # TODO:
        # Decide if we want to keep the randomness.
        # If so, make this deterministic and fast.
        seq += random.random()
        #seq += 0.5

        for c in range(populations.shape[1]):
            seq -= populations[blockidx, c]
            if seq < 0:
                struct.pack_into(tile_record_format, tile,
                                 outcount * tile_record_len,
                                 x, y, colors[c])
                outcount += 1
                break
    return outcount

compute_tile_data_ext = compile_and_load("""
#include <stdint.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <stdio.h>

typedef struct {
  float x;
  float y;
  uint32_t blockIdx;
  uint32_t seq;
} __attribute__ ((packed)) PrototileRecord;

typedef struct {
  float x;
  float y;
  float color;
} __attribute__ ((packed)) TileRecord;

int compute_tile_data(
    const char *prototile_path,
    int incount,
    TileRecord *tile_data,
    float *populations,
    unsigned int pop_rows,
    unsigned int pop_cols,
    float *colors)
{
    if (incount == 0) return 0;

    int fd = open(prototile_path, O_RDONLY);
    if (fd < 0) return -1;

    PrototileRecord *p = mmap (0, incount*sizeof(PrototileRecord),
                               PROT_READ, MAP_SHARED, fd, 0);
    if (p == MAP_FAILED) return -2;

    unsigned outcount = 0;
    for (unsigned i = 0; i < incount; i++) {
        PrototileRecord rec = p[i];
        double seq = rec.seq;
        seq += (double)rand() / (double)((unsigned)RAND_MAX + 1);
        seq += 0.5;
        for (unsigned c = 0; c < pop_cols; c++) {
            if (rec.blockIdx * pop_cols + c >= pop_rows * pop_cols) {
                fprintf(stdout, 
                        "yo, rec.blockIdx is %d, pop_rows is %d\\n",
                        rec.blockIdx, pop_rows);
                return -3;
            }
            seq -= populations[rec.blockIdx * pop_cols + c];
            if (seq < 0) {
                tile_data[outcount].x = rec.x;
                tile_data[outcount].y = rec.y;
                tile_data[outcount].color = colors[c];
                outcount++;
                break;
            }
        }
    }
    
    munmap(p, incount*sizeof(PrototileRecord));
    close(fd);
    return outcount;
}
""")

def compute_tile_data_c(prototile_path, incount, tile, populations, colors):
    return compute_tile_data_ext.compute_tile_data(
        prototile_path,
        int(incount),
        to_ctype_reference(tile),
        to_ctype_reference(populations),
        populations.shape[0], populations.shape[1],
        to_ctype_reference(colors))

def generate_tile_data(layer, z, x, y, use_c=False):
    start_time = time.time()
    # remove block # and seq #, add color
    
    prototile_path = 'prototiles/{z}/{x}/{y}.bin'.format(**locals())
    incount = os.path.getsize(prototile_path) / prototile_record_len
    tile = bytearray(tile_record_len * incount)
    if use_c:
        ctd = compute_tile_data_c
    else:
        ctd = compute_tile_data_python
        
    outcount = ctd(prototile_path, incount, tile, layer['populations'], layer['colors'])
    if outcount < 0:
        raise Exception('compute_tile_data returned error %d' % outcount)

    duration = int(1000 * (time.time() - start_time))
    print '{z}/{x}/{y}: {duration}ms to create tile from prototile'.format(**locals())

    return tile[0 : outcount * tile_record_len]


layer_cache = {}

def find_or_generate_layer(layerdef):
    if layerdef in layer_cache:
        print 'Using cached {layerdef}'.format(**locals())
        return layer_cache[layerdef]

    print 'Computing {layerdef}'.format(**locals())
    colors = []
    populations = []
    for (color, expression) in [x.split(';') for x in layerdef.split(';;')]:
        colors.append(color)
        populations.append(eval_layer_column(expression))

    layer = {'populations':assemble_cols(populations),
             'colors':parse_colors(colors)}
    layer_cache[layerdef] = layer
    return layer

@app.route('/tilesv1/<layerdef>/<z>/<x>/<y>.<suffix>')
def serve_tile_v1(layerdef, z, x, y, suffix):
    try:
        layer = find_or_generate_layer(layerdef)
        tile = generate_tile_data(layer, z, x, y, use_c=True)
        outcount = len(tile) / tile_record_len
        
        if suffix == 'debug':
            html = '<html><head></head><body>'
            html += 'tile {layer}/{z}/{y}/{x}  has {outcount} points<br>'.format(**locals())
            for i in range(0, min(outcount, 10)):
                html += 'Point {i}: '.format(**locals())
                html += ', '.join([str(x) for x in struct.unpack_from(tile_record_format, tile, i * tile_record_len)])
                html += '<br>\n'
            if outcount > 10:
                html += '...<br>'
                html += '</body></html>'
                    
            return flask.Response(html, mimetype='text/html')
        elif suffix == 'bin':
            response = flask.Response(tile[0 : outcount * tile_record_len], mimetype='application/octet-stream')
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        else:
            raise 'Invalid suffix {suffix}'.format(**locals())
    except Exception as e:
        print str(e)
        if suffix == 'debug':
            html = '<html><head></head><body><pre>\n'
            html += str(e)
            html += '\n</pre></body></html>'
            return html
        else:
            raise

@app.route('/<layer>/<z>/<x>/<y>.<suffix>')
def serve_tile_v0(layer, z, x, y, suffix):
    print 'serve_tile'
    tile = generate_tile_data(layer, z, x, y, use_c=True)
    outcount = len(tile) / tile_record_len

    if suffix == 'debug':
        html = '<html><head></head><body>'
        html += 'tile {layer}/{z}/{y}/{x}  has {outcount} points<br>'.format(**locals())
        for i in range(0, min(outcount, 10)):
            html += 'Point {i}: '.format(**locals())
            html += ', '.join([str(x) for x in struct.unpack_from(tile_record_format, tile, i * tile_record_len)])
            html += '<br>\n'
        if outcount > 10:
            html += '...<br>'
        html += '</body></html>'
        
        return flask.Response(html, mimetype='text/html')
    elif suffix == 'bin':
        response = flask.Response(tile[0 : outcount * tile_record_len], mimetype='application/octet-stream')
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    else:
        raise 'Invalid suffix {suffix}'.format(**locals())


@app.route('/')
def hello():
    return """
<html><head></head><body>
Test tiles:<br>
<a href="/tilesv1/%230000ff;min(census2000_block2010.p001001%2Ccensus2010_block2010.p001001);;%23ff0000;max(0%2Ccensus2000_block2010.p001001-census2010_block2010.p001001);;%2300ff00;max(0%2Ccensus2010_block2010.p001001-census2000_block2010.p001001)/0/0/0.debug">Pop change 2000-2010 0/0/0</a>
"""
 
#app.run(host='0.0.0.0', port=5000)

