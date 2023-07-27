import * as Cesium from "cesium";
import { Viewer, Color, Entity, NearFarScalar, DistanceDisplayCondition } from "cesium";
import { getTerrainMostDetailedHeight } from "../../Utils/tool";
import type { worldDegreesType } from "../../Type";

type styleType = {
    color?: Color,  // 颜色
    iconUrl?: string,   // 图标
    pixelSize?: number, // 最小size
    pixelMax?: number,  // 最大size
    outWidth?: number   // 轮廓宽
    nearFarScalar?: NearFarScalar,  // 缩放比例
    distanceDisplayCondition?: DistanceDisplayCondition,    // 可见范围
}

export default class flickerPoint{
    #viewer: Viewer;
    #worldDegrees: worldDegreesType;
    #style: styleType;
    #entity: Entity|undefined;

    /**
     * @description: 闪烁点
     * @param {Viewer} viewer viewer
     * @param {worldDegreesType} worldDegrees 位置，经纬度和高
     * @param {styleType} style (可选)样式
     * @return {*}
     */
    constructor(viewer: Viewer, worldDegrees: worldDegreesType, style:styleType={}){
        this.#viewer = viewer;
        this.#worldDegrees = worldDegrees;
        this.#style = Object.assign(this.defaultStyle, style);
        this.#entity = new Cesium.Entity();
    }

    /**
     * @description: 创建
     * @return {*}
     */
    async init(){
        this.#viewer.entities.add(this.#entity!);
        this.#createPoint();
    }

    /**
     * @description: 销毁
     * @return {*}
     */
    destroy(){
        this.#viewer.entities.remove(this.#entity!);
        this.#entity = undefined;
    }

    /**
     * @description: 设置可见性
     * @param {boolean} show 是否可见
     * @return {*}
     */
    setVisible(show: boolean){
        this.#entity!.show = show;
    }

    /**
     * @description: 获取可见性
     * @return {boolean}
     */
    getVisible(){
        return this.#entity!.show;
    }

    /**
     * @description: 创建特效
     * @return {*}
     */
    #createPoint(){
        let pointOpacity = 1, colorControl = true;
        let pixelSize = this.#style.pixelSize, sizeControl = true;
        let outLineOpacity = 0.7, outLineControl = true;
        this.#entity!.position = new Cesium.ConstantPositionProperty (
            Cesium.Cartesian3.fromDegrees(this.#worldDegrees.lon, this.#worldDegrees.lat, this.#worldDegrees.height || 0)
        );
        this.#entity!.point = new Cesium.PointGraphics({
            color: new Cesium.CallbackProperty(() => {
                if (colorControl) {
                    pointOpacity -= 0.3;
                    pointOpacity <= 0 && (colorControl = false);
                } else {
                    colorControl = true;
                    pointOpacity = 1;
                }
                return this.#style.color!.withAlpha(pointOpacity);
            }, false),
            pixelSize: new Cesium.CallbackProperty(() => {
                if (sizeControl) {
                    pixelSize! += 2;
                    pixelSize! >= this.#style.pixelMax! && (sizeControl = false);
                } else {
                    sizeControl = true;
                    pixelSize = this.#style.pixelSize;
                }
                return pixelSize;
            }, false),
            outlineColor: new Cesium.CallbackProperty(() => {
                if (outLineControl) {
                    outLineOpacity -= 0.035;
                    outLineOpacity <= 0 && (outLineControl = false);
                } else {
                    outLineControl = true;
                    outLineOpacity = 0.7;
                }
                return this.#style.color!.withAlpha(outLineOpacity);
            }, false),
            outlineWidth: this.#style.outWidth,
            scaleByDistance: this.#style.nearFarScalar,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        })

        if (this.#style.iconUrl) {
            this.#entity!.billboard = new Cesium.BillboardGraphics({
                image: this.#style.iconUrl,
                scaleByDistance: this.#style.nearFarScalar,
                distanceDisplayCondition: this.#style.distanceDisplayCondition,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            })
        }
    }

    /**
     * @description: 获取默认样式
     * @return {*}
     */
    get defaultStyle(): styleType{
        return {
            color: Cesium.Color.RED,
            pixelSize: 10,
            pixelMax: 50,
            outWidth: 20,
            nearFarScalar: new Cesium.NearFarScalar(1200, 1, 5200, 0.4),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000),
        }
    }
}