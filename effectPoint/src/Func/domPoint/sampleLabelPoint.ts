import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../assets/css/sampleLabelPoint.css";

export default class sampleLabelPoint extends domPointBase {
    #contextDom: HTMLElement;
    /**
     * @description: 简单标注点，显示为可插入DOM的标注框
     * @param {Viewer} viewer viewer实例
     * @param {worldDegreesType} worldDegrees 位置，经纬度和高
     * @param {HTMLElement} contextDom 插入的DOM元素
     * @param {boolean} showEntityPoint (可选)是否显示点实体，默认为false
     * @return {*}
     */
    constructor(
        viewer: Viewer,
        worldDegrees: worldDegreesType,
        contextDom: HTMLElement,
        showEntityPoint: boolean = false
    ) {
        super(viewer, worldDegrees, showEntityPoint);
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
            <div class="sample-label-point-container">
                <div class="sample-label-point">
                    <div class="sample-label-point-closeBtn">x</div>
                    <div class="sample-label-point-text"></div>
                    <div class="sample-label-point-line"></div>
                </div>
            </div>
        `;
        const $text = this.$container.querySelector(".sample-label-point-text");
        $text!.appendChild(this.#contextDom);
        this.viewer.cesiumWidget.container.appendChild(this.$container);
    }

    /**
     * @description: 注册场景事件
     * @return {*}
     */
    #addPostRender() {
        this.postRender({ directionX: "left", directionY: "bottom" });
        this.viewer.scene.postRender.addEventListener(this.postRenderFunc, this);
    }
}
