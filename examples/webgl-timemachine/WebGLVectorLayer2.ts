"use strict";

// confusingly, nLevels is really max level #.  the actual number of levels is nLevels+1

// nLevels=0 means levels [0].  nLevels=1 means levels [0, 1]

import { DrawOptions, Layer, LayerOptions } from './Layer'
import { WebGLVectorTile2, WebGLVectorTile2Shaders } from './WebGLVectorTile2'
import { LayerProxy } from './LayerProxy';
import { gEarthTime } from './EarthTime';
import { Utils } from './Utils';
import { Lodes } from './Lodes';

export class WebGLVectorLayer2 extends Layer {
  _tileUrl: string;
  epochs: any;
  lodes: any;

  constructor(layerProxy: LayerProxy, glb: any, canvasLayer: any, tileUrl: string, layerOptions: LayerOptions) {
    super(layerProxy, layerOptions, WebGLVectorTile2);
    this._tileUrl = tileUrl;

    // WebGLVectorLayer2 defaults
    this.fragmentShader = this.fragmentShader ?? WebGLVectorTile2Shaders.vectorTileFragmentShader;
    this.vertexShader = this.vertexShader ?? WebGLVectorTile2Shaders.vectorTileVertexShader;
    this.setDataFunction = this.setDataFunction ?? WebGLVectorTile2.prototype._setBufferData;
    this.loadDataFunction = this.loadDataFunction ?? WebGLVectorTile2.prototype._loadData;
    this.dataLoadedFunction = this.dataLoadedFunction ?? WebGLVectorTile2.prototype._defaultDataLoaded;

    // Hack to rewrite vertexShader for .bin choropleth tiles
    // TODO: make this less hacky
    if (this.vertexShader == WebGLVectorTile2Shaders.choroplethMapVertexShader &&
        this.externalGeojson &&
        this.externalGeojson.endsWith('.bin')) {
      this.vertexShader = WebGLVectorTile2Shaders.choroplethMapVertexShaderV2;
      this.fragmentShader = WebGLVectorTile2Shaders.choroplethMapFragmentShaderV2;
    }
  }

  logPrefix() {
    return `${Utils.logPrefix()} WebGLVectorLayer2`
  }

  draw(view, opt_options) {
    this._drawHelper(view, opt_options);
  }

  allVisibleTilesLoaded(): boolean {
    var tiles = this.getTiles();
    if (!tiles || Object.keys(tiles).length == 0) {
      return false;
    }
    for (var tile in tiles) {
      if (!tiles[tile]._ready) {
        return false;
      }
    }
    return true;
  }

  _drawLayerColorDotmap(drawOptions: DrawOptions): DrawOptions {
    // If too many points to draw in proportion to canvas size, auto-throttle to reduce point draw count
    let population = this.countPopulation();
    let maxPopulation= gEarthTime.canvasLayer.canvas.width * gEarthTime.canvasLayer.canvas.height;
    let throttle = Math.min(maxPopulation/population, 1.0);
    // Merge with original draw options
    return Object.assign({throttle: throttle}, drawOptions);
  }

  _drawLayerLodes(drawOptions: DrawOptions): DrawOptions {
    if (!this.lodes) {
      this.lodes = new Lodes();
    }

    let options = this.lodes.getOptions();
    drawOptions = Object.assign(options, drawOptions);

    // If too many points to draw in proportion to canvas size, auto-throttle to reduce point draw count
    let pointCoint = this.countDrawnPoints();
    let maxPointCount = gEarthTime.canvasLayer.canvas.width * gEarthTime.canvasLayer.canvas.height;
    let throttle = Math.min(maxPointCount/pointCoint, 1.0);
    // Merge with original draw options
    throttle = 1.0;

    return Object.assign({throttle: throttle}, drawOptions);
  }


}

