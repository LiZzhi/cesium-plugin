import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../assets/css/sampleLabelPoint.css";

export default class sampleLabelPoint extends domPointBase {
    #contextDom: HTMLElement;
    #boardVisible: boolean;
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
        this.#boardVisible = true;  // 控制面板显隐
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
            //移除事件监听
            this.viewer.scene.postRender.removeEventListener(
                this.postRenderFunc,
                this
            );
            //移除DOM点击事件
            const $pointDiv = this.$container.querySelector(".sample-label-point") as HTMLElement;
            const $closeBtn = this.$container.querySelector(".sample-label-board-line") as HTMLElement;
            $pointDiv.onclick = null;
            $closeBtn.onclick = null;
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
                <div class="sample-label-point"></div>
                <div class="sample-label-board">
                    <div class="sample-label-board-container">
                        <div class="sample-label-board-closeBtn">×</div>
                        <div class="sample-label-board-text"></div>
                    </div>
                    <div class="sample-label-board-line"></div>
                </div>
            </div>
        `;

        const $pointDiv = this.$container.querySelector(".sample-label-point") as HTMLElement;
        $pointDiv.style.backgroundImage = `url("public/img/sampleLabelPoint/point.png")`;
        $pointDiv.onclick = ()=>{
            this.#setBoardVisible(!this.#boardVisible);
        }
        const $lineDiv = this.$container.querySelector(".sample-label-board-line") as HTMLElement;
        $lineDiv.style.backgroundImage = `url("public/img/sampleLabelPoint/pedestal.png")`;
        const $closeBtn = this.$container.querySelector(".sample-label-board-closeBtn") as HTMLElement;
        $closeBtn.onclick = ()=>{
            this.#setBoardVisible(false);
        }
        const $text = this.$container.querySelector(".sample-label-board-text");
        $text!.appendChild(this.#contextDom);
        this.viewer.cesiumWidget.container.appendChild(this.$container);
    }

    /**
     * @description: 控制面板显隐，该面板仅为包含DOM的整个面板，会保留一个点用以控制重新打开
     * @param {boolean} show 是否显示
     * @return {*}
     */
    #setBoardVisible(show: boolean){
        const $board = this.$container.querySelector(".sample-label-board") as HTMLElement;
        $board.style.display = show ? "block" : "none";
        this.#boardVisible = show;
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
