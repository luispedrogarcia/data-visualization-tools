var CsvFileLayer = function CsvFileLayer() {
  this.layers = [];
  this.dataLoadedListeners = [];
  this.layersData = {};

  this.formatValue = function(value) {
    var absValue = Math.abs(value);
    var suffix = '';
    if (absValue < 1000) {
        value = value;
    }
    else if (absValue < 1000000) {
        value = value / 1000;
        suffix = "K";
    }
    else if (absValue < 1000000000 && (absValue / 1000000) != 1000) {
        value = value / 1000000;
        suffix = "M";
    }
    else if (absValue < 1000000000000 && (absValue / 1000000000) != 1000) {
        value = value / 1000000000;
        suffix = "G";
    }
    else if (absValue < 1000000000000000 && (absValue / 1000000000000) != 1000) {
        value = value / 1000000000000;
        suffix = "T";
    }
    else {
        value = value / 1000000000000000;
        suffix = "P";
    }

    var valueStr = value.toFixed(2);
    var find = '\\.?0+$';
    var re = new RegExp(find, 'g');
    valueStr = valueStr.replace(re, '') + suffix;
    return valueStr;
  }
}


CsvFileLayer.prototype.addLayer = function addLayer(opts) {
  // (someday) Use csv.createlab.org as translation gateway
  // url = 'http://csv.createlab.org/' + url.replace(/^https?:\/\//,'')

  var nickname = opts["nickname"];
  var url = opts["url"];
  var name = opts["name"];
  var credit = opts["credit"];
  var scalingFunction = opts["scalingFunction"];
  var mapType = opts["mapType"];
  var color = opts["color"];
  var legendContent = opts["legendContent"];
  var externalGeojson = opts["externalGeojson"];
  var category = opts["category"];
  var category_id = category ? "category-" + category.trim().replace(/ /g,"-").toLowerCase() : "csvlayers_table";
  var playbackRate = typeof opts["playbackRate"] == "undefined" ? null : opts["playbackRate"];
  var masterPlaybackRate = typeof opts["masterPlaybackRate"] == "undefined" ? null : opts["masterPlaybackRate"];
  var nLevels = typeof opts["nLevels"] == "undefined" ? 0 : parseInt(opts["nLevels"]);
  var layerOptions = {
    tileWidth: 256,
    tileHeight: 256,
    nLevels: nLevels,
    scalingFunction: scalingFunction,
    layerId: nickname,
    loadDataFunction: WebGLVectorTile2.prototype._loadBubbleMapDataFromCsv,
    dataLoadedFunction: this.dataLoadedFromCsv.bind(this),
    drawFunction: WebGLVectorTile2.prototype._drawBubbleMap,
    fragmentShader: WebGLVectorTile2.bubbleMapFragmentShader,
    vertexShader: WebGLVectorTile2.bubbleMapVertexShader,
    externalGeojson: externalGeojson,
    numAttributes: 6
  };
  var WebglLayer = WebglVectorLayer2;
  if (mapType == 'raster') {
    WebglLayer = WebglMapLayer;
    url = eval(url);
    layerOptions['fragmentShader'] = null;
    layerOptions['vertexShader'] = null;
    layerOptions['drawFunction'] = null;
    layerOptions["loadDataFunction"] = null;
  }
  else if (mapType == "choropleth") {
    layerOptions.loadDataFunction = WebGLVectorTile2.prototype._loadChoroplethMapDataFromCsv;
    layerOptions.drawFunction = WebGLVectorTile2.prototype._drawChoroplethMap;
    layerOptions.fragmentShader = WebGLVectorTile2.choroplethMapFragmentShader;
    layerOptions.vertexShader = WebGLVectorTile2.choroplethMapVertexShader;
    layerOptions.imageSrc =  "obesity-color-map.png";
  } else if (mapType == "point-flow") {
    layerOptions.loadDataFunction = WebGLVectorTile2.prototype._loadData;
    if (opts["drawFunction"]) {
      layerOptions.drawFunction = eval(opts["drawFunction"]);
    }
    if (opts["numAttributes"]) {
      layerOptions.numAttributes = opts["numAttributes"];
    }
    if (opts["vertexShader"]) {
      layerOptions.vertexShader = eval(opts["vertexShader"]);
    }
    if (opts["fragmentShader"]) {
      layerOptions.fragmentShader = eval(opts["fragmentShader"]);
    }
  } else {
    if (opts["loadDataFunction"]) {
      layerOptions.loadDataFunction = eval(opts["loadDataFunction"]);
    }
    if (opts["setDataFunction"]) {
      layerOptions.setDataFunction = eval(opts["setDataFunction"]);
    }
    if (opts["drawFunction"]) {
      layerOptions.drawFunction = eval(opts["drawFunction"]);
    }
    if (opts["numAttributes"]) {
      layerOptions.numAttributes = opts["numAttributes"];
    }
    if (opts["vertexShader"]) {
      layerOptions.vertexShader = eval(opts["vertexShader"]);
    }
    if (opts["fragmentShader"]) {
      layerOptions.fragmentShader = eval(opts["fragmentShader"]);
    }
  }

  var layer = new WebglLayer(glb, canvasLayer, url, layerOptions);
  layer.options = layer.options || {};
  if (color) {
    layer.options.color = color;
  }
  var re = /_paired/;
  var m = nickname.match(re)
  if (m) {
    layer.paired = true;
  } else {
    layer.paired = false;
  }

  layer.opts = opts;
  this.layers.push(layer);

  var id = 'show-csv-' + nickname;
  var row = '<tr class="csvlayer"><td><label name="' + nickname + '">';
  row += '<input type="checkbox" id="' + id + '">';
  row += name;
  row += '</label></td></tr>';

  // Default category
  if (category_id == "category-other") {
    category_id = "csvlayers_table";
  }

  if ($('#' + category_id).length == 0) {
    $(".map-layer-div #other_table").prev("h3").before("<h3>" + category + "</h3><table id='" + category_id + "'></table>");
  }

  $('#' + category_id).append(row);

  // Handle click event to turn on and off layer
  $('#' + id).on("click", function() {
    if ($(this).prop('checked')) {
      // Turn on layer
      if (visibleBaseMapLayer != "dark") {
        $("#dark-base").click();
      }
      setActiveLayersWithTimeline(1);
      timelineType = "defaultUI";
      requestNewTimeline(nickname + ".json", timelineType);
      layer.visible = true;
      $("#" + nickname + "-legend").show();
      if (mapType == "choropleth") {
        showCountryLabelMapLayer = true;
      }
      if (masterPlaybackRate && playbackRate) {
        timelapse.setMasterPlaybackRate(masterPlaybackRate);
        timelapse.setPlaybackRate(playbackRate);
      }

    } else {
      $("#" + nickname + "-legend").hide();
      setActiveLayersWithTimeline(-1);
      doSwitchToLandsat();
      // Turn off layer
      layer.visible = false;
      if (mapType == "choropleth") {
        showCountryLabelMapLayer = false;
      }
      if (masterPlaybackRate && playbackRate) {
        timelapse.setMasterPlaybackRate(1);
        timelapse.setPlaybackRate(defaultPlaybackSpeed);
        timelapse.setMaxScale(landsatMaxScale);
      }

    }
  }).prop('checked', layer.visible);
}


