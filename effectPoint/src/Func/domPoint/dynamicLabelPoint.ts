import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../Style/DynamicLabelPoint.css";

export default class dynamicLabelPoint extends domPointBase {
    #contextLabel: string;
    /**
     * @description: 动态文本点，显示为可插入文本的动态框
     * @param {Viewer} viewer viewer实例
     * @param {worldDegreesType} worldDegrees 位置，经纬度和高
     * @param {HTMLElement} contextDom 插入的文本
     * @param {boolean} showEntityPoint (可选)是否显示点实体，默认为false
     * @return {*}
     */
    constructor(
        viewer: Viewer,
        worldDegrees: worldDegreesType,
        contextLabel: string,
        showEntityPoint: boolean = false
    ) {
        super(viewer, worldDegrees, showEntityPoint);
        this.#contextLabel = contextLabel;
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
        this.$container.classList.add('dynamic-divlabel-container');
        this.$container.classList.add('dynamic-divlabel-container1');
        this.$container.innerHTML = `
            <div class="sz-component-animate-marker__boder">
                <span class="sz-component-animate-marker__text">${this.#contextLabel}</span>
            </div>
        `
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
