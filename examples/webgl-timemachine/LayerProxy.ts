/// <reference path="../../timemachine/js/org/gigapan/timelapse/timelapse.js"/>

import { LayerDB } from './LayerDB';
import { Utils } from './Utils';
import { Layer } from './Layer';
import { gEarthTime, stdWebMercatorNorth } from './EarthTime';

interface Timelapse {
  [key: string]: any;
}

export interface LayerDef {
  'Start date'?: string,
  'End date'?: string,
  URL?: string
}

export class LayerProxy {
  id: string;
  layerDb: LayerDB;
  category: string;
  name: string;
  _visible: boolean;
  showGraph: boolean;
  _loadingPromise: Promise<void>;
  _loaded: boolean
  options: any; // TODO: consider moving things out of options and using setDataOptions, drawOptions
  layer: Layer = null;
  _effectiveDrawOrder: any[];
  layerDef: LayerDef;

  constructor(id: string, name: string, category: string, layerDb: LayerDB) {
    console.assert(LayerProxy.isValidId(id));
    this.id = id;
    this.name = name;
    this.category = category;
    this.layerDb = layerDb;
  }

  isVisible(): boolean {
    return this._visible;
  }

  logPrefix() {
    return `${Utils.logPrefix()} Layer(${this.id})`
  }

  requestLoad() {
    if (!this.layer && !this._loadingPromise) {
      this._loadingPromise = this._load();
    }
  }

  isLoaded(): boolean {
    if (!this.layer) {
      return false;
    } else if (this.layer.isLoaded) {
      return this.layer.isLoaded();
    } else {
      return true;
    }
  }

  async _load() {
    let url = `${this.layerDb.apiUrl}layer-catalogs/${this.layerDb.databaseId.file_id_gid()}/layers/${this.id}`
    console.log(`${this.logPrefix()} Fetching ${url}`)
    this._loadFromLayerdef(await (await Utils.fetchWithRetry(url)).json());
  }

  _loadFromLayerdef(layerDef: LayerDef) {
    if (this.layer) {
      this.layer.destroy();
      this.layer = null;
    }
    this.layerDef = layerDef;
    this.layer = this.layerDb.layerFactory.createLayer(this, layerDef);
    this.layerDb.invalidateLoadedCache();
    console.log(`${this.logPrefix()} layerFactory.createLayer completed`);
  }

  // Signal layer didn't completely draw by returning false, or settings timelapse.lastFrameCompletelyDrawn false
  draw() {
    let options = {};
    // let options = {pointSize: 2};
    // if (layer.options) {
    //   $.extend(options, layer.options);
    // }

    // TODO LayerDB: uncomment and fix pairs
    // if (pairCount && isPairCandidate(layer)) {
    //   options.mode = pairCount + 1; // 2 or 3 for left or right
    //   pairCount--;
    // }

    if (!this.isLoaded()) {
      this.requestLoad();
      return false;
    }

    var layer = this.layer;

    // The timelapse projection uses bounds from landsatBasemapLayer, which might not
    // share the standard Web Mercator north bound.

    // Compute offset, if any, in units of timelapse.getView() pixels,
    // between standard Web Mercator and landsatBasemapLayer.
    var yOffset = gEarthTime.timelapse.getProjection().latlngToPoint({
      lat: stdWebMercatorNorth,
      lng: 0
    }).y;
    var view = gEarthTime.timelapse.getView();
    var timelapse2map = layer.getWidth() / gEarthTime.timelapse.getDatasetJSON().width;
    view.y -= yOffset;
    view.x *= timelapse2map;
    view.y *= timelapse2map;
    view.scale /= timelapse2map;

    this.layer.draw(view, options);
    return undefined;
  }


  // TODO(LayerDB) make sure that when time range changes, the timeline updates
  updateData(newDataProperties, refreshData, isLast) {
    if (newDataProperties) {
      $.extend(true, this, newDataProperties);
    }
    if (refreshData) {
      // TODO(LayerDB): destroy the tiles here
      //this.destroy(); //update tiles to use new data
    }
    // if (refreshTimeline) {
    //   timelines.setTimeLine(layer.id, layer.startDate, layer.endDate, layer.step);
    //   var cachedLayerTimelinePath = layer.id + ".json";
    //   //TODO determine timeline styling
    //   requestNewTimeline(cachedLayerTimelinePath, "defaultUI"); //update timeline to match new date range
    // }
  }

  // Valid share link ID is composed of A-Z, a-z, 0-9, underscore, dash
  static isValidId(id: string) {
    return !!id.match(/^[\w-]+$/);
  }

  static formatValue(value: number) {
    for (var suffix of ['', 'K', 'M', 'G', 'T', 'P']) {
      if (suffix == 'P' || Math.abs(value) < 1000) break;
      value /= 1000;
    }
    // Round to 2 digits, remove trailing zeros, and add suffix
    return value.toFixed(2).replace(/\.?0+$/, '') + suffix;
  }
}
