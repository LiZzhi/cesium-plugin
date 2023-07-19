import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../assets/css/erectLabelPoint.css";

export default class erectLabelPoint extends domPointBase {
    #contextLabel: string;
    /**
     * @description: 竖立文本点，显示为可展示文本的文本点
     * @param {Viewer} viewer viewer实例
     * @param {worldDegreesType} worldDegrees 位置，经纬度和高
     * @param {string} contextLabel 插入的文本
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
        // this.$container.classList.add("is-shulie");
        this.$container.innerHTML = `
            <div class="erect-label-point-container">
                <div class="is-shulie">
                    <div class="is-shulie-item"></div>
                    <div class="pre-topCard-list-item-line"></div>
                </div>
            </div>
        `;
        // 带一个dom点
        // this.$container.innerHTML = `
        //     <div class="is-shulie-item"></div>
        //     <div class="pre-topCard-list-item-line"></div>
        //     <div class="pre-topCard-list-item-circle"></div>
        // `;
        const shulie = this.$container.querySelector(".is-shulie-item");
        shulie!.innerHTML = this.#contextLabel;
        this.viewer.cesiumWidget.container.appendChild(this.$container);
    }

    /**
     * @description: 注册场景事件
     * @return {*}
     */
    #addPostRender() {
        this.postRender({ directionX: "center", directionY: "bottom" });
        this.viewer.scene.postRender.addEventListener(
            this.postRenderFunc,
            this
        );
    }
}
