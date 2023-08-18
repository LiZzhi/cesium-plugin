import * as Cesium from "cesium";
import {
    Viewer,
    Cartographic,
    Cartesian3,
    Cartesian2,
    Billboard,
    Label,
    PointPrimitive,
    PrimitiveCollection,
    PointPrimitiveCollection,
    BillboardCollection,
    LabelCollection,
    Property
} from "cesium";
import { getTerrainMostDetailedHeight, isVisible } from "../../Utils/tool";
import kdbush from "../../Utils/kdbush";

export type clusterBoardType = {
    position: Cartographic;
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
    clusterBillboards?: boolean;    // 是否显示billboards
    clusterLabels?: boolean;    // 是否显示label
    clusterPoints?: boolean;    // 是否显示point
    callBack?: (p: callBackParamsType) => void;   // 回调
};

export default class pointCluster {
    #viewer: Viewer;
    #cartographicPoints: Cartographic[];
    #options: clusterOptionType;
    #clusterCollection: PrimitiveCollection;
    #clusterBillboardCollection: BillboardCollection;
    #clusterLabelCollection: LabelCollection;
    #clusterPointCollection: PointPrimitiveCollection;
    #kdbush: kdbush | null;
    constructor(viewer: Viewer, points: Cartographic[], options?: clusterOptionType) {
        this.#viewer = viewer;
        this.#cartographicPoints = points;
        this.#options = Object.assign(this.defaultOption, options);
        // 实体集合
        this.#clusterBillboardCollection = new Cesium.BillboardCollection({ scene: viewer.scene });
        this.#clusterLabelCollection = new Cesium.LabelCollection({ scene: viewer.scene });
        this.#clusterPointCollection = new Cesium.PointPrimitiveCollection();
        // 总集合
        this.#clusterCollection = new Cesium.PrimitiveCollection();
        this.#clusterCollection.add(this.#clusterBillboardCollection);
        this.#clusterCollection.add(this.#clusterLabelCollection);
        this.#clusterCollection.add(this.#clusterPointCollection);
        this.#kdbush = null;
    }

    start() {
        const primitives = this.#viewer.scene.primitives;
        primitives.add(this.#clusterCollection);
        this.#createCulster().then(()=>{
            console.log(this.#cartographicPoints);
            this.#createCulsterEvent()
            this.#viewer.camera.changed.addEventListener(this.#createCulsterEvent, this);
        }).catch((e:any)=>{
            console.log(e);
        })
    }

    /**
     * @description: 重算地形高，深拷贝防止更改源数据，并构建kdbush
     * @return {*}
     */
    async #createCulster() {
        this.#kdbush = new kdbush(this.#cartographicPoints.length, 64, Float32Array);
        const newPositions:Cartographic[] = [];
        for (let i = 0; i < this.#cartographicPoints.length; i++) {
            const {longitude, latitude, height} = this.#cartographicPoints[i];
            // 计算地形高
            const h = await getTerrainMostDetailedHeight(this.#viewer, longitude, latitude);
            newPositions.push(new Cesium.Cartographic(longitude, latitude, h + height));
            this.#kdbush!.add(longitude, latitude);
        }
        // 替换源数据
        this.#cartographicPoints = newPositions;
        // 构建索引
        this.#kdbush.finish();
    }

    async #createCulsterEvent() {
        const scene = this.#viewer.scene;
        const rectBoundary = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
        this.#clusterBillboardCollection.removeAll();
        this.#clusterLabelCollection.removeAll();
        this.#clusterPointCollection.removeAll();
        const options = this.#options;
        if (!(options.clusterBillboards || options.clusterLabels || options.clusterPoints)) {
            // 都不显示，就不用折腾了
            return;
        }
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
            console.log(endCluster);
            // 展示聚合结果
            if (endCluster) {
                for (let i = 0; i < endCluster.length; i++) {
                    // 回调参数
                    const element = endCluster[i];
                    let cluster, billboard, label, point;
                    // 创建实体
                    if (options.clusterBillboards) {
                        billboard = this.#clusterBillboardCollection.add({
                            position: Cesium.Cartesian3.fromRadians(
                                element.position.longitude,
                                element.position.latitude,
                                element.position.height,
                                scene.globe.ellipsoid
                            ),
                            image: "public/img/pointCluster/bluecamera.png",
                        });
                    }
                    if (options.clusterLabels) {
                        label = this.#clusterLabelCollection.add({
                            position: Cesium.Cartesian3.fromRadians(
                                element.position.longitude,
                                element.position.latitude,
                                element.position.height,
                                scene.globe.ellipsoid
                            ),
                            text: element.index.length + '',
                        });
                    }
                    if (options.clusterPoints) {
                        this.#clusterPointCollection.add({
                            position: Cesium.Cartesian3.fromRadians(
                                element.position.longitude,
                                element.position.latitude,
                                element.position.height,
                                scene.globe.ellipsoid
                            ),
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
    }

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
                    console.log(result);
                    // 聚合的索引数组
                    const clusterIndex = [iterator];
                    if (result.length) {
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
                    }
                    // 若聚合, 则重算Z坐标保证贴地
                    if(clusterIndex.length >= (this.#options.minimumClusterSize || 2)){
                        // 计算地形高
                        const h = await getTerrainMostDetailedHeight(this.#viewer, radian.longitude, radian.latitude);
                        radian.height = h;
                    }
                    endCluster.push({
                        position: radian,
                        index: clusterIndex,
                    })
                }
            }
            return endCluster;
        } else {
            return undefined;
        }
    }

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

    get defaultOption(): any {
        return {
            enabled: true,  // 是否启用聚合
            minimumClusterSize: 2,    // 最小聚合数量
            pixelRange: 100,    // 聚合像素范围
            clusterBillboards: true,    // 是否显示billboards
            clusterLabels: true,    // 是否显示label
            clusterPoints: true,    // 是否显示point
            callBack: undefined,   // 回调
        };
    }
}
