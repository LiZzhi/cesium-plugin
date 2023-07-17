import * as Cesium from "cesium";
import { Cartesian3, Viewer } from "cesium";
import { getTerrainMostDetailedHeight } from "../tool";
import type { worldDegreesType } from "../../Type";

export default class domPointBase {
    protected viewer: Viewer;
    protected worldDegrees: worldDegreesType;
    protected position: Cartesian3;
    protected postRenderFunc: (...args: any[]) => void;
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
        this.worldDegrees = worldDegrees;   // 经纬度高组成的位置
        this.position = new Cesium.Cartesian3();    // 算上地形的高
        this.postRenderFunc = () => {}; // postRender事件传入的方法，注册和删除时使用
        this.$container = document.createElement("div");    // 根DOM
        this.start = false; // 点位是否创建
        this.isDestroy = false; // 点位是否销毁
    }

    /**
     * @description: 点位创建接口
     * @return {*}
     */
    init() {}
    /**
     * @description: 点位销毁接口
     * @return {*}
     */
    destroy() {}


    /**
     * @description: 控制点位显隐
     * @param {boolean} visible 是否显示
     * @return {*}
     */
    setVisible(visible: boolean) {
        this.$container.style.display = visible ? "block" : "none";
    }


    /**
     * @description: 获取当前显隐状态
     * @return { boolean } 是否显示
     */
    getVisible(){
        return this.$container.style.display === "none"? false : true
    }

    /**
     * @description: 默认的场景渲染事件(主要是位置的修改和显示高度的限制)
     * @param {number} maxHeight (可选)显示最大限制高度(超出将不显示),不传或传入0均不做限制，默认无
     * @param {function} callback (可选)回调函数，在默认场景渲染事件之后执行，默认无
     * @return {*}
     */
    postRender(maxHeight?: number, callback?: () => any) {
        let that = this;
        this.postRenderFunc = () => {
            if (!that.$container) return;
            const canvasHeight = that.viewer.scene.canvas.height;
            const windowPosition = new Cesium.Cartesian2();
            Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                that.viewer.scene,
                that.position,
                windowPosition
            );
            that.$container.style.position = "absolute";
            that.$container.style.bottom = canvasHeight - windowPosition.y + "px";
            that.$container.style.left = windowPosition.x + "px";
            if (maxHeight) {
                if (
                    that.viewer.camera.positionCartographic.height > maxHeight
                ) {
                    that.$container.style.display = "none";
                } else {
                    that.$container.style.display = "block";
                }
            }
            if (callback && typeof callback === "function") {
                callback();
            }
        };
        return this.postRenderFunc
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