CsvFileLayer.prototype.addDataLoadedListener = function addDataLoadedListener(listener) {
  if (typeof(listener) === "function") {
    this.dataLoadedListeners.push(listener);
  }
};


CsvFileLayer.prototype.removeDataLoadedListener = function removeDataLoadedListener(listener) {
  for (var i = 0; i < this.dataLoadedListeners.length; i++) {
    if (this.dataLoadedListeners[i] == listener) {
      this.dataLoadedListeners.splice(i, 1);
      break;
    }
  }
};


CsvFileLayer.prototype.dataLoadedFromCsv = function dataLoadedFromCsv(layerId) {
  for (var i = 0; i < this.dataLoadedListeners.length; i++) {
    this.dataLoadedListeners[i](layerId);
  }
};


CsvFileLayer.prototype.loadLayersFromTsv = function loadLayersFromTsv(layerDefinitions) {
  var that = this;

  that.layersData = Papa.parse(layerDefinitions, {delimiter: "\t", header: true});

  for (var i =  0; i < that.layersData['data'].length; i++) {
    var layer = that.layersData['data'][i];
    if (layer["Enabled"] == "TRUE") {
      var layerIdentifier = layer["Share link identifier"].replace(/\W+/g, '_');
      var promotedUrl = layer["URL"].replace("http://", "https://");

      var scalingFunction = layer["Scaling"].trim();
      if (scalingFunction == '') {
        scalingFunction = 'd3.scaleSqrt().domain([minValue, maxValue]).range([0, 100])';
      }

      var mapType = layer["Map Type"].trim();
      if (mapType == "") {
        mapType = "bubble";
      }

      var optionalColor = layer["Color"].trim();
      if (optionalColor) {
        optionalColor = JSON.parse(optionalColor);
      }

      var legendContent = "";
      if (typeof layer["Legend Content"] != "undefined") {
        legendContent = layer["Legend Content"].trim();
      }

      var legendKey = typeof layer["Legend Key"] != 'undefined' ? layer["Legend Key"].trim() : '';

      var externalGeojson = "";
      if (typeof layer["External GeoJSON"] != "undefined") {
        externalGeojson = layer["External GeoJSON"].trim()
      }

      var nLevels = 0;
      if (typeof layer["Number of Levels"] != "undefined") {
        nLevels = layer["Number of Levels"].trim();
        if (nLevels == "") {
          nLevels = 0;
        }
      }

      var loadDataFunction = layer["Load Data Function"];
      var setDataFunction = layer["Set Data Function"];
      var numAttributes = layer["Number of Attributes"];
      var vertexShader = layer["Vertex Shader"];
      var fragmentShader = layer["Fragment Shader"];
      var drawFunction = layer["Draw Function"];
      var playbackRate = layer["Playback Rate"];
      var masterPlaybackRate = layer["Master Playback Rate"];

      var opts = {
        nickname: layerIdentifier,
        url: promotedUrl,
        name: layer["Name"],
        credit: layer["Credits"],
        category: layer["Category"],
        scalingFunction: scalingFunction,
        mapType: mapType,
        color: optionalColor,
        legendContent: legendContent,
        legendKey: legendKey,
        externalGeojson: externalGeojson,
        loadDataFunction: loadDataFunction,
        setDataFunction: setDataFunction,
        numAttributes: numAttributes,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        drawFunction: drawFunction,
        playbackRate: playbackRate,
        masterPlaybackRate: masterPlaybackRate,
        nLevels: nLevels
      }

      this.addLayer(opts);
      this.setTimeLine(layerIdentifier,
        layer["Start date"], // start date
        layer["End date"], // end date
        layer["Step"]); // step size
    }

  }
  // New layers have been added, so refresh the layer panel
  $(".map-layer-div").accordion("refresh");
};

