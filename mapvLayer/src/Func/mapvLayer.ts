import * as Cesium from "cesium";
import { Viewer } from "cesium";

// mapv 中需要检索全局 Cesium,故必须挂载
let win: any = window;
win.Cesium = Cesium;

const mapv = require("./mapvAPI/mapv.js");
const beehiveData = require("./lib/beehiveData.js").default;
const bigMigrateData = require("./lib/bigMigrateData.js").default;
const heatMapData = require("./lib/heatMapData.js").default;
const migrateData = require("./lib/migrateData.js").default;
const squareGraphData = require("./lib/squareGraphData.js").default;
const strongBoundaryData = require("./lib/strongBoundaryData.js").default;

export default class mapVLayer {
    #viewer: Viewer;
    #Layer: any[];
    constructor(viewer: Viewer) {
        this.#viewer = viewer;
        this.#Layer = [];
    }

    /**
     * 初始化图层
     * @param dataSet 数据
     * @param options mapv 图层参数
     */
    createLayer(options: any[][]) {
        this.destroy();
        options.forEach((v) => {
            let mapVLayer = new mapv.cesiumMapLayer(this.#viewer, ...v);
            this.#Layer.push(mapVLayer);
        });
    }

    /**
     * 蜂巢图数据 https://mapv.baidu.com/examples/#baidu-map-point-honeycomb.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    beehiveOptions(): any[][] {
        // 构造数据
        let data = beehiveData();
        return data;
    }

    /**
     * 大迁徙图数据 https://mapv.baidu.com/examples/#qianxi-time.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    bigMigrateOptions(): any[][] {
        let data = bigMigrateData();
        return data;
    }

    /**
     * 热力图数据 https://mapv.baidu.com/examples/#baidu-map-point-heatmap.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    heatMapOptions(): any[][] {
        let data = heatMapData();
        return data;
    }

    /**
     * 迁徙图数据 https://mapv.baidu.com/examples/#qianxi.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    migrateOptions(): any[][] {
        let data = migrateData();
        return data;
    }

    /**
     * 方格图数据 https://mapv.baidu.com/examples/#baidu-map-point-grid.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    squareGraphOptions(): any[][] {
        let data = squareGraphData();
        return data;
    }

    /**
     * 强边界图数据 https://mapv.baidu.com/examples/#qianxi-time.html
     * @returns { any[][] } [[dataSet1, options1], [dataSet2, options2], ...]
     */
    strongBoundaryOptions(): any[][] {
        let data = strongBoundaryData();
        return data;
    }

    /**
     * 销毁图层
     */
    destroy() {
        this.#Layer.forEach((element) => {
            element.destroy();
        });
        this.#Layer.length = 0;
    }
}
