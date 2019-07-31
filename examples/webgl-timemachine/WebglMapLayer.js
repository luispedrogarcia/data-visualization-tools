"use strict";

function WebglMapLayer(glb, canvasLayer, tileUrl, opt_options) {
  this.glb = glb;
  this.gl = glb.gl;
  this._canvasLayer = canvasLayer;
  this._tileUrl = tileUrl.replace("{default}/", "");
  this.nLevels = 21;
  this.tileWidth = 256;
  this.tileHeight = 256;

  if (opt_options) {
    $.extend(this, opt_options);
  }
  this.fileExtension = this.fileExtension || "png";
  this.defaultUrl = relUrlToAbsUrl(this.defaultUrl || tileUrl.split("{default}")[0] + "default." + this.fileExtension);

  var that = this;

  this._tileView = new TileView({
    panoWidth: 256 * Math.pow(2, this.nLevels),
    panoHeight: 256 * Math.pow(2, this.nLevels),
    tileWidth: this.tileWidth,
    tileHeight: this.tileHeight,
    createTile: function(ti, bounds) { return that._createTile(ti, bounds); },
    deleteTile: function(tile) {},
    updateTile: WebglMapTile.update,
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
    this.image.addEventListener('error', function(event) { console.log('ERROR:  cannot load colormap ' + that.image.src); });
    this.image.src = opt_options.colormap;
  } else {
    this.colormap = null;
  }

  // TODO: experiment with this
  this._tileView.levelThreshold = opt_options.levelThreshold || 0;
};

WebglMapLayer.prototype.
getWidth = function() {
    return this._tileView.getWidth();
};

WebglMapLayer.prototype.getHeight = function() {
    return this._tileView.getHeight();
};

WebglMapLayer.prototype._createTile = function(ti, bounds) {
  var url = ti.expandUrl(this._tileUrl);

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
  return new WebglMapTile(glb, ti, bounds, url, this.defaultUrl, opt_options);
};

WebglMapLayer.prototype.destroy = function() {
  this._tileView._discardTilesAndResources();
};

// viewBounds:  xmin, xmax, ymin, ymax all in coords 0-256
WebglMapLayer.prototype.draw = function(view, opt_options) {
  if (this.ready) {
  var width = this._canvasLayer.canvas.width / this._canvasLayer.resolutionScale_;
  var height = this._canvasLayer.canvas.height / this._canvasLayer.resolutionScale_;
  var options = {};
  if (typeof(opt_options) != "undefined") {
    options = opt_options;
  }
  // Compute transform to be x:0-1, y:0-1
  var transform = new Float32Array([2/width,0,0,0, 0,-2/height,0,0, 0,0,0,0, -1,1,0,1]);
  translateMatrix(transform, width*0.5, height*0.5);

  // Modify transform to show view
  scaleMatrix(transform, view.scale, view.scale);
  translateMatrix(transform, -view.x, -view.y);

  // TODO: Refactor how tile views are initialized and drawn
  this._tileView.setView(view, width, height, this._canvasLayer.resolutionScale_);
  this._tileView.update(transform, options);
  }
};

WebglMapLayer.prototype.getTileView = function() {
  return this._tileView;
};

WebglMapLayer.prototype.getTiles = function() {
  return this._tileView._tiles;
};

WebglMapLayer.prototype.abortLoading = function() {
  this._tileView._abort();
};

WebglMapLayer.prototype.createTexture = function() {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};

WebglMapLayer.prototype.handleLoadedColormap = function() {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, this.colormap);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
  gl.bindTexture(gl.TEXTURE_2D, null);
  this.ready = true;
};

