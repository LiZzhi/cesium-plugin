import * as Cesium from "cesium";
import { Viewer, Entity, DistanceDisplayCondition } from "cesium";
import { getTerrainMostDetailedHeight } from "../../Utils/tool";
import type { worldDegreesType } from "../../Type";

type styleType = {
    image?: string; //图标
    lineHeight?: number;    //线长
    bounceHeight?: number;  //距线顶高差
    increment?: number; //增量
    distanceDisplayCondition?: DistanceDisplayCondition; // 可见范围
}

export default class floatPoint{
    #viewer: Viewer;
    #worldDegrees: worldDegreesType;
    #style: styleType;
    #entity: Entity|undefined;

    /**
     * @description: 浮动点
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
    async #createPoint(){
        const terrainHeight = await getTerrainMostDetailedHeight(this.#viewer, 
            this.#worldDegrees.lon,
            this.#worldDegrees.lat
        );
        const pointHeight = terrainHeight + (this.#worldDegrees.height || 0);
        const floatHeightMin = pointHeight + this.#style.lineHeight!;
        const floatHeightMax = floatHeightMin + this.#style.bounceHeight!;
        let heightControl = true;
        let floatHeightNow = floatHeightMin;
        // @ts-ignore
        this.#entity!.position = new Cesium.CallbackProperty (()=>{
            if (heightControl) {
                floatHeightNow += this.#style.increment!;
                floatHeightNow >= floatHeightMax && (heightControl = false);
            } else {
                floatHeightNow -= this.#style.increment!;
                floatHeightNow <= floatHeightMin && (heightControl = true);
            }
            return Cesium.Cartesian3.fromDegrees(this.#worldDegrees.lon, this.#worldDegrees.lat, floatHeightNow);
        }, false);

        this.#entity!.billboard = new Cesium.BillboardGraphics({
            image: this.#style.image,
            height: 78,
            width: 42,
            // heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: this.#style.distanceDisplayCondition
        })
        this.#entity!.polyline = new Cesium.PolylineGraphics({
            show: true,
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                this.#worldDegrees.lon, this.#worldDegrees.lat, pointHeight,
                this.#worldDegrees.lon, this.#worldDegrees.lat, floatHeightMin
            ]),
            //  material: Cesium.Color.AQUA.withAlpha(0.8),
            material: new Cesium.PolylineDashMaterialProperty({color: Cesium.Color.AQUA}),
            width: 2,
            distanceDisplayCondition: this.#style.distanceDisplayCondition
        })
    }

    /**
     * @description: 获取默认样式
     * @return {*}
     */
    get defaultStyle(): styleType{
        return {
            image: 'public/img/floatPoint/float.png',//图标
            lineHeight: 16, //线高
            bounceHeight: 1, //高度
            increment: 0.008, //增量
            // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000), // 可见范围
        }
    }
}