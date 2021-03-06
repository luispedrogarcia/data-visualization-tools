// Base class for tiles

import { gEarthTime } from './EarthTime'
import { Resource } from './Resource'
import { TileIdx } from './TileIdx'
import { TileView } from './TileView'
import { Layer, DrawOptions } from './Layer';
import { GlbWebGLProgram } from './Glb';

export class Tile {
  _tileview: TileView;
  glb: any;
  gl: any;
  _tileidx: TileIdx;
  _bounds: any;
  program: GlbWebGLProgram;
  setDataFunction: (data:any, opts?:any) => void;
  loadDataFunction: any;
  dataLoadedFunction: any;
  draw: (transform: Float32Array, options: DrawOptions) => void;
  static updateTiles(tiles, transform: Float32Array, options: DrawOptions): void {
    throw Error("Must implement update in subclass");
  }

  constructor(layer: Layer, tileidx: TileIdx, bounds, opt_options) {
    this._tileview = layer._tileView;
    this.glb = gEarthTime.glb;
    this.gl = gEarthTime.glb.gl;
    this._tileidx = tileidx;
    this._bounds = bounds;
    this.draw = layer.drawFunction;
    console.assert(typeof(this.draw) == 'function');
    if (layer.vertexShader && layer.fragmentShader) {
      this.program = this.glb.programFromSources(layer.vertexShader, layer.fragmentShader);
    }
    this.setDataFunction = layer.setDataFunction;
    this.loadDataFunction = layer.loadDataFunction;
    this.dataLoadedFunction = layer.dataLoadedFunction;
  }
  // Handle fetching of resource that might be one-per-tile or one-per-layer
  // E.g. data for choropleth
  _fetchData(url: string, parse) {
  }
  delete() {
    throw Error("Must implemement delete in subclass");
  }
  unloadResources() {
    for (var property in this) {
      var val = this[property];
      if (val instanceof Resource) {
        //console.log('Unloading tile.' + property + ' from ' + this._tileidx.toString());
        val.unload();
      }
    }
  }
}

