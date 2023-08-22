/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-21 19:09:29
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 11:29:20
 * @FilePath: \cesium-plugin\effectPoint\src\Func\effectPoint\primitiveCluster.ts
 * @Description: primitive聚合(测试版)
 */
import * as Cesium from "cesium";
import {
    Viewer,
    Cartographic,
    Cartesian3,
    Rectangle,
    Billboard,
    Label,
    PointPrimitive,
    PrimitiveCollection,
    PointPrimitiveCollection,
    BillboardCollection,
    LabelCollection,
} from "cesium";
import { getTerrainMostDetailedHeight, isVisible } from "../../Utils/tool";
import kdbush from "../../Utils/kdbush";

export type clusterBoardType = {
    position: Cartesian3;
    index: number[];
};

export type callBackParamsType = {
    cluster: boolean;
    billboard: Billboard | undefined;
    label: Label | undefined;
    point: PointPrimitive | undefined;
    element: clusterBoardType;
}

export type clusterOptionType = {
    enabled?: boolean;  // 是否启用聚合
    pixelRange?: number;    // 聚合像素范围
    /**
     * 聚合开启临界，当前屏幕内实体数量低于此时无需聚合
     * 此项非常重要，由于computeViewRectangle获取屏幕范围不准确问题，当点位较为密集时
     * 聚合可能无法解除，故应找到一个不卡且能正常显示的值，可根据实际情况测试
     */
    minimumClusterSize?: number;
    percentageChanged?: number; // 相机灵敏度(0.0 - 1.0)
    relativeToCround?: boolean; // 是否为地形上的高度
    clusterBillboards?: boolean;    // 是否显示billboards
    clusterLabels?: boolean;    // 是否显示label
    clusterPoints?: boolean;    // 是否显示point
    callBack?: (p: callBackParamsType) => void;   // 回调
};

export default class primitiveCluster {
    #viewer: Viewer;
    #cartographicPoints: Cartographic[];
    #cartesianPoints: Cartesian3[];
    #options: clusterOptionType;
    #clusterCollection: PrimitiveCollection;
    #clusterBillboardCollection: BillboardCollection;
    #clusterLabelCollection: LabelCollection;
    #clusterPointCollection: PointPrimitiveCollection;
    #kdbush: kdbush | null;
    #antiShake: boolean;
    #isFinish: boolean;
    #isStart: boolean;
    #visible: boolean;
    /**
     * @description: primitive聚合
     * @param {Viewer} viewer
     * @param {Cartographic} points 弧度坐标数组
     * @param {clusterOptionType} options 配置项
     * @return {*}
     */
    constructor(viewer: Viewer, points: Cartographic[], options?: clusterOptionType) {
        this.#viewer = viewer;
        this.#cartographicPoints = points;
        this.#cartesianPoints = [];
        this.#options = Object.assign(this.defaultOption, options);
        // 实体集合
        this.#clusterBillboardCollection = new Cesium.BillboardCollection({ scene: viewer.scene });
        this.#clusterLabelCollection = new Cesium.LabelCollection({ scene: viewer.scene });
        this.#clusterPointCollection = new Cesium.PointPrimitiveCollection();
        // 总集合
        this.#clusterCollection = new Cesium.PrimitiveCollection();
        this.#kdbush = null;
        // 相机事件防抖用, 事件执行会变成true, 结束变回false才允许下一次事件执行
        // 防止上一次没执行完导致下一次执行, 集合removeAll未能正确清空问题
        this.#antiShake = false;
        // 是否构建完索引
        this.#isFinish = false;
        // 是否构建
        this.#isStart = false;
        // 显隐
        this.#visible = true;
    }

