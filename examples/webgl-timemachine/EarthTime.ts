// While this is implemented in index.ts, we create an interface and shared variable for all modules that import
// We also set window.gEarthTime for js files

import { GSheet } from './GSheet'
import { LayerDB } from './LayerDB'
import { Glb } from './Glb'

export interface EarthTime {
    startRedraw();
    readyToDraw: boolean;
    canvasLayer: any;
    glb: Glb;
    layerDB: LayerDB;
    layerDBPromise: Promise<void>;
    setDatabaseID: (databaseID: GSheet)=>Promise<void>;
    LayerDBLoaded: ()=>Promise<void>;
    timelapse: any;
    rootTilePath: string;
    gmapsZoomLevel(): number;
    timelapseZoom(): number;
    currentEpochTime(): number;
    currentDate(): Date;
    currentEpochTime(): number;
    timelapseCurrentTimeDelta(): number;
  };

export var gEarthTime: EarthTime;

export function setGEarthTime(et: EarthTime) {
    (window as any).gEarthTime = gEarthTime = et;
}

  