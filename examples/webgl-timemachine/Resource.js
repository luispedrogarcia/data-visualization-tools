// Creates index and stores in 'hash' field, toplevel
// To use as transform callback, call parseAndIndexGeojson.bind(null, 'yourNameKey')

function parseAndIndexGeojson(nameKey, geojsonTxt, done) {
  var geojson = JSON.parse(geojsonTxt);
  geojson.hash = {};
  nameKey = nameKey || 'names';

  for (var i = 0; i < geojson.features.length; i++) {
    var names = geojson.features[i].properties[nameKey];
    if (!Array.isArray(names)) names = [names];

    for (var j = 0; j < names.length; j++) {
      geojson.hash[names[j]] = i;
    }
  }
  done(geojson);
}


/**
 * Create Resource, but don't fetch it yet.
 * @param {string} url
 * @param {object} options  Optional settings
 * @param {function, optional} options.transform(data, done) Transform data asynchronously, on receipt
 * @param {function, optional} options.receiveData(data)         Shortcut; registers data receiver using this.receiveData, and triggers fetch
 * @param {bool, optional} options.singleUse                 If true, discard data after calling receiveData callback(s). Defaults to False
 */

function Resource(url, options) {
  this.receiveDataCallbacks = [];
  this.url = url;
  this.transform = options.transform;
  this.singleUse = options.singleUse;
  this.format = options.format || 'string';
  if (options.receiveData) {
    this.receiveData(options.receiveData);
  }
}

/**
 * Starts url fetch if not already started.
 * Wait for data to be received and transformed (if transform provided in constructor).
 * Data will be null, if fetching gave a non-200 status or other error.
 * If data already received and transformed, call receive immediately.
 * If called multiple times during fetch, all receivers will be called on data reception+transformation.
 * If singleUse==true and data already received, throws exception.
 * @param {function} receive(data)   Callback for receiving data
 */

Resource.prototype.receiveData = function(receive) {
  if ('data' in this) {
    receive(this.data);
    return;
  }
  this.receiveDataCallbacks.push(receive);
  if (!this.xhr) {
    var resource = this;
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', this.url);

    var arrayConstructor = {
      uint32 : Uint32Array
    }[this.format];

    if (arrayConstructor) {
      this.xhr.responseType = 'arraybuffer';
    }

    this.xhr.onload = function() {
      var response;

      if (!this.responseText || this.status >= 400) {
        response = null;
      } else if (arrayConstructor) {
        response = new arrayConstructor(this.response);
      } else {
        response = this.responseText;
      }
      resource._receiveFetch(response);
    }
    this.xhr.onerror = function() { resource._receiveFetch(null); };
    this.xhr.send();
  }
}

/**
 * Discards data (if present).  Cancels XHR request (if in progress).
 * Clear, and do not call, list of receiveData callbacks.
 * Don't call transformation callbacks.
 */
Resource.prototype.unload = function() {
  delete this.data;
  if (this.xhr) {
    this.xhr.abort();
    this.xhr = null;
  }
  this.receiveDataCallbacks = [];
  this.unloaded = true;
}

/*
 * Calls receiveData from each resource in resourceList, and when all are complete,
 * call receive with a list of data received.
 */

Resource.receiveDataListFromResourceList = function(resourceList, receive) {
  var received = [];
  var neededCount = resourceList.length;

  function receiveData(i, data) {
    received[i] = data;
    if (--neededCount == 0) {
      receive(received);
    }
  }

  for (var i = 0; i < resourceList.length; i++) {
    if (!resourceList[i]) debugger;
    resourceList[i].receiveData(receiveData.bind(null, i)); // create single-arg callback by binding i
  }
}

// Internal functions

Resource._info = function(data) {
  if (typeof data == 'string') {
    return 'string of length ' + data.length;
  } else {
    return typeof data;
  }
}

Resource.prototype._receiveFetch = function(data) {
  if (this.unloaded) return;
  if (this.transform && data != null) {
    this.transform(data, this._receiveTransform.bind(this));
  } else {
    this._receiveTransform(data);
  }
}

Resource.prototype._receiveTransform = function(data) {
  if (this.unloaded) return;
  if (!this.singleUse) {
    this.data = data;
  }
  for (var i = 0; i < this.receiveDataCallbacks.length; i++) {
    this.receiveDataCallbacks[i](data);
  }
}
