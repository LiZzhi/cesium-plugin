import * as Cesium from "cesium";
import { Viewer, Cartesian3, Event } from "cesium";

class _linkView {
    #viewer3D: Viewer;
    #viewer2D: Viewer | null;
    #$container3D: HTMLDivElement;
    #$container2D: HTMLDivElement;
    #camreaListener: Event.RemoveCallback | null;
    constructor($container3D: HTMLDivElement, viewer3D: Viewer) {
        this.#viewer3D = viewer3D;
        this.#$container3D = $container3D;
        this.#viewer2D = null;
        this.#$container2D = this.#creatDom2D();
        this.#camreaListener = null;
    }

    /**
     * 打开 Cesium 二三维联动
     */
    openCesiumMapLink23d() {
        this.#isThis()
        this.destroy();
        if (this.#viewer3D && !this.#viewer2D) {
            this.#viewer2D = new Cesium.Viewer(
                "MapContainer2D",
                this.options2D
            );
            this.#initDom23D();
            this.#initViewer2D();
            this.#setCameraView2D();
        }
    }

    /**
     * 销毁
     */
    destroy() {
        this.#isThis()
        if (this.#camreaListener) {
            this.#viewer3D.camera.changed.removeEventListener(
                this.#camreaListener
            );
            this.#camreaListener = null;
        }
        this.#viewer2D = null;
        this.#$container2D.remove();
        this.#$container2D = this.#creatDom2D();
        this.#$container3D.style.display = "block";
        this.#$container3D.style.width = "100%";
    }

    /**
     * 默认 2D 视图 Options
     * @returns { Viewer.ConstructorOptions }
     */
    get options2D(): Viewer.ConstructorOptions {
        return {
            homeButton: false,
            fullscreenButton: false,
            sceneModePicker: false,
            clockViewModel: new Cesium.ClockViewModel(),
            infoBox: false,
            geocoder: false,
            sceneMode: Cesium.SceneMode.SCENE2D,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            baseLayerPicker: false,
        };
    }

    /**
     * 获取相机聚焦位置
     * @returns { Cartesian3|undefined }
     */
    get cameraFocus3d(): Cartesian3 | undefined {
        this.#isThis()
        if (this.#viewer3D) {
            // canvas 中心位置为相机焦点
            let viewCenter = new Cesium.Cartesian2(
                Math.floor(this.#viewer3D.canvas.clientWidth / 2),
                Math.floor(this.#viewer3D.canvas.clientHeight / 2)
            );

            // 给定中心的像素，获取世界位置
            let worldPosition = this.#viewer3D.scene.camera.pickEllipsoid(
                viewCenter,
                this.#viewer3D.scene.globe.ellipsoid
            );

            return worldPosition;
        }
    }

    /**
     * 初始化 viewer2D
     */
    #initViewer2D(): void {
        if (this.#viewer2D) {
            // 没有影像图层时地球的底色
            this.#viewer2D.scene.globe.baseColor = Cesium.Color.BLACK;
            // 去版权
            (
                this.#viewer2D.cesiumWidget.creditContainer as HTMLElement
            ).style.display = "none";
            // 获取相机聚焦位置
            let focus = this.cameraFocus3d;
            // 同步相机视角
            if (Cesium.defined(focus)) {
                // 计算高度
                let distance = Cesium.Cartesian3.distance(
                    focus!,
                    this.#viewer3D.camera.positionWC
                );
                this.#viewer2D!.camera.lookAt(
                    focus!,
                    new Cesium.Cartesian3(0, 0, distance)
                );
            }
            // 是否开启抗锯齿
            this.#viewer2D.scene.postProcessStages.fxaa.enabled = true;
        }
    }

    /**
     * 23D 视角同步
     */
    #setCameraView2D() {
        if (this.#viewer3D && this.#viewer2D) {
            if (this.#camreaListener) {
                this.#viewer3D.camera.changed.removeEventListener(
                    this.#camreaListener
                );
            }
            // 视角同步
            this.#camreaListener =
                this.#viewer3D.camera.changed.addEventListener(() => {
                    // 防止清空时 viewer2D 被清空时 camreaListener 没有及时清掉导致报错
                    if (this.#viewer2D) {
                        // 获取相机聚焦位置
                        let focus = this.cameraFocus3d;
                        // 同步相机视角
                        if (Cesium.defined(focus)) {
                            // 计算高度
                            let distance = Cesium.Cartesian3.distance(
                                focus!,
                                this.#viewer3D.camera.positionWC
                            );
                            this.#viewer2D.camera.lookAt(
                                focus!,
                                new Cesium.Cartesian3(0, 0, distance)
                            );
                        }
                    }
                });
            // 默认情况下，“camera.changed”事件将在相机更改50%时触发,我们可以提高这种敏感度
            this.#viewer3D.camera.percentageChanged = 0.01;
        }
    }

    /**
     * 修改 DOM,各占屏幕一半
     */
    #initDom23D(): void {
        if (this.#$container3D) {
            this.#$container3D.style.display = "inline-block";
            this.#$container3D.style.height = "100%";
            this.#$container3D.style.width = "50%";
        }
        if (this.#$container2D) {
            this.#$container2D.style.display = "inline-block";
            this.#$container2D.style.height = "100%";
            this.#$container2D.style.width = "50%";
        }
    }

    /**
     * 创建 viewer2D DOM
     * @returns { HTMLDivElement } viewer2D DOM
     */
    #creatDom2D(): HTMLDivElement {
        let $container2D = document.createElement("div");
        $container2D.id = "MapContainer2D";
        $container2D.style.margin = "0";
        $container2D.style.padding = "0";
        this.#$container3D.after($container2D);

        return $container2D;
    }

    /**
     * 判断 this 指向
     */
    #isThis():void{
        if (!(this instanceof _linkView)) {
            // 判断 this 指向, 防止全局执行
            throw new Error("linkView 实例中 this 指向全局，请正确调用或修正 this 指向");
        }
    }
}

export default class linkView {
    // _drawShape 实例
    static #instance: _linkView;
    constructor() {
        //禁止实例化
        throw new Error("禁止实例化，请使用静态方法 < linkView.getInstance >");
    }

    /**
     * 单例模式,获取二三维视图联动实例
     * @param { HTMLDivElement } $container3D 3D 视图的 DOM
     * @param { Viewer } viewer3D 3D 视图的 viewer
     * @returns { _linkView } 二三维视图联动类实例
     */
    static getInstance($container3D: HTMLDivElement, viewer3D: Viewer): _linkView {
        if (linkView.#instance) {
            return linkView.#instance;
        } else {
            linkView.#instance = new _linkView($container3D, viewer3D);
            return linkView.#instance;
        }
    }
}
