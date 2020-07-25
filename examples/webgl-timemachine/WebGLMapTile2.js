"use strict";

export class WebGLMapTile2 {
  constructor(glb, tileidx, bounds, urls, defaultUrl, opt_options) {
    if (!WebGLMapTile2._initted) {
      WebGLMapTile2._init();
    }
    this._tileidx = tileidx;
    this.glb = glb;
    this.gl = glb.gl;

    var opt_options = opt_options || {};
    this.fragmentShader = opt_options.fragmentShader || WebGLMapTile2.textureFragmentShader;
    this.vertexShader = opt_options.vertexShader || WebGLMapTile2.textureVertexShader;

    this._textureProgram = glb.programFromSources(this.vertexShader,
      this.fragmentShader);


    this.colormap = opt_options.colormap || null;

    this._texture0 = this._createTexture();
    this._texture1 = this._createTexture();

    this._triangles = glb.createBuffer(new Float32Array([0, 0,
      1, 0,
      0, 1,
      1, 1]));

    this._image0 = new Image();
    this._image0.crossOrigin = "anonymous";

    this._image1 = new Image();
    this._image1.crossOrigin = "anonymous";

    var that = this;
    this._image0.onload = function () {
      that._handleLoadedTexture(that._image0, that._texture0, 0);
    };

    this._image1.onload = function () {
      that._handleLoadedTexture(that._image1, that._texture1, 1);
    };

    // If tile 404's, replace with defaultUrl.  This lets us remove e.g. all the
    // sea tiles and replace with a single default tile.
    this._image0.addEventListener('error', function (event) {
      if (that._image0) {
        if (that._image0.src != defaultUrl) {
          that._image0.src = defaultUrl;
        }
      }
    });

    this._image1.addEventListener('error', function (event) {
      if (that._image1) {
        if (that._image1.src != defaultUrl) {
          that._image1.src = defaultUrl;
        }
      }
    });

    this._image0.src = urls[0];
    this._image1.src = urls[1];
    this._ready = [false, false];
    this._width = 256;
    this._height = 256;
    this._bounds = bounds;
    WebGLMapTile2.activeTileCount++;
  }
  _createTexture() {
    var gl = this.gl;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
  _handleLoadedTexture(image, texture, index) {
    var before = performance.now();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._ready[index] = true;
  }
  delete() {
    // TODO: recycle texture
    this._image0.src = '';
    this._image0 = null;
    this._image1.src = '';
    this._image1 = null;

    WebGLMapTile2.activeTileCount--;
  }
  toString() {
    return 'Tile ' + this._tileidx.toString() +
      ', ready: ' + this.isReady();
  }
  isReady() {
    return this._ready[0] && this._ready[1];
  }
  draw(transform, options) {
    //console.log(options);
    var gl = this.gl;
    var tileTransform = new Float32Array(transform);
    translateMatrix(tileTransform, this._bounds.min.x, this._bounds.min.y);
    scaleMatrix(tileTransform,
      this._bounds.max.x - this._bounds.min.x,
      this._bounds.max.y - this._bounds.min.y);

    if (this._ready[0] && this._ready[1]) {
      gl.useProgram(this._textureProgram);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      var uAlpha = options.alpha || 0.;

      if (options.alphaFnc) {
        var alphaFnc = new Function('return ' + options.alphaFnc)();
        uAlpha = alphaFnc(options.currentTime);
      }


      var alphaLocation = gl.getUniformLocation(this._textureProgram, "uAlpha");
      gl.uniform1f(alphaLocation, uAlpha);


      gl.uniformMatrix4fv(this._textureProgram.uTransform, false, tileTransform);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._triangles);
      gl.vertexAttribPointer(this._textureProgram.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

      /*    gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this._texture);
      */
      var imageLocation0 = gl.getUniformLocation(this._textureProgram, "uSampler0");
      var imageLocation1 = gl.getUniformLocation(this._textureProgram, "uSampler1");

      gl.uniform1i(imageLocation0, 0); // texture unit 0
      gl.uniform1i(imageLocation1, 1); // texture unit 0

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._texture0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._texture1);

      if (this.colormap) {
        gl.uniform1i(gl.getUniformLocation(this._textureProgram, "uColormap"), 2); // texture unit 2
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.colormap);
      }


      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.disable(gl.BLEND);
    }
  }
  static _init() {
    WebGLMapTile2._initted = true;

    $(document).keypress(function (e) {
      // ctrl-b toggles verbosity
      if (e.keyCode == 2) {
        WebGLMapTile2.verbose = !WebGLMapTile2.verbose;
        //console.log('WebGLMapTile2 verbose: ' + WebGLMapTile2.verbose);
      }
    });
  }
  static stats() {
    return ('WebGLMapTile2 stats. Active tiles: ' + WebGLMapTile2.activeTileCount);
  }
  // Update and draw tiles
  // Assumes tiles is sorted low res to high res (by TileView)
  static update(tiles, transform, options) {
    if (si)
      return;
    //WebGLTimeMachinePerf.instance.startFrame();
    var canvas = document.getElementById('webgl');

    for (var i = 0; i < tiles.length; i++) {
      tiles[i].draw(transform, options);
    }

    //WebGLTimeMachinePerf.instance.endFrame();
  }
}




