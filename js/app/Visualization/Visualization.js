define(["Class", "SubscribableDict", "UrlValues", "Data/DataManager", "Visualization/Animation/AnimationManager", "Visualization/UI", "async"], function(Class, SubscribableDict, UrlValues, DataManager, AnimationManager, UI, async) {
  return Class({
    name: "Visualization",
    paramspec: {
      zoom: {default: 4, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "zoom", type: "number"},
      lat: {default: 39.3, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lat", type: "number"},
      lon: {default: -95.8, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lon", type: "number"},
      length: {default: 80000, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "length", type: "number"},
      offset: {default: 15, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 1000, urlname: "offset", type: "number"},
      time: {fromurl: UrlValues.dateFromUrl, tourl: UrlValues.dateToUrl, urlname: "time", type: Date},
      maxoffset: {default: 29, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 1000, urlname: "maxoffset", type: "number"},
      animations: {default: ["point"], fromurl: UrlValues.stringArrayFromUrl, tourl: UrlValues.stringArrayToUrl, urlname: "animations", type: Array},
      paused: {default: true, fromurl: UrlValues.boolFromUrl, tourl: UrlValues.boolToUrl, urlname: "paused", type: "boolean"},
      format: {urlname: "format", default: "tiledbin", type: "string"},
      source: {urlname: "source", type: "string"},
      nowebgl: {urlname: "nowebgl", type: "string"},
      logoimg: {urlname: "logoimg", type: "string"},
      logourl: {urlname: "logourl", type: "string"},

      timeresolution: {default: 60*60*24*1000}
    },

    initialize: function () {
      var self = this;

      self.state = new SubscribableDict(self.paramspec);
      self.urlhandler = new UrlValues(self.state, self.paramspec);

      self.state.getValue("format")

      self.data = new DataManager(self);
      self.animations = new AnimationManager(self);
      self.ui = new UI(self);

      async.series([
        self.data.init.bind(self.data),
        self.ui.init.bind(self.ui),
        self.animations.init.bind(self.animations)
      ]);
    }
  });
});
