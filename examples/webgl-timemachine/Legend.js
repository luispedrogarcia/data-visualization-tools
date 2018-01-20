//Legend.js
var Legend = function Legend(id, str) {
    this.id = id;
    this.str = str;
}

Legend.prototype.toString = function legendToString() {
  var ret = '<tr id="' + this.id +'-legend" style="display: none"><td>'+ this.str +'</td></tr>';
  return ret;
}

var BubbleMapLegend = function BubbleMapLegend(opts) {
    this.width = 240;
    this.height = 110;
    this.keyY = 10;
    this.keyOffset = 0;.0
    this.id = opts["id"];
    this.str = opts["str"] || this.setStr(opts);
    Legend.call(this, this.id, this.str);
}
BubbleMapLegend.prototype = Object.create(Legend.prototype);

BubbleMapLegend.prototype.setStr = function setStr(opts) {
    var that = this;
    function getKey(color, str) {
        var circle = '<circle class="gain" r="10" cx="15" cy="' + that.keyY + '" style="fill: ' + color + '; stroke: #fff;"></circle>';
        var text = '<text x="30" y="' + (that.keyY + 5.0) + '" style="font-size: 12px; fill: #e6e6e6">' + str + '</text>';
        return circle + text;
    }

    function getCircle(value, radius) {
        var text =  '<text text-anchor="middle" x="120.0" y="' + (that.height - 2.0*parseFloat(radius)) + '" dy="10" style="font-size: 10px; fill: #e6e6e6">' + value + '</text>';
        var circle = '<circle r="' + radius + '" cx="120.0" cy="' + (that.height - parseFloat(radius) - 5.0) + '" vector-effect="non-scaling-stroke" style="fill: none; stroke: #a7a7a7"></circle>';
        return circle + text;
    }

    this.height += opts["keys"] ? opts["keys"].length * 25.0 : 0.0;
    var div = '<div style="font-size: 15px">' + opts["title"] + '<span class="credit"> ('+ opts["credit"] +')</span></div>';
    var svg = '<svg class="svg-legend" width="240" height="'+ this.height + '">';
    var keys = '';
    if (opts["keys"]) {
        for (var i = 0; i < opts["keys"].length; i++) {
            keys += getKey(opts["keys"][i]['color'], opts["keys"][i]['str']);
            that.keyY += 25.0;
        }

    }
    var circles = '';
    for (var i = 0; i < opts["circles"].length; i++) {
        circles += getCircle(opts["circles"][i]['value'], opts["circles"][i]['radius']);
    }
    return div + svg + keys + circles + '</svg>';
}

var ChoroplethLegend = function ChoroplethLegend(opts) {
    this.width = 280;
    this.height = 80;
    this.xOffset = 0;
    this.xValueOffset = 0;
    this.id = opts["id"];
    this.str = opts["str"] || this.setStr(opts);
    this.keys = opts["keys"] || [];
    Legend.call(this, this.id, this.str);
}

ChoroplethLegend.prototype = Object.create(Legend.prototype);
ChoroplethLegend.prototype.safe = function(templateData) {
        var entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
  
        var s = templateData[0];
        for (var i = 1; i < arguments.length; i++) {
            s += String(arguments[i]).replace(/[&<>"'`=\/]/g, function (s) { return entityMap[s]; });
            s += templateData[i];
        }
        return s;
    }

ChoroplethLegend.prototype.setStr = function setStr(opts) {
    var that = this;

    function getKey(str) {
        var text = '<text x="140" y="10" text-anchor="middle" style="font-size: 12px; fill: #dcdbdb">' + str + '</text>';
        return text;
    }
    function getColor(color) {
        var rect = '<rect fill="' + color + '" y="20" x="' + that.xOffset + '" height="10" width="' + that.colorWidth + '"></rect>';
        return rect;
    }
    function getValue(value) {
        var text = '<text font-size="10px" fill="#e6e6e6" y="40" x="' + that.xOffset  + '" text-anchor="middle">' + value + '</text>';
        return text;
    }

    if (opts["colorMap"]) {
        var legend = '';
        legend += this.safe`<div style="font-size: 15px">${opts["title"]}<span class="credit">(${opts["credit"]})</span></div>`;
        if (opts["keys"].length > 0) {
          legend += this.safe`<div style="font-size: 11px; text-align: center;">${opts["keys"][0]['str']}</div>`;            
        }
        legend += this.safe`<div style="font-size: 11px">${opts["values"][0]} `;
        legend += this.safe`<img src="${opts["colorMap"]}" style="border:1px solid grey; width:200px; height:10px; margin-top:2px; position:relative; top:3px; background-color:black">`;
        legend += this.safe` ${opts["values"][opts["values"].length - 1]}</div>`;
        return legend;
        //legend += safe` ${layerJson.legendMax} ${layerJson.legendUnits}</div>`;
    } else {
        var div = '<div style="font-size: 15px">' + opts["title"] + '<span class="credit"> ('+ opts["credit"] +')</span></div>';
        var svg = '<svg class="svg-legend" width="280" height="60">';
        var keys = '';
        if (opts["keys"]) {
            for (var i = 0; i < opts["keys"].length; i++) {
                keys += getKey(opts["keys"][i]['str']);
            }

        }

       var colors = '';
       this.colorWidth = this.width/opts["colors"].length;
        for (var i = 0; i < opts["colors"].length; i++) {
            colors += getColor(opts["colors"][i]);
            this.xOffset += this.colorWidth;
        }
        var values = '';
        this.xOffset = 0 + this.colorWidth*0.5;
        if (opts["values"].length == 2) {
            values += getValue(opts["values"][0]);
            this.xOffset += this.colorWidth*(opts["colors"].length - 1.);
            values += getValue(opts["values"][1]);
        } else if (opts["values"].length == 3) {
            values += getValue(opts["values"][0]);
            this.xOffset = this.width / 2;
            values += getValue(opts["values"][1]);
        this.xOffset = 0 + this.colorWidth*0.5;

            this.xOffset += this.colorWidth*(opts["colors"].length - 1.);
            values += getValue(opts["values"][2]);
        } else {
            this.valueWidth = this.width/opts["values"].length;
            for (var i = 0; i < opts["values"].length; i++) {
                values += getValue(opts["values"][i]);
                this.xOffset += this.valueWidth;
            }

        }
        return div + svg + keys + colors + values + '</svg>';

    }


}
