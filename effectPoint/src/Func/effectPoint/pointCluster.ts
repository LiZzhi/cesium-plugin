import * as Cesium from "cesium";
import {
    Viewer,
    Cartesian3,
    Cartesian2,
    Billboard,
    BillboardCollection,
    LabelCollection,
} from "cesium";
import { getTerrainMostDetailedHeight, isVisible } from "../../Utils/tool";
import kdbush from "../../Utils/kdbush";

type optionType = {
    billboardImg?: string;
    clusterImg?: string;
    pixelRange?: number;
    minimumClusterSize?: number;
    billboardShow?: boolean;
    pointShow?: boolean;
    labelShow?: boolean;
};

type clusterBoardType = {
    position: Cartesian3;
    index: number[];
};

export default class pointCluster {
    #viewer: Viewer;
    #boards: any[];
    #options: optionType;
    #billboardCollection: BillboardCollection;
    #clusterBillboardCollection: BillboardCollection;
    #labelCollection: LabelCollection;
    #clusterLabelCollection: LabelCollection;
    #kdbush: kdbush | null;
    constructor(viewer: Viewer, boards:any[], options?: optionType) {
        this.#viewer = viewer;
        this.#boards = boards;
        this.#options = Object.assign(this.defaultOption, options);
        this.#billboardCollection = new Cesium.BillboardCollection();
        this.#clusterBillboardCollection = new Cesium.BillboardCollection({ scene: viewer.scene });
        this.#labelCollection = new Cesium.LabelCollection();
        this.#clusterLabelCollection = new Cesium.LabelCollection({ scene: viewer.scene });
        this.#kdbush = null;
    }

