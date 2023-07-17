import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../Style/divPoint.css";

export default class divPoint extends domPointBase {
    #contextDom: HTMLElement;
    constructor(
        viewer: Viewer,
        worldDegrees: worldDegreesType,
        contextDom: HTMLElement
    ) {
        super(viewer, worldDegrees, true);
        this.#contextDom = contextDom;
    }

    /**
     * @description: 初始化点位
     * @return {*}
     */
    public async init() {
        if (!this.isDestroy && !this.start) {
            this.start = true;
            this.position = await this.computePosition(
                this.viewer,
                this.worldDegrees
            );
            this.$container.style.display = "none";
            this.#addDom();
            this.#addPostRender();
            this.$container.style.display = "block";
        }
    }

    /**
     * @description: 销毁点位(注意:销毁后不应再初始化)
     * @return {*}
     */
    public destroy() {
        if (this.start && !this.isDestroy) {
            this.isDestroy = true;
            this.viewer.scene.postRender.removeEventListener(
                this.postRenderFunc,
                this
            ); //移除事件监听
            this.$container.remove();
            this.viewer.entities.remove(this.pointEntity);
        }
    }

    /**
     * @description: 获取当前点位
     * @return { Cartesian3 }
     */
    get getPosition() {
        return this.position;
    }

    /**
     * @description: 添加DOM
     * @return {*}
     */
    #addDom() {
        this.$container.innerHTML = `
            <div class="div-point-container">
                <div class="divpoint divpoint-theme">
                    <div class="divpoint-wrap">
                        <div class="divpoint-area">
                            <div class="arrow-lt"></div>
                            <div class="b-t"></div>
                            <div class="b-r"></div>
                            <div class="b-b"></div>
                            <div class="b-l"></div>
                            <div class="arrow-rb"></div>
                        </div>
                        <div class="b-t-l"></div>
                        <div class="b-b-r"></div>
                    </div>
                    <div class="arrow"></div>
                </div>
            </div>
        `;
        const rb = this.$container.querySelector(".arrow-rb");
        rb!.after(this.#contextDom);
        this.viewer.cesiumWidget.container.appendChild(this.$container);
    }

    /**
     * @description: 注册场景事件
     * @return {*}
     */
    #addPostRender() {
        this.postRender({ directionX: "center", directionY: "bottom" });
        this.viewer.scene.postRender.addEventListener(this.postRenderFunc, this);
    }
}
