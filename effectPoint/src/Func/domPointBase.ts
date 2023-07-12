import * as Cesium from "cesium";
import { Cartesian3, Viewer } from "cesium";
import { getTerrainMostDetailedHeight } from "./tool";
import type { worldDegreesType } from "../Type";

export default class domPointBase {
    protected viewer: Viewer;
    protected worldDegrees: worldDegreesType;
    protected $container: HTMLElement;
    protected start: boolean; // 是否调用了init
    protected isDestroy: boolean; // 是否销毁
    /**
     * @description: dom点基类,不要实例化
     * @param {Viewer} viewer viewer
     * @param {worldDegreesType} worldDegrees 点经纬度坐标
     * @return {*}
     */
    constructor(viewer: Viewer, worldDegrees: worldDegreesType) {
        this.viewer = viewer;
        this.worldDegrees = worldDegrees;
        this.$container = document.createElement("div");
        this.start = false;
        this.isDestroy = false;
    }

    /**
     * @description: 创建接口
     * @return {*}
     */
    init() {}
    /**
     * @description: 销毁接口
     * @return {*}
     */
    destroy() {}

    setVisible(visible: boolean) {
        this.$container.style.display = visible ? "block" : "none";
    }

    /**
     * @description: 默认的场景渲染事件(主要是位置的修改和显示高度的限制)
     * @param {Cartesian3} position 点位笛卡尔坐标
     * @param {number} maxHeight 显示最大限制高度(超出将不显示),不传或传入0均不做限制
     * @param {function} callback 回调函数，在默认场景渲染事件之后执行
     * @return {*}
     */
    postRender(position: Cartesian3, maxHeight: number, callback: () => any) {
        if (!this.$container) return;
        const canvasHeight = this.viewer.scene.canvas.height;
        const windowPosition = new Cesium.Cartesian2();
        Cesium.SceneTransforms.wgs84ToWindowCoordinates(
            this.viewer.scene,
            position,
            windowPosition
        );
        this.$container.style.position = "absolute";
        this.$container.style.bottom =
            canvasHeight - windowPosition.y + 10 + "px";
        this.$container.style.left = windowPosition.x + "px";
        if (maxHeight) {
            if (this.viewer.camera.positionCartographic.height > maxHeight) {
                this.$container.style.display = "none";
            } else {
                this.$container.style.display = "block";
            }
        }
        if (callback && typeof callback === "function") {
            callback();
        }
    }

    /**
     * @description: 计算实际位置(地形高)
     * @param {Viewer} viewer viewer
     * @param {worldDegreesType} worldDegrees 点经纬度坐标
     * @return {Promise<Cartesian3>} 实际位置
     */
    protected async computePosition(
        viewer: Viewer,
        worldDegrees: worldDegreesType
    ): Promise<Cartesian3> {
        const terrainHeight = await getTerrainMostDetailedHeight(
            viewer,
            worldDegrees.lon,
            worldDegrees.lat
        );
        return Cesium.Cartesian3.fromDegrees(
            worldDegrees.lon,
            worldDegrees.lat,
            terrainHeight + (worldDegrees.height || 0)
        );
    }
}