    start(){
        const primitives = this.#viewer.scene.primitives;
        primitives.add(this.#clusterBillboardCollection);
        primitives.add(this.#clusterLabelCollection);
        this.#createCulster();
        this.#createCulsterEvent()
        this.#viewer.camera.changed.addEventListener(this.#createCulsterEvent, this);
    }

    /**
     * @description: 创建kdbush类
     * @return {*}
     */
    #createCulster(){
        this.#kdbush = new kdbush(this.#boards.length, 64, Float32Array);
        this.#boards.forEach((v)=> {
            const {longitude, latitude} = Cesium.Cartographic.fromCartesian(v.position)
            this.#kdbush!.add(longitude, latitude);
        })
        this.#kdbush.finish();
    }

    #createCulsterEvent(){
        const scene = this.#viewer.scene;
        const rectBoundary = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
        this.#clusterBillboardCollection.removeAll();
        this.#clusterLabelCollection.removeAll();
        if(rectBoundary){
            const {north, east, south, west} = rectBoundary;
            const result = this.#kdbush!.range(west, south, east, north);
            // console.log("result", result);
            // 临时board字典，用来记录当前board是否已被聚合
            const nowBoards: Map<number, boolean> = new Map();
            for (let i = 0; i < result.length; i++) {
                nowBoards.set(result[i], false);
            }

            const endCluster = this.#computedCulster(nowBoards);
            console.log("endCluster", endCluster);
            if(endCluster){
                // this.#clusterBillboardCollection.add(board);
                for (let i = 0; i < endCluster.length; i++) {
                    const element = endCluster[i];
                    if (element.index.length === 1) {
                        this.#clusterBillboardCollection.add(this.#boards[element.index[0]]);
                    } else {
                        this.#clusterBillboardCollection.add({
                            ...this.#boards[element.index[0]],
                            position: element.position,
                            // @ts-ignore
                            image: this.#options.testImg,
                        });
                        this.#clusterLabelCollection.add({
                            show: true,
                            position: element.position,
                            text: element.index.length + '',
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        })
                    }
                }
                // this.#viewer.camera.flyTo({
                //     destination: this.#clusterBillboardCollection.get(0).position
                // })
            }
        }
    }

    #computedCulster(boards: Map<number, boolean>){
        // 计算聚合范围
        const boxSide = this.#computedPixedBox(this.#options.pixelRange!);
        if(boxSide){
            const endCluster: clusterBoardType[] = [];
            const halfLon = boxSide.lonDis / 2;
            const halfLat = boxSide.latDis / 2;
            for (const iterator of boards.keys()) {
                // 遍历每个点时得聚合状态
                const clustered = boards.get(iterator);
                if(clustered){
                    // 如果已被聚合则跳过
                    continue;
                } else {
                    // 当前点坐标
                    const p = this.#boards[iterator].position;
                    boards.set(iterator, true);
                    const radian = Cesium.Cartographic.fromCartesian(p);
                    const minX = radian.longitude - halfLon, minY = radian.latitude - halfLat;
                    const maxX = radian.longitude + halfLon, maxY = radian.latitude + halfLat;
                    const result = this.#kdbush!.range(minX, minY, maxX, maxY);
                    // 当前点坐标深拷贝
                    let position = Cesium.clone(p);
                    // 记录当前聚合的索引
                    const clusterIndex = [iterator];
                    for (let i = 0; i < result.length; i++) {
                        const element = result[i];
                        // 上面的遍历点聚合范围内其他点的聚合状态
                        const clustered2 = boards.get(element);
                        if (clustered2) {
                            // 如果已被聚合则跳过
                            continue;
                        } else if(clustered2 === undefined) {
                            // 不存在的点判断一下
                            continue;
                        } else {
                            boards.set(element, true);
                            clusterIndex.push(element);
                            // 计算聚合位置
                            Cesium.Cartesian3.add(position, this.#boards[element].position, position);
                        }
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

    #computedPixedBox(pixelRange: number){
        const scene = this.#viewer.scene;
        // 画布大小
        const width = scene.canvas.clientWidth;
        const height = scene.canvas.clientHeight;
        // 获取画布中心两个像素的坐标（默认地图渲染在画布中心位置）
        const leftBottom = scene.camera.getPickRay(new Cesium.Cartesian2(width >> 1, height >> 1));
        const right = scene.camera.getPickRay(new Cesium.Cartesian2(1 + (width >> 1), height >> 1));
        const top = scene.camera.getPickRay(new Cesium.Cartesian2(width >> 1, (height >> 1) - 1));
        if (Cesium.defined(leftBottom) && Cesium.defined(right) && Cesium.defined(top)) {
            const leftBottomPosition = scene.globe.pick(leftBottom!, scene);
            const rightPosition = scene.globe.pick(right!, scene);
            const topPosition = scene.globe.pick(top!, scene);
            if (Cesium.defined(leftBottomPosition) && Cesium.defined(rightPosition) && Cesium.defined(topPosition)) {
                const leftBottomCartographic = scene.globe.ellipsoid.cartesianToCartographic(leftBottomPosition!);
                const rightCartographic = scene.globe.ellipsoid.cartesianToCartographic(rightPosition!);
                const topCartographic = scene.globe.ellipsoid.cartesianToCartographic(topPosition!);
                return {
                    lonDis: (rightCartographic.longitude - leftBottomCartographic.longitude) * pixelRange,
                    latDis: (topCartographic.latitude - leftBottomCartographic.latitude) * pixelRange,
                }
            }
        }
        return undefined;
    }



    // createDeclutterCallback() {
    //     this.#viewer.scene.primitives.add(this.#billboardCollection);
    //     this.#viewer.scene.primitives.add(this.#clusterBillboardCollection);
    //     this.#viewer.scene.primitives.add(this.#labelCollection);
    //     this.#viewer.scene.primitives.add(this.#clusterLabelCollection);

    //     let pixelRange = this.#options.pixelRange;
    //     let minimumClusterSize = this.#options.minimumClusterSize;

    //     let scene = this.#viewer.scene;
    //     let cameraPosition = this.#viewer.scene.camera.positionWC;
    //     let occluder = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
    //         scene,
    //         cameraPosition
    //     );

    //     //当前屏幕内所有点以及他们在屏幕上的坐标
    //     let points: pointsType[] = [];

    //     this.getScreenSpacePositions(this.#billboardCollection, points);
    // }

    // /**
    //  * @description: 筛选出在屏幕内的点
    //  * @param {BillboardCollection|LabelCollection} collection
    //  * @param {any} points
    //  * @return {*}
    //  */
    // getScreenSpacePositions(
    //     collection: BillboardCollection | LabelCollection,
    //     points: pointsType[]
    // ) {
    //     const scene = this.#viewer.scene;
    //     for (let index = 0; index < collection.length; index++) {
    //         const primitive = collection.get(index);
    //         if (primitive.show) {
    //             if (primitive instanceof Cesium.Label) {
    //                 // 过滤掉label
    //                 continue;
    //             }
    //             if (
    //                 scene.mode === Cesium.SceneMode.SCENE3D &&
    //                 !isVisible(
    //                     primitive.position,
    //                     scene.camera.position,
    //                     scene.globe.ellipsoid
    //                 )
    //             ) {
    //                 // 3D下是否在地球正面
    //                 continue;
    //             }
    //             if (scene.mode === Cesium.SceneMode.SCENE2D) {
    //                 // canvas2D坐标
    //                 let position =
    //                     Cesium.SceneTransforms.wgs84ToWindowCoordinates(
    //                         scene,
    //                         primitive.position
    //                     );
    //                 // canvas左上角坐标转2d坐标
    //                 let upperLeft = new Cesium.Cartesian2(0, 0);
    //                 // canvas右下角坐标转2d坐标
    //                 let lowerRight = new Cesium.Cartesian2(
    //                     scene.canvas.clientWidth,
    //                     scene.canvas.clientHeight
    //                 );

    //                 // 是否在屏幕范围内
    //                 if (
    //                     !(
    //                         upperLeft.x < position.x &&
    //                         position.x < lowerRight.x &&
    //                         upperLeft.y < position.y &&
    //                         position.y < lowerRight.y
    //                     )
    //                 ) {
    //                     continue;
    //                 }
    //             }

    //             let coord = primitive.computeScreenSpacePosition(scene);
    //             if (!Cesium.defined(coord)) {
    //                 continue;
    //             }
    //             let clustered = false;
    //             points.push({ index, collection, clustered, coord });
    //         }
    //     }
    // }

    get defaultOption(): any {
        return {
            clusterImg: {
                10: "./public/img/pointCluster/board1.png",
                50: "./public/img/pointCluster/board2.png",
                100: "./public/img/pointCluster/board3.png",
                500: "./public/img/pointCluster/board4.png",
                1000: "./public/img/pointCluster/board5.png",
                5000: "./public/img/pointCluster/board6.png",
            },
            billboardShow: true,
            labelShow: true,
            pixelRange: 100,

            testImg: "public/img/pointCluster/board1.png"
        };
    }
}
