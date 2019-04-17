function ContentSearch($searchInput, $searchResults) {
  this.$searchInput = $searchInput;
  this.$searchResults = $searchResults;
  this.$searchInput.on("input", this.updateSearch.bind(this));
}

ContentSearch.prototype.updateSearch = function() {
  var trimmed = this.$searchInput.val().trim();
  var searchTokens = trimmed.toLowerCase().split(/\s+/);
  for (var i = 0; i < this.categories.length; i++) {
    this.categories[i].$elt.hide();
  }
  for (var i = 0; i < this.layerInfos.length; i++) {
    var layer = this.layerInfos[i];
    var show = true;
    for (var j = 0; j < searchTokens.length; j++) {
      if (!layer.search.includes(searchTokens[j])) {
	show = false;
	break;
      }
    }
    if (trimmed.length && show) {
      layer.$elt.show();
      layer.category.$elt.show();
    } else {
      layer.$elt.hide();
    }
  }
}

ContentSearch.prototype.labelChecked = function(elt) {
  return $('input:checked', elt).length > 0;
}

ContentSearch.prototype.changeSelection = function(layer) {
  var searchChecked = this.labelChecked(layer.$elt);
  var masterChecked = this.labelChecked(layer.master);
  if (searchChecked != masterChecked) {
    $('input', layer.master)[0].dispatchEvent(new MouseEvent('click', {clientX:100, clientY:100}));
    timelineUIHandler({target:$('input', layer.master)[0]});
    setTimeout(this.updateLayerSelectionsFromMaster.bind(this), 100);
  }
}

ContentSearch.prototype.copyLayerChecked = function(layer) {
  if (this.labelChecked(layer.$elt) != this.labelChecked(layer.master)) {
    $('input', layer.$elt).prop('checked', this.labelChecked(layer.master));
  }
}

ContentSearch.prototype.updateLayerSelectionsFromMaster = function() {
  var before = new Date().getTime();
  var masterChecked = $('input:checked', $('#layers-list')).parent();
  var searchChecked = $('input:checked', this.$searchResults).parent();
  var layersToCheck = new Set();
  for (var i = 0; i < masterChecked.length; i++) {
    layersToCheck.add(this.masterLabel2LayerInfo.get(masterChecked[i]));
  }
  for (var i = 0; i < searchChecked.length; i++) {
    layersToCheck.add(this.searchLabel2LayerInfo.get(searchChecked[i]));
  }
  layersToCheck.forEach(this.copyLayerChecked.bind(this));
}

ContentSearch.prototype.reset = function() {
  var before = new Date().getTime();
  var layersAndCategories = $('h3, label', $('#layers-list'));
  this.layerInfos = [];
  this.categories = [];
  this.masterLabel2LayerInfo = new Map();
  this.searchLabel2LayerInfo = new Map();
  var category;
  this.$searchResults.empty();
  var foundLayers = 0;
  var totalLayers = 0;
  for (var i = 0; i < layersAndCategories.length; i++) {
    var elt = layersAndCategories[i];
    if (elt.tagName == "LABEL") {
      var layerInfo = {
	category: category,
	master: elt,
	layerID: elt.getAttribute('name')
      };

      layerInfo.search = elt.innerText.toLowerCase();
      layerInfo.layer = getLayer(layerInfo.layerID);
      totalLayers++;
      if (layerInfo.layer) {
	foundLayers++;
	layerInfo.search += ' ' + layerInfo.layer.credit.toLowerCase();
	if (layerInfo.layer.layerDef) {
	  layerInfo.search += ' ' + layerInfo.layer.layerDef['Layer Description'].toLowerCase();
	}
      }
      
      var checkbox = $('<input type="checkbox">').change(this.changeSelection.bind(this, layerInfo)).css('margin-bottom','-3pt');
      layerInfo.$elt = $('<label/>').append(checkbox).append(' ' + elt.innerText).css({
	display:'block',
	'text-align':'left',
	'text-indent':'-2em',
	'margin-left':'2.5em',
	'line-height':'1.0',
	'margin-bottom':'5pt',
	color:'black'
      }).hide();
      this.$searchResults.append(layerInfo.$elt);
      this.masterLabel2LayerInfo.set(layerInfo.master, layerInfo);
      this.searchLabel2LayerInfo.set(layerInfo.$elt[0], layerInfo);
      this.layerInfos.push(layerInfo);
    } else {
      category = {
	$elt: $('<div/>').text(elt.innerText).css({
	  'text-align':'left',
	  'margin-bottom':'3pt'
	}).hide()
      };
      this.categories.push(category);
      this.$searchResults.append(category.$elt);
    }
  }
  console.log('Building contentSearch, found', foundLayers, 'of', totalLayers, 'layers');
  this.$searchInput.val('');
  this.updateSearch();
  this.$searchInput.focus();
  this.updateLayerSelectionsFromMaster();
}