    /**
     * @description: (异步)构建索引
     * @return {*}
     */
    async finish(){
        if(!this.#isFinish){
            this.#kdbush = new kdbush(this.#cartographicPoints.length, 64, Float32Array);
            const newPositions:Cartographic[] = [];
            for (let i = 0; i < this.#cartographicPoints.length; i++) {
                const {longitude, latitude, height} = this.#cartographicPoints[i];
                let h = 0;
                if(this.#options.relativeToCround){
                    // 是否计算地形高
                    h = await getTerrainMostDetailedHeight(
                        this.#viewer,
                        Cesium.Math.toDegrees(longitude),
                        Cesium.Math.toDegrees(latitude)
                    );
                }
                newPositions.push(new Cesium.Cartographic(longitude, latitude, h + height));
                // 存储一份笛卡尔坐标用来直接读取位置
                this.#cartesianPoints.push(
                    Cesium.Cartesian3.fromRadians(
                        longitude, latitude, h + height,
                        this.#viewer.scene.globe.ellipsoid
                    )
                );
                this.#kdbush!.add(longitude, latitude);
            }
            // 替换源数据
            this.#cartographicPoints = newPositions;
            // 构建索引
            this.#kdbush.finish();
            this.#isFinish = true;
        }
    }

    /**
     * @description: 开启聚合,先执行finish方法可大幅度提高首次聚合速度
     * @return {*}
     */
    start() {
        if(!this.#isStart){
            this.destroy();
            this.#isStart = true;
            const primitives = this.#viewer.scene.primitives;
            this.#clusterCollection.add(this.#clusterBillboardCollection);
            this.#clusterCollection.add(this.#clusterLabelCollection);
            this.#clusterCollection.add(this.#clusterPointCollection);
            primitives.add(this.#clusterCollection);
            this.#viewer.camera.percentageChanged = this.#options.percentageChanged || 0.2;
            if(this.#isFinish){
                this.#createCulsterEvent();
                this.#viewer.camera.changed.addEventListener(this.#createCulsterEvent, this);
            } else {
                this.finish().then(()=>{
                    this.#createCulsterEvent();
                    this.#viewer.camera.changed.addEventListener(this.#createCulsterEvent, this);
                }).catch((e:any)=>{
                    console.log(e);
                })
            }
        }
    }

    /**
     * @description: 销毁
     * @return {*}
     */
    destroy(){
        if(this.#isStart){
            this.#viewer.scene.primitives.remove(this.#clusterCollection);
            this.#viewer.camera.changed.removeEventListener(this.#createCulsterEvent, this);
            this.#clusterCollection && this.#clusterCollection.removeAll();
            this.#clusterBillboardCollection && this.#clusterBillboardCollection.removeAll();
            this.#clusterLabelCollection && this.#clusterLabelCollection.removeAll();
            this.#clusterPointCollection && this.#clusterPointCollection.removeAll();
            this.#isStart = false;
            this.#antiShake = false;
        }
    }

    /**
     * @description: 设置可见性
     * @param {boolean} visible 是否可见
     * @return {*}
     */
    setVisible(visible: boolean){
        if(this.#isStart){
            this.#visible = visible;
            this.#clusterCollection.show = visible;
        }
    }

    /**
     * @description: 获取可见性
     * @return {boolean} 是否可见
     */
    getVisible(){
        return this.#visible;
    }

    /**
     * @description: 聚合事件(正在使用)
     * @return {*}
     */
    async #createCulsterEvent() {
        if (!this.#antiShake) {
            this.#antiShake = true;
            const scene = this.#viewer.scene;
            const options = this.#options;
            this.#clusterBillboardCollection.removeAll();
            this.#clusterLabelCollection.removeAll();
            this.#clusterPointCollection.removeAll();
            if (!(options.clusterBillboards || options.clusterLabels || options.clusterPoints) || !this.#visible) {
                // 不显示，就不用折腾了
                this.#antiShake = false;
                return;
            }
            const rectBoundary = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
            if (rectBoundary) {
                const { north, east, south, west } = rectBoundary;
                const result = this.#kdbush!.range(west, south, east, north);
                console.log("result", result);
                // 临时字典，用来记录当前点是否已被聚合
                const nowPoints: Map<number, boolean> = new Map();
                for (let i = 0; i < result.length; i++) {
                    nowPoints.set(result[i], false);
                }
                // 计算聚合结果
                const endCluster = await this.#computedCulster(nowPoints);
                // 展示聚合结果
                if (endCluster) {
                    const offset = new Cesium.Cartesian2(0, -50);
                    for (let i = 0; i < endCluster.length; i++) {
                        // 回调参数
                        const element = endCluster[i];
                        let cluster, billboard, label, point;
                        // 创建实体
                        if (options.clusterBillboards) {
                            billboard = this.#clusterBillboardCollection.add({
                                position: element.position,
                                image: "public/img/pointCluster/bluecamera.png",
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            });
                        }
                        if (options.clusterLabels && element.index.length > 1) {
                            label = this.#clusterLabelCollection.add({
                                position: element.position,
                                text: element.index.length + '',
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                pixelOffset: offset,

                            });
                        }
                        if (options.clusterPoints) {
                            this.#clusterPointCollection.add({
                                position: element.position,
                            });
                        }
                        // 是否聚合
                        cluster = element.index.length >= 2;
                        // 回调
                        typeof options.callBack === 'function' && options.callBack({
                            cluster,
                            billboard,
                            label,
                            point,
                            element,
                        })
                    }
                }
            }
            this.#antiShake = false;
        }
    }

    /**
     * @description: 计算聚合点位
     * @param {Map<number, boolean>} points 屏幕内点位字典
     * @return {clusterBoardType[]|undefined} 聚合点
     */
    async #computedCulster(points: Map<number, boolean>) {
        // 计算聚合范围
        const boxSide = this.#computedPixedBox(this.#options.pixelRange!);
        if (boxSide) {
            const endCluster: clusterBoardType[] = [];
            const halfLon = boxSide.lonDis / 2;
            const halfLat = boxSide.latDis / 2;
            // 判断是否允许聚合
            if (points.size > (this.#options.minimumClusterSize || 1)) {
                for (const iterator of points.keys()) {
                    // 遍历每个点时得聚合状态
                    const clustered = points.get(iterator);
                    if (clustered) {
                        // 如果已被聚合则跳过
                        continue;
                    } else {
                        // 当前点坐标
                        const radian = this.#cartographicPoints[iterator];
                        points.set(iterator, true);
                        // 范围查询
                        const minX = radian.longitude - halfLon, minY = radian.latitude - halfLat;
                        const maxX = radian.longitude + halfLon, maxY = radian.latitude + halfLat;
                        const result = this.#kdbush!.range(minX, minY, maxX, maxY);
                        // 聚合的索引数组
                        const clusterIndex = [iterator];
                        // 聚合坐标
                        let position: Cartesian3;
                        if (result.length >= 2) {
                            // 记录坐标和，用来算平均数
                            let sumLon = radian.longitude;
                            let sumLat = radian.latitude;
                            // 记录当前聚合的索引
                            for (let i = 0; i < result.length; i++) {
                                const element = result[i];
                                // 上面的遍历点聚合范围内其他点的聚合状态
                                const clustered2 = points.get(element);
                                if (clustered2) {
                                    // 如果已被聚合则跳过
                                    continue;
                                } else if (clustered2 === undefined) {
                                    // 不存在的点判断一下
                                    continue;
                                } else {
                                    points.set(element, true);
                                    clusterIndex.push(element);
                                    // 计算聚合位置
                                    const r = this.#cartographicPoints[element];
                                    sumLon += r.longitude;
                                    sumLat += r.latitude;
                                }
                            }
                            const longitude = sumLon / clusterIndex.length;
                            const latitude = sumLat / clusterIndex.length;
                            // 若聚合, 则重算Z坐标保证贴地
                            let h = 0;
                            if(this.#options.relativeToCround){
                                // 是否计算地形高
                                h = await getTerrainMostDetailedHeight(
                                    this.#viewer,
                                    Cesium.Math.toDegrees(longitude),
                                    Cesium.Math.toDegrees(latitude)
                                );
                            }
                            position = Cesium.Cartesian3.fromRadians(
                                longitude, latitude, h
                            )
                        } else {
                            position = this.#cartesianPoints[iterator];
                        }
                        endCluster.push({
                            position: position,
                            index: clusterIndex,
                        })
                    }
                }
            } else {
                // 不满足聚合最小数量则直接渲染
                for (const iterator of points.keys()) {
                    points.set(iterator, true);
                    endCluster.push({
                        position: this.#cartesianPoints[iterator],
                        index: [iterator],
                    })
                }
            }

            return endCluster;
        } else {
            return undefined;
        }
    }

    /**
     * @description: 计算聚合长宽(弧度)
     * @param {number} pixelRange 聚合像素
     * @return {{ lonDis: number; latDis: number; }|undefined} 长宽(弧度)
     */
    #computedPixedBox(pixelRange: number) {
        const scene = this.#viewer.scene;
        // 画布大小
        const width = scene.canvas.clientWidth;
        const height = scene.canvas.clientHeight;
        // 获取画布中心两个像素的canvas坐标（默认地图渲染在画布中心位置）
        const leftBottom = scene.camera.getPickRay(new Cesium.Cartesian2(width >> 1, height >> 1));
        const right = scene.camera.getPickRay(new Cesium.Cartesian2(1 + (width >> 1), height >> 1));
        const top = scene.camera.getPickRay(new Cesium.Cartesian2(width >> 1, (height >> 1) - 1));
        if (Cesium.defined(leftBottom) && Cesium.defined(right) && Cesium.defined(top)) {
            // canvas坐标转Cartesian3
            const leftBottomPosition = scene.globe.pick(leftBottom!, scene);
            const rightPosition = scene.globe.pick(right!, scene);
            const topPosition = scene.globe.pick(top!, scene);
            if (Cesium.defined(leftBottomPosition) && Cesium.defined(rightPosition) && Cesium.defined(topPosition)) {
                // Cartesian3转弧度
                const leftBottomCartographic = scene.globe.ellipsoid.cartesianToCartographic(leftBottomPosition!);
                const rightCartographic = scene.globe.ellipsoid.cartesianToCartographic(rightPosition!);
                const topCartographic = scene.globe.ellipsoid.cartesianToCartographic(topPosition!);
                // 一个像素的经纬度差
                return {
                    lonDis: (rightCartographic.longitude - leftBottomCartographic.longitude) * pixelRange,
                    latDis: (topCartographic.latitude - leftBottomCartographic.latitude) * pixelRange,
                }
            }
        }
        return undefined;
    }

    /**
     * @description: 默认配置项
     * @return {clusterOptionType}
     */
    get defaultOption(): clusterOptionType {
        return {
            enabled: true,  // 是否启用聚合
            pixelRange: 100,    // 聚合像素范围
            percentageChanged: 0.2, // 相机灵敏度(0.0 - 1.0)
            /**
             * 聚合开启临界，当前屏幕内实体数量低于此时无需聚合
             * 此项非常重要，由于computeViewRectangle获取屏幕范围不准确问题，当点位较为密集时
             * 聚合可能无法解除，故应找到一个不卡且能正常显示的值，可根据实际情况测试
             */
            minimumClusterSize: 300,
            clusterBillboards: true,    // 是否显示billboards
            clusterLabels: true,    // 是否显示label
            clusterPoints: true,    // 是否显示point
            relativeToCround: false,    // 是否为地形上的高度
            callBack: undefined,   // 回调
        };
    }
}
