import * as Cesium from "cesium";
import { Viewer, ScreenSpaceEventHandler, Cartesian3, Entity, CustomDataSource } from "cesium";
import { calculateRectangle, calculateRectangle2 } from "./tool"

export default class drawShape {
    #viewer: Viewer
    #drawShapeSource: CustomDataSource
    #drawShapeEntities: Entity[]
    #pointNodeArr: Entity[]
    #pointNodePosiArr: Cartesian3[]
    #isDepth: boolean
    #handler: ScreenSpaceEventHandler | null
    #drawEntity: Entity | null
    constructor(viewer: Viewer) {
        this.#viewer = viewer;
        // drawShape 类单独使用的 dataSourceCollection
        this.#drawShapeSource = new Cesium.CustomDataSource("drawShape")
        viewer.dataSources.add(this.#drawShapeSource)
        // 绘图过程中，临时记录的节点 Entity 的数组
        this.#pointNodeArr = []
        // 绘图过程中，临时记录的节点 Cartesian3 的数组
        this.#pointNodePosiArr = []
        // dataSources数组
        this.#drawShapeEntities = [];
        // 绘图过程中，临时的 Entity
        this.#drawEntity = null
        // 记录当前深度检测状态
        this.#isDepth = viewer.scene.globe.depthTestAgainstTerrain;
        // 屏幕事件句柄
        this.#handler = null;
    }

    /**
     * 绘制点要素
     * @param {Entity.ConstructorOptions} options Entity 中的 Option
     */
    drawPoint(options: Entity.ConstructorOptions = {}): void {
        if (!(this instanceof drawShape)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("drawShape 实例中 this 指向全局，请正确调用或修正 this 指向");
        }

        // 绘图前准备并获取屏幕事件句柄
        this.#handler = this.drawStart();

        this.#handler.setInputAction((e: any) => {
            // 左键点击画点
            let position = this.#viewer.scene.pickPosition(e.position);

            if (Cesium.defined(position)) {
                this.drawEnd();

                let properties = {
                    id: 'point-' + crypto.randomUUID(),
                    position: position,
                    point: {
                        color: Cesium.Color.BLUE,
                        pixelSize: 8,
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    }
                };
                let o = Object.assign(properties, options)
                this.addData(o);
            }
            this.drawEnd();
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction((e: any) => {
            // 右键点击提前结束
            this.drawEnd();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /**
     * 绘制线要素
     * @param { Entity.ConstructorOptions } options Entity 中的 Option
     */
    drawPloyline(options: Entity.ConstructorOptions = {}): void {
        if (!(this instanceof drawShape)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("drawShape 实例中 this 指向全局，请正确调用或修正 this 指向");
        }

        // 绘图前准备并获取屏幕事件句柄
        this.#handler = this.drawStart();
        this.#handler.setInputAction((e: any) => {
            // 左键点击画折线
            let position = this.#viewer.scene.pickPosition(e.position);

            if (Cesium.defined(position)) {
                // 添加节点
                this.addTemporaryPoint(position)

                // 添加临时绘图线
                if (!this.#drawEntity) {
                    this.#drawEntity = this.#viewer.entities.add({
                        polyline: {
                            positions: new Cesium.CallbackProperty(() => {
                                return this.#pointNodePosiArr;
                            }, false),
                            width: 5,
                            clampToGround: true,
                            arcType: Cesium.ArcType.RHUMB
                        }
                    });
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction((e: any) => {
            // 鼠标移动事件
            let position = this.#viewer.scene.pickPosition(e.endPosition);
            // 移动点跟着光标动
            if (Cesium.defined(position)) {
                if (this.#pointNodePosiArr.length === 1) {
                    this.#pointNodePosiArr.push(position);
                }
                if (this.#pointNodePosiArr.length >= 2) {
                    // 更新最新鼠标点
                    this.#pointNodePosiArr.pop();
                    this.#pointNodePosiArr.push(position);
                }
            }

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.#handler.setInputAction((e: any) => {
            let p = JSON.parse(JSON.stringify(this.#pointNodePosiArr))
            // 右键点击提前结束
            let properties = {
                id: 'ployline-' + crypto.randomUUID(),
                polyline: {
                    positions: p,
                    width: 5,
                    clampToGround: true,
                    arcType: Cesium.ArcType.RHUMB
                }
            };
            if (options.polyline) {
                options.polyline.positions = p
            }
            let o = Object.assign(properties, options)
            this.addData(o);
            this.drawEnd();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    }

    /**
     * 绘制面要素
     * @param { Entity.ConstructorOptions } options Entity 中的 Option
     */
    drawPloygon(options: Entity.ConstructorOptions = {}): void {
        if (!(this instanceof drawShape)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("drawShape 实例中 this 指向全局，请正确调用或修正 this 指向");
        }

        // 绘图前准备并获取屏幕事件句柄
        this.#handler = this.drawStart();
        this.#handler.setInputAction((e: any) => {
            // 左键点击画面
            let position = this.#viewer.scene.pickPosition(e.position);

            if (Cesium.defined(position)) {
                // 添加节点
                this.addTemporaryPoint(position)

                // 添加临时绘图面
                if (!this.#drawEntity) {
                    this.#drawEntity = this.#viewer.entities.add({
                        polyline: {
                            positions: new Cesium.CallbackProperty(() => {
                                return this.#pointNodePosiArr;
                            }, false),
                            width: 2,
                            clampToGround: true,
                            material: Cesium.Color.YELLOW,
                            arcType: Cesium.ArcType.RHUMB
                        },
                        polygon: {
                            hierarchy: new Cesium.CallbackProperty(() => {
                                return new Cesium.PolygonHierarchy(this.#pointNodePosiArr)
                            }, false),
                            material: new Cesium.ColorMaterialProperty(
                                Cesium.Color.LIGHTSKYBLUE.withAlpha(0.5)
                            ),
                            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                        }
                    });
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction((e: any) => {
            // 鼠标移动事件
            let position = this.#viewer.scene.pickPosition(e.endPosition);
            // 移动点跟着光标动
            if (Cesium.defined(position)) {
                if (this.#pointNodePosiArr.length === 1) {
                    this.#pointNodePosiArr.push(position);
                }
                if (this.#pointNodePosiArr.length >= 2) {
                    // 更新最新鼠标点
                    this.#pointNodePosiArr.pop();
                    this.#pointNodePosiArr.push(position);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.#handler.setInputAction((e: any) => {
            // 右键点击结束
            let p: Cartesian3[] = JSON.parse(JSON.stringify(this.#pointNodePosiArr))
            let hierarchyP = new Cesium.PolygonHierarchy(p)
            let polylineP = p.concat([p[0]])
            let properties = {
                id: 'ployline-' + crypto.randomUUID(),
                polyline: {
                    positions: polylineP,
                    width: 2,
                    clampToGround: true,
                    material: Cesium.Color.YELLOW,
                    arcType: Cesium.ArcType.RHUMB
                },
                polygon: {
                    hierarchy: hierarchyP,
                    material: new Cesium.ColorMaterialProperty(
                        Cesium.Color.LIGHTSKYBLUE.withAlpha(0.5)
                    ),
                    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                }
            };
            if (options.polyline) {
                options.polyline.positions = polylineP
            }
            if (options.polygon) {
                options.polygon.hierarchy = hierarchyP
            }
            let o = Object.assign(properties, options)
            this.addData(o);
            this.drawEnd();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /**
     * 绘制圆要素
     * @param { Entity.ConstructorOptions } options Entity 中的 Option
     */
    drawCircle(options: Entity.ConstructorOptions = {}): void {
        if (!(this instanceof drawShape)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("drawShape 实例中 this 指向全局，请正确调用或修正 this 指向");
        }

        // 绘图前准备并获取屏幕事件句柄
        this.#handler = this.drawStart();
        // 圆心
        let circleCenter: Cartesian3
        let distance: number
        this.#handler.setInputAction((e: any) => {
            // 左键点击画面
            let position = this.#viewer.scene.pickPosition(e.position);

            if (Cesium.defined(position)) {
                // 添加节点
                if (!circleCenter) {
                    this.addTemporaryPoint(position);
                    circleCenter = position;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction((e: any) => {
            // 鼠标移动事件
            let position = this.#viewer.scene.pickPosition(e.endPosition);
            // 移动点跟着光标动
            if (Cesium.defined(position) && circleCenter) {
                let cartographic0 = this.#viewer.scene.globe.ellipsoid.cartesianToCartographic(circleCenter);
                let cartographic1 = this.#viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
                let geodesic = new Cesium.EllipsoidGeodesic(
                    cartographic0, cartographic1, this.#viewer.scene.globe.ellipsoid
                );

                distance = geodesic.surfaceDistance;

                if (circleCenter && !this.#drawEntity) {
                    this.#drawEntity = this.#viewer.entities.add({
                        position: circleCenter,
                        ellipse: {
                            semiMinorAxis: new Cesium.CallbackProperty(() => {
                                return distance;
                            }, false),
                            semiMajorAxis: new Cesium.CallbackProperty(() => {
                                return distance;
                            }, false),
                            fill: true,
                            material: Cesium.Color.YELLOW.withAlpha(0.5),
                            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                        }
                    })
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.#handler.setInputAction((e: any) => {
            // 右键点击结束绘图
            if (this.#drawEntity) {
                let properties = {
                    id: 'circle-' + crypto.randomUUID(),
                    position: circleCenter,
                    ellipse: {
                        semiMinorAxis: distance,
                        semiMajorAxis: distance,
                        fill: true,
                        material: Cesium.Color.YELLOW.withAlpha(0.5),
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                    }
                };
                if (options.ellipse) {
                    options.ellipse.semiMinorAxis = distance
                    options.ellipse.semiMajorAxis = distance
                }
                let o = Object.assign(properties, options)
                this.addData(o);
                this.drawEnd()
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /**
     * 绘制矩形要素
     * @param { Entity.ConstructorOptions } options Entity 中的 Option
     */
    drawRectangle(options: Entity.ConstructorOptions = {}) {
        if (!(this instanceof drawShape)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("drawShape 实例中 this 指向全局，请正确调用或修正 this 指向");
        }

        // 绘图前准备并获取屏幕事件句柄
        this.#handler = this.drawStart();
        // 初始两点
        let pointA: Cartesian3, pointB: Cartesian3
        this.#handler.setInputAction((e: any) => {
            // 左键点击画面
            let position = this.#viewer.scene.pickPosition(e.position);

            if (Cesium.defined(position)) {
                // 添加节点
                if (this.#pointNodeArr.length < 2) {
                    this.addTemporaryPoint(position)
                    if (!pointA) {
                        pointA = position;
                    } else if (!pointB) {
                        pointB = position;
                    }
                }
                // 添加临时绘图面
                if (!this.#drawEntity) {
                    this.#drawEntity = this.#viewer.entities.add({
                        polyline: {
                            positions: new Cesium.CallbackProperty(() => {
                                return this.#pointNodePosiArr.length !== 4 ? this.#pointNodePosiArr : this.#pointNodePosiArr.concat(this.#pointNodePosiArr[0]);
                            }, false),
                            width: 2,
                            clampToGround: true,
                            material: Cesium.Color.YELLOW,
                            arcType: Cesium.ArcType.RHUMB
                        },
                        polygon: {
                            hierarchy: new Cesium.CallbackProperty(() => {
                                return new Cesium.PolygonHierarchy(this.#pointNodePosiArr)
                            }, false),
                            material: new Cesium.ColorMaterialProperty(
                                Cesium.Color.LIGHTSKYBLUE.withAlpha(0.5)
                            ),
                            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                        }
                    });
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction((e: any) => {      
            // 鼠标移动事件
            let position = this.#viewer.scene.pickPosition(e.endPosition);
            // 移动点跟着光标动
            if (Cesium.defined(position)) {
                if (pointA && pointB) {
                    this.#pointNodePosiArr = calculateRectangle([pointA, pointB, position])
                    return
                }
                if (this.#pointNodePosiArr.length === 1) {
                    this.#pointNodePosiArr.push(position);
                }
                if (this.#pointNodePosiArr.length >= 2) {
                    // 更新最新鼠标点
                    this.#pointNodePosiArr.pop();
                    this.#pointNodePosiArr.push(position);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.#handler.setInputAction((e: any) => {
            // 右键点击结束
            let position = this.#viewer.scene.pickPosition(e.position);
            if (Cesium.defined(position)) {
                if (pointA && pointB) {
                    let p = calculateRectangle([pointA, pointB, position])
                    let hierarchyP = new Cesium.PolygonHierarchy(p)
                    let polylineP = p.concat([p[0]])                    
                    let properties = {
                        id: 'rectangle-' + crypto.randomUUID(),
                        polyline: {
                            positions: polylineP,
                            width: 2,
                            clampToGround: true,
                            material: Cesium.Color.YELLOW,
                            arcType: Cesium.ArcType.RHUMB
                        },
                        polygon: {
                            hierarchy: hierarchyP,
                            material: new Cesium.ColorMaterialProperty(
                                Cesium.Color.LIGHTSKYBLUE.withAlpha(0.5)
                            ),
                            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                        }
                    };
                    if (options.polyline) {
                        options.polyline.positions = polylineP
                    }
                    if (options.polygon) {
                        options.polygon.hierarchy = hierarchyP
                    }
                    let o = Object.assign(properties, options)
                    this.addData(o);
                    this.drawEnd();
                }
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /**
     * 撤销
     * @returns 
     */
    revoke(): boolean {
        if (this.#drawShapeEntities.length > 0) {
            let delFeature = this.#drawShapeEntities.pop();
            this.#drawShapeSource.entities.remove(delFeature!)
            return true
        }
        return false
    }

    /**
     * 清空
     */
    removeAll() {
        while (this.revoke());
    }

    /**
     * 绘图前准备工作
     * @returns {ScreenSpaceEventHandler} 屏幕事件句柄
     */
    drawStart(): ScreenSpaceEventHandler {
        // 开始绘图前先清除上次绘图的状态
        this.drawEnd()
        // 修改鼠标样式
        window.document.body.style.cursor = 'crosshair';
        // 获取屏幕事件句柄
        let handler = new Cesium.ScreenSpaceEventHandler(this.#viewer.canvas);
        // 开启深度探测
        if (!this.#isDepth) {
            this.#viewer.scene.globe.depthTestAgainstTerrain = true;
            console.log('%c自动开启深度检测！', 'color: #43bb88;');
        }
        return handler;
    }

    /**
     * 绘图完毕的清除工作
     */
    drawEnd(): void {
        // 恢复鼠标样式
        window.document.body.style.cursor = 'auto';
        // 恢复深度检测状态
        this.#viewer.scene.globe.depthTestAgainstTerrain = this.#isDepth
        // 销毁事件句柄
        if (this.#handler && !this.#handler.isDestroyed()) {
            this.#handler.destroy()
            this.#handler = null
        }
        // 销毁当前临时绘图 Entity
        if (this.#drawEntity) {
            this.#viewer.entities.remove(this.#drawEntity)
            this.#drawEntity = null
        }
        // 销毁当前临时绘图的节点 Entity
        if (this.#pointNodeArr.length > 0) {
            this.#pointNodeArr.forEach(v => {
                this.#viewer.entities.remove(v)
            })
            this.#pointNodeArr.length = 0
        }
        // 清空当前临时绘图的节点坐标数组
        if (this.#pointNodePosiArr.length > 0) {
            this.#pointNodePosiArr.length = 0
        }
    }

    /**
     * 添加 Entity
     * @param { Entity.ConstructorOptions } options 
     */
    addData(options: Entity.ConstructorOptions) {
        this.#drawShapeEntities.push(
            this.#drawShapeSource.entities.add(
                new Cesium.Entity(options)
            )
        )
    }

    /**
     * 添加临时绘图节点
     * @param { Cartesian3 } position 节点坐标
     */
    addTemporaryPoint(position: Cartesian3): void {
        let pointEntity = this.#viewer.entities.add({
            position: position,
            point: {
                color: Cesium.Color.RED,
                pixelSize: 8,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
        this.#pointNodePosiArr.push(position)
        this.#pointNodeArr.push(pointEntity);
    }
}