WebGLMapTile2.videoId = 0;
WebGLMapTile2.verbose = false;
WebGLMapTile2.activeTileCount = 0;
WebGLMapTile2._initted = false;








WebGLMapTile2.textureVertexShader =
  'attribute vec2 aTextureCoord;\n' +
  'uniform mat4 uTransform;\n' +
  'varying vec2 vTextureCoord;\n' +

  'void main(void) {\n' +
  '  vTextureCoord = vec2(aTextureCoord.x, aTextureCoord.y);\n' +
  '  gl_Position = uTransform * vec4(aTextureCoord.x, aTextureCoord.y, 0., 1.);\n' +
  '}\n';


WebGLMapTile2.textureFragmentShader =
  'precision mediump float;\n' +
  'varying vec2 vTextureCoord;\n' +
  'uniform sampler2D uSampler0;\n' +
  'uniform sampler2D uSampler1;\n' +
  'uniform float uAlpha;\n' +
  'void main(void) {\n' +
  '  vec4 textureColor0 = texture2D(uSampler0, vec2(vTextureCoord.s, vTextureCoord.t));\n' +
  '  vec4 textureColor1 = texture2D(uSampler1, vec2(vTextureCoord.s, vTextureCoord.t));\n' +
  '  vec4 color0 = vec4(0.,0.,0.,0);\n' +
  '  vec4 color1 = vec4(0.,0.,0.,0);\n' +
  '  if (textureColor0.g > 1. - uAlpha) {\n' +
  '    color0 = vec4(textureColor0.a, 0., 0., textureColor0.a); \n' +
  '  }\n' +
  '  if (textureColor1.b > 0.40) {\n' +
  '    color1 = vec4(0., 0., textureColor1.b * uAlpha, uAlpha);\n' +
  '  }\n' +
  '  gl_FragColor = color0 + color1;\n' +
  '}\n';

WebGLMapTile2.textureFragmentFaderShader =
  'precision mediump float;\n' +
  'varying vec2 vTextureCoord;\n' +
  'uniform sampler2D uSampler0;\n' +
  'uniform sampler2D uSampler1;\n' +
  'uniform sampler2D uColormap;\n' +
  'uniform float uAlpha;\n' +
  'void main(void) {\n' +
  '  vec4 textureColor1 = texture2D(uSampler0, vec2(vTextureCoord.s, vTextureCoord.t)); \n' +
  '  vec4 textureColor2 = texture2D(uSampler1, vec2(vTextureCoord.s, vTextureCoord.t));\n' +
  '  vec4 textureColor = textureColor1 * (1.0 - uAlpha) + textureColor2 * uAlpha;\n' +
  '  vec4 colormap = texture2D(uColormap, vec2(textureColor.r,textureColor.r));\n' + 
  '   gl_FragColor = vec4(colormap.rgb, textureColor.a);\n' +
  '}\n';

// stopit:  set to true to disable update()
var si = false;
