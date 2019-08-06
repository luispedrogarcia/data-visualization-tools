///////////////////////////
// Tile index
//

// A tile has a level, row, and column
// Level 0 has 1x1=1 tiles; level 1 has 2x2=4 tiles; level 2 has 4x4=16 tiles
//
// key is a string that encodes [level, row, column] with leading zeros to allow
// lexicographic sorting to match sorting by [level, row, column]

"use strict";

function TileIdx(l, c, r) {
  this.l = l;
  this.c = c;
  this.r = r;
  this.key = ('00' + l).substr(-3) + ('00000' + r).substr(-6) + ('00000' + c).substr(-6);
}

TileIdx.prototype.parent = function() {
  if (this.l > 0) {
    return new TileIdx(this.l - 1, this.c >> 1, this.r >> 1);
  } else {
    return null;
  }
};

TileIdx.prototype.toString = function() {
  return this.l + ',' + this.c + ',' + this.r;
};

// Expands {x} (column), {y} (row), {yflip} (mirrored row), and {z} (level) in an URL
TileIdx.prototype.expandUrl = function(url, layerObject) {
  console.log("Super Special BIIIIIIIIIIKE ", layerObject)
  if(layerObject)
  {
    var dataFilter = layerObject.options.dataFilter
  }
    
  return url
    .replace("{z}", this.l)
    .replace("{x}", this.c)
    .replace("{y}", this.r)
    .replace("{yflip}", Math.pow(2,this.l)-1-this.r)
    .replace("{dataFilter}", dataFilter);
};
