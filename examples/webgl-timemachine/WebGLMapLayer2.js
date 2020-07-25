"use strict";

// WebGLMapLayer2 is a modification of WebGLMapLayer which can load multiple data from multiple URLs per tile
// Currently only used for Animated Forest Loss/Gain

import { TileView } from './TileView'
import { WebGLMapTile2 } from './WebGLMapTile2'

export class WebGLMapLayer2 {
  constructor(glb, canvasLayer, tileUrls, opt_options) {
    this.glb = glb;
    this.gl = glb.gl;
    this._canvasLayer = canvasLayer;
    this.nLevels = 21;
    this.tileWidth = 256;
    this.tileHeight = 256;

    if (opt_options) {
      $.extend(this, opt_options);
    }

    this.fileExtension = this.fileExtension || "png";
    var splitToken = tileUrls[0].indexOf("{default}") > 0 ? "{default}" : "{z}";
    this.defaultUrl = this.defaultUrl || tileUrls[0].split(splitToken)[0] + "default." + this.fileExtension;
    this._tileUrls = [];
    for (var i = 0; i < tileUrls.length; i++) {
      this._tileUrls[i] = tileUrls[i].replace("{default}/", "");
    }

    var that = this;

    this._tileView = new TileView({
      panoWidth: 256 * Math.pow(2, this.nLevels),
      panoHeight: 256 * Math.pow(2, this.nLevels),
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      createTile: function (ti, bounds) { return that._createTile(ti, bounds); },
      deleteTile: function (tile) { },
      updateTile: WebGLMapTile2.update,
      timelapse: this._canvasLayer.timelapse,
      maxLevelOverride: this.maxLevelOverride
    });

    this.ready = true;
    if (opt_options.colormap) {
      this.ready = false;
      this.colormap = this.createTexture();
      this.image = new Image();
      this.image.crossOrigin = "anonymous";
      this.image.onload = this.handleLoadedColormap.bind(this);
      this.image.addEventListener('error', function (event) { console.log('ERROR:  cannot load colormap ' + that.image.src); });
      this.image.src = opt_options.colormap;
    }
    else {
      this.colormap = null;
    }

    // TODO: experiment with this
    this._tileView.levelThreshold = opt_options.levelThreshold || 0;
  }
  getWidth() {
    return this._tileView.getWidth();
  }
  getHeight() {
    return this._tileView.getHeight();
  }
  _createTile(ti, bounds) {
    var urls = [];
    for (var i = 0; i < this._tileUrls.length; i++) {
      urls[i] = ti.expandUrl(this._tileUrls[i]);
    }

    var opt_options = {};
    if (this.drawFunction) {
      opt_options.drawFunction = this.drawFunction;
    }
    if (this.fragmentShader) {
      opt_options.fragmentShader = this.fragmentShader;
    }
    if (this.vertexShader) {
      opt_options.vertexShader = this.vertexShader;
    }
    if (this._tileView) {
      opt_options.layerDomId = this._tileView._layerDomId;
    }
    if (this.colormap) {
      opt_options.colormap = this.colormap;
    }

    return new WebGLMapTile2(glb, ti, bounds, urls, this.defaultUrl, opt_options);
  }
  destroy() {
    this._tileView._discardTilesAndResources();
  }
  // viewBounds:  xmin, xmax, ymin, ymax all in coords 0-256
  draw(view, opt_options) {
    if (this.ready) {
      var width = this._canvasLayer.canvas.width / this._canvasLayer.resolutionScale_;
      var height = this._canvasLayer.canvas.height / this._canvasLayer.resolutionScale_;
      var options = {};
      if (typeof (opt_options) != "undefined") {
        options = opt_options;
      }

      // Compute transform to be x:0-1, y:0-1
      var transform = new Float32Array([2 / width, 0, 0, 0, 0, -2 / height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      translateMatrix(transform, width * 0.5, height * 0.5);

      // Modify transform to show view
      scaleMatrix(transform, view.scale, view.scale);
      translateMatrix(transform, -view.x, -view.y);

      if (view.alpha) {
        options['alpha'] = view.alpha;
      }
      // TODO: Refactor how tile views are initialized and drawn
      this._tileView.setView(view, width, height, this._canvasLayer.resolutionScale_);
      this._tileView.update(transform, options);
    }
  }
  getTileView() {
    return this._tileView;
  }
  getTiles() {
    return this._tileView._tiles;
  }
  abortLoading() {
    this._tileView._abort();
  }
  createTexture() {
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
  handleLoadedColormap() {
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.colormap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.ready = true;
  }
}











