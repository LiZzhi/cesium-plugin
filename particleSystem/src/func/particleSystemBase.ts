import * as Cesium from "cesium";
import { Viewer, Entity } from "cesium";

export default class particleSystemBase{
    #viewer: Viewer
    // #entity: Entity
    constructor(viewer: Viewer){
        this.#viewer = viewer;
    }
}