CsvFileLayer.prototype.loadLayers = function loadLayers(path) {
  if (path == csvlayersLoadedPath) return;
  csvlayersLoadedPath = path;
  var url = path;

  var that = this;

  // Clear out any csv layers that have already been loaded
  $("#csvlayers_table, .csvlayer").find("input:checked").trigger("click");
  $(".csvlayer").remove();
  $("#csvlayers_table").empty();
  that.layers = [];

  if (path.indexOf(".tsv") != -1) {
    // Load local version of the csv .tsv file
    $.ajax({
      url: path,
      dataType: "text",
      success: function(csvdata) {
        that.loadLayersFromTsv(tsvdata);
      }
    });
    return;
  } else if (path.indexOf("http") != 0) {
    var docId = path.split('.')[0];
    var tabId = path.split('.')[1];
    url = 'https://docs.google.com/spreadsheets/d/' + docId + '/edit';
    if (tabId) {
      url += '#gid=' + tabId;
    }
  }
  org.gigapan.Util.gdocToJSON(url, function(tsvdata) {
    that.loadLayersFromTsv(tsvdata);
  });
};


CsvFileLayer.prototype.setTimeLine = function setTimeLine(identifier, startDate, endDate, step) {
  var captureTimes = [];

  var yyyymm_re = /(\d{4})(\d{2})$/;
  var sm = startDate.match(yyyymm_re);
  var em = endDate.match(yyyymm_re);
  if (sm && em) {
    var startYear = sm[1];
    var startMonth = sm[2];
    var endYear = em[1];
    var endMonth = em[2];
    startYear = parseInt(startYear, 10);
    startMonth = parseInt(startMonth, 10);
    endYear = parseInt(endYear, 10);
    endMonth = parseInt(endMonth, 10);


    if (isNaN(startYear) || isNaN(endYear) || isNaN(startMonth) || isNaN(endMonth) ) {
      captureTimes = cached_ajax['landsat-times.json']['capture-times'];
    } else {
      function pad(n) {
        return (n < 10) ? ("0" + n) : n;
      }
      for (var i = startYear; i <= endYear; i++) {
        var beginMonth = 1;
        var stopMonth = 12;
        if (i == startYear) {
          beginMonth = startMonth;
        }
        if (i == endYear) {
          stopMonth = endMonth;
        }
        for (var j = beginMonth; j <= stopMonth; j++) {
          captureTimes.push(pad(i.toString()) + "-" + pad(j.toString()));
        }
      }
    }
  } else  {
    startDate = parseInt(startDate,10);
    endDate = parseInt(endDate,10);
    step = parseInt(step,10);
    if (isNaN(startDate) || isNaN(endDate) || isNaN(step) ) {
      captureTimes = cached_ajax['landsat-times.json']['capture-times'];
    } else {
      for (var i = startDate; i < endDate + 1; i+=step) {
        captureTimes.push(i.toString());
      }

    }

  }
  cached_ajax[identifier + '.json'] = {"capture-times":  captureTimes};
};

CsvFileLayer.prototype.setLegend = function setLegend(id) {
  var layer;
  for (var i = 0; i < this.layers.length; i++) {
    if (this.layers[i]['_layerId'] == id) {
      layer = this.layers[i];
      break;
    }
  }
  if (typeof layer != 'undefined') {
    if (layer['opts']['mapType'] == 'bubble') {
      if (layer['opts']['legendContent'] == 'auto') {
        var radius = layer['_tileView']['_tiles']['000000000000000']['_radius'];
        var opts = {
          'id' : id,
          'title': layer['opts']['name'],
          'credit': layer['opts']['credit'],
          'keys': [],
          'circles': [{'value': this.formatValue(radius.invert(50.0)), 'radius': '25.0'},{'value': this.formatValue(radius.invert(80.0)), 'radius': '40.0'},{'value': this.formatValue(radius.invert(100.0)), 'radius': '50.0'}]
        };
        if (layer['opts']['legendKey'] != '') {
          var rgba = layer['opts']['color'].map(function(x) {
            return x * 255.;
          });
          opts["keys"].push({'color': 'rgb('+ rgba[0] +',' + rgba[1] +',' + rgba[2] + ')', 'str': layer['opts']['legendKey']});
        }
        var legend = new BubbleMapLegend(opts);
        $('#legend-content table tr:last').after(legend.toString());
        $("#" + id + "-legend").show();
      } else {
        var div = '<div style="font-size: 15px">' + layer['opts']["name"] + '<span class="credit"> ('+ layer['opts']["credit"] +')</span></div>';
        var str = div + layer['opts']['legendContent'];
        var opts = {
          'id' : id,
          'str': str
        }
        var legend = new BubbleMapLegend(opts);
        $('#legend-content table tr:last').after(legend.toString());
        $("#" + id + "-legend").show();

      }

    } else if (layer['opts']['mapType'] == 'choropleth') { // Assume choropleth
      if (layer['opts']['legendContent'] == 'auto') {
        var radius = this.layers[i]['_tileView']['_tiles']['000000000000000']['_radius'];
        var opts = {
            'id': id,
            'title': layer['opts']['name'],
            'credit': layer['opts']['credit'],
            'keys': [],
            'colors': ["#ffffff", "#fff18e", "#ffdc5b", "#ffc539", "#ffad21", "#ff920c", "#ff7500", "#ff5000", "#ff0000"],
            'values': [this.formatValue(radius.invert(0)), this.formatValue(radius.invert(0.5)), this.formatValue(radius.invert(1))]
        }
        if (layer['opts']['legendKey'] != '') {
          opts["keys"].push({'str': layer['opts']['legendKey']});
        }

        var legend = new ChoroplethLegend(opts)
        $('#legend-content table tr:last').after(legend.toString());
        $("#" + id + "-legend").show();
      } else {
        var div = '<div style="font-size: 15px">' + layer['opts']["name"] + '<span class="credit"> ('+ layer['opts']["credit"] +')</span></div>';
        var str = div + layer['opts']['legendContent'];
        var opts = {
          'id' : id,
          'str': str
        }
        var legend = new ChoroplethLegend(opts);
        $('#legend-content table tr:last').after(legend.toString());
        $("#" + id + "-legend").show();

      }
    } else {
        var str = '';
        if (layer['opts']['legendContent'] == '') {
          var div = '<div style="font-size: 15px">' + layer['opts']["name"] + '<span class="credit"> ('+ layer['opts']["credit"] +')</span></div>';
          str = div;
        } else {
          str = layer['opts']['legendContent'];
        }
        var opts = {
          'id' : id,
          'str': str
        }
        var legend = new Legend(id, str);
        $('#legend-content table tr:last').after(legend.toString());
        $("#" + id + "-legend").show();

    }
  }
}

var COUNTRY_POLYGONS = null;
var xhr = new XMLHttpRequest();
xhr.open('GET', "country_polygons.geojson");
xhr.onload = function() {
    COUNTRY_POLYGONS = JSON.parse(this.responseText);
}
xhr.send();


function searchCountryList(feature_collection, name) {
  for (var i = 0; i < feature_collection['features'].length; i++) {
    var feature = feature_collection['features'][i];
    var names = feature['properties']['names'];
    for (var j = 0; j < names.length; j++) {
      if (name == names[j]) {
        //return feature['properties']['webmercator'];
        return feature;
      }
    }
  }
  return {};
};
