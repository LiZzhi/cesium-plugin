import * as Cesium from "cesium";
import { Viewer, Entity } from "cesium";
import type { CameraLimitOptionType, CameraRollbackViewType } from "../type";

export default class cameraLimit {
    #viewer: Viewer;
    #options: CameraLimitOptionType; // 限制范围球相关参数
    #rollbackView: CameraRollbackViewType; // 相机回滚参数
    #ellipsoid: Entity; // 限制范围球实体
    /**
     * @description: 相机范围限制，超出范围会回滚至范围内
     * @param {Viewer} viewer Viewer
     * @param {CameraLimitOptionType} options 限制范围球相关参数
     * @param {number} duration (可选)相机回滚时间,默认为1s
     * @return {*}
     */
    constructor(
        viewer: Viewer,
        options: CameraLimitOptionType,
        duration: number = 1
    ) {
        this.#viewer = viewer;
        this.#options = options;
        const camera = this.#viewer.scene.camera;
        this.#rollbackView = {
            destination: this.#options.position,
            orientation: new Cesium.HeadingPitchRoll(
                camera.heading,
                camera.pitch,
                camera.roll
            ),
            duration: duration,
        };
        this.#ellipsoid = new Entity();
    }

    /**
     * @description: 开启相机范围限制
     * @return {*}
     */
    setLimit() {
        if (this.#options.debugExtent) {
            //添加限制范围轮廓
            this.#addLimitEllipsoid();
        }
        const cross = this.#isCross();
        if (cross) {
            // @ts-ignore
            this.#viewer.camera.flyTo(this.#rollbackView);
        }
        this.#viewer.camera.moveEnd.addEventListener(
            this.#cameraMoveEndEventHnadle,
            this
        );
    }

    /**
     * @description: 移除相机范围限制
     * @return {*}
     */
    removeLimit() {
        this.#viewer.camera.moveEnd.removeEventListener(
            this.#cameraMoveEndEventHnadle,
            this
        );
        this.#viewer.entities.remove(this.#ellipsoid);
        this.#rollbackView.destination = this.#options.position;
    }

    /**
     * @description: 添加限制区域轮廓
     * @return {*}
     */
    #addLimitEllipsoid() {
        const radius = this.#options.radius;
        const position = this.#options.position;
        const show = this.#options.debugExtent;
        this.#ellipsoid = this.#viewer.entities.add({
            position,
            show,
            ellipsoid: {
                radii: new Cesium.Cartesian3(radius, radius, radius),
                maximumCone: Cesium.Math.toRadians(180),
                material: Cesium.Color.RED.withAlpha(0.1),
                subdivisions: 128,
                stackPartitions: 32,
                slicePartitions: 32,
                outline: true,
                outlineColor: Cesium.Color.AQUA.withAlpha(1),
            },
        });
    }

    /**
     * @description: 相机事件，触发回滚
     * @return {*}
     */
    #cameraMoveEndEventHnadle() {
        const cross = this.#isCross();
        if (cross) {
            // @ts-ignore
            this.#viewer.camera.flyTo(this.#rollbackView);
        } else {
            const camera = this.#viewer.camera;
            this.#rollbackView = {
                destination: Cesium.Cartesian3.clone(
                    this.#viewer.camera.position
                ),
                orientation: new Cesium.HeadingPitchRoll(
                    camera.heading,
                    camera.pitch,
                    camera.roll
                ),
                duration: this.#rollbackView.duration,
            };
        }
    }

    /**
     * @description: 判断是否越界
     * @return {boolean}
     */
    #isCross(): boolean {
        let p = this.#viewer.camera.position; //相机位置
        let distance = Cesium.Cartesian3.distance(p, this.#options.position); //两个点的距离
        return distance > this.#options.radius;
    }
}
