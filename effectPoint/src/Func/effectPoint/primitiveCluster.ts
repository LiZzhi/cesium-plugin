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
    minimumClusterSize?: number;    // 最小聚合数量
    percentageChanged?: number; // 相机灵敏度(0.0 - 1.0)
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
                // 计算地形高
                const h = await getTerrainMostDetailedHeight(
                    this.#viewer,
                    Cesium.Math.toDegrees(longitude),
                    Cesium.Math.toDegrees(latitude)
                );
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
            this.#isStart = true;
            this.destroy();
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
            if (!this.#visible) {
                // 不显示直接跳过
                return;
            }
            if (!(options.clusterBillboards || options.clusterLabels || options.clusterPoints)) {
                // 都不显示，就不用折腾了
                this.#antiShake = false;
                return;
            }
            const rectBoundary = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
            if (rectBoundary) {
                const { north, east, south, west } = rectBoundary;
                const result = this.#kdbush!.range(west, south, east, north);
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
                        cluster = element.index.length >= (options.minimumClusterSize || 2);
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
            for (const iterator of points.keys()) {
                // 遍历每个点时得聚合状态
                const clustered = points.get(iterator);
                if (clustered) {
                    // 如果已被聚合则跳过
                    continue;
                } else {
                    // 当前点坐标深拷贝
                    const radian = this.#cartographicPoints[iterator].clone();
                    points.set(iterator, true);
                    // 范围查询
                    const minX = radian.longitude - halfLon, minY = radian.latitude - halfLat;
                    const maxX = radian.longitude + halfLon, maxY = radian.latitude + halfLat;
                    const result = this.#kdbush!.range(minX, minY, maxX, maxY);
                    // 聚合的索引数组
                    const clusterIndex = [iterator];
                    // 聚合坐标
                    let position: Cartesian3;
                    if (result.length >= (this.#options.minimumClusterSize || 2)) {
                        points.set(iterator, true);
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
                        radian.longitude = sumLon / clusterIndex.length;
                        radian.latitude = sumLat / clusterIndex.length;

                        // 若聚合, 则重算Z坐标保证贴地
                        const h = await getTerrainMostDetailedHeight(
                            this.#viewer,
                            Cesium.Math.toDegrees(radian.longitude),
                            Cesium.Math.toDegrees(radian.latitude)
                        );
                        radian.height = h;
                        position = Cesium.Cartesian3.fromRadians(
                            radian.longitude, radian.latitude, radian.height
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
            return endCluster;
        } else {
            return undefined;
        }
    }

    /**
     * @description: 聚合事件2(未使用)
     * @return {*}
     */
    async #createCulsterEvent2() {
        if (!this.#antiShake) {
            this.#antiShake = true;
            const scene = this.#viewer.scene;
            const rectBoundary = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
            this.#clusterBillboardCollection.removeAll();
            this.#clusterLabelCollection.removeAll();
            this.#clusterPointCollection.removeAll();
            const options = this.#options;
            if (!(options.clusterBillboards || options.clusterLabels || options.clusterPoints)) {
                // 都不显示，就不用折腾了
                this.#antiShake = false;
                return;
            }
            if (rectBoundary) {
                const { north, east, south, west } = rectBoundary;
                const result = this.#kdbush!.range(west, south, east, north);
                // 计算聚合结果
                const endCluster = await this.#computedCulster2(result, rectBoundary);
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
                        cluster = element.index.length >= (options.minimumClusterSize || 2);
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
     * @description: 聚合事件2使用，将屏幕根据聚合像素分成N个聚合范围
     * @param {{ lonDis: number; latDis: number; }} boxSide 聚合范围长宽(弧度)
     * @param {Rectangle} rectBoundary 屏幕范围
     * @return {Record<number, Record<number, Record<string, number[]>>>} 聚合范围
     */
    #computedEveryBox(boxSide: { lonDis: number; latDis: number; }, rectBoundary: Rectangle){
        const box:Record<number, Record<number, Record<string, number[]>>> = {};
        let { north, east, south, west } = rectBoundary;
        console.log(rectBoundary);
        let numX = 0;
        for (let i = west; i < east; i += boxSide.lonDis) {
            box[numX] = {};
            numX ++;
        }
        let numY = 0;
        for(let i = south; i < north; i += boxSide.latDis){
            for (const j in box) {
                box[j][numY] = {
                    x: [],
                    y: [],
                    index: [],
                };
            }
            numY ++;
        }
        return box;
    }

    /**
     * @description: 聚合事件2使用，计算聚合点位
     * @param {number[]} points 屏幕内点位索引数组
     * @param {Rectangle} rectBoundary 屏幕范围
     * @return {clusterBoardType[]|undefined} 聚合点
     */
    async #computedCulster2(points: number[], rectBoundary: Rectangle) {
        // 计算聚合范围
        const boxSide = this.#computedPixedBox(this.#options.pixelRange!);
        if (boxSide) {
            const endCluster: clusterBoardType[] = [];
            const box = this.#computedEveryBox(boxSide, rectBoundary)
            for (let i = 0; i < points.length; i++) {
                const element = points[i];
                // 计算每个点的位置
                const radian = this.#cartographicPoints[element].clone();
                let indexX = Math.floor((radian.longitude - rectBoundary.west) / boxSide.lonDis);
                let indexY = Math.floor((radian.latitude - rectBoundary.south) / boxSide.latDis);
                // 插入聚合数组中
                const xBox = Reflect.get(box, indexX);
                if(xBox){
                    const yBox = Reflect.get(xBox, indexY);
                    if(yBox){
                        yBox.x.push(radian.longitude);
                        yBox.y.push(radian.latitude);
                        yBox.index.push(element);
                    }
                } else {
                    continue;
                }
            }

            for (const i in box) {
                for (const j in box[i]) {
                    const element = box[i][j];
                    const length = element.index.length;
                    if (length >= (this.#options.minimumClusterSize || 2)){
                        const lon = element.x.reduce((a, b) => a + b) / length;
                        const lat = element.y.reduce((a, b) => a + b) / length;
                        // 若聚合, 则重算Z坐标保证贴地
                        const h = await getTerrainMostDetailedHeight(
                            this.#viewer,
                            Cesium.Math.toDegrees(lon),
                            Cesium.Math.toDegrees(lat)
                        );
                        const position = Cesium.Cartesian3.fromRadians(lon, lat, h);
                        endCluster.push({
                            position: position,
                            index: element.index,
                        })
                    } else {
                        element.index.forEach(v => {
                            endCluster.push({
                                position: this.#cartesianPoints[v],
                                index: [v],
                            })
                        })
                    }
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
            minimumClusterSize: 2,    // 最小聚合数量
            pixelRange: 100,    // 聚合像素范围
            percentageChanged: 0.15, // 相机灵敏度(0.0 - 1.0)
            clusterBillboards: true,    // 是否显示billboards
            clusterLabels: true,    // 是否显示label
            clusterPoints: true,    // 是否显示point
            callBack: undefined,   // 回调
        };
    }
}
