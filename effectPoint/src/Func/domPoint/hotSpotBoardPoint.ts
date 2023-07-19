import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../assets/css/hotSpotBoardPoint.css";

export default class hotSpotBoardPoint extends domPointBase {
    #contextDom: HTMLElement;
    /**
     * @description: 热点面板点，显示为可插入DOM的热点面板点
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
            <div class="hotspot-point-container">
                <div class="hot-spot">
                    <div class="hot-spot-board hot-spot-board-medium"></div>
                    <div class="hot-spot-line hot-spot-line-medium"></div>
                </div>
            </div>
        `;

        const hotSpot = this.$container.querySelector(".hot-spot") as HTMLElement;
        const labelBoard = this.$container.querySelector(".hot-spot-board") as HTMLElement;

        labelBoard!.appendChild(this.#contextDom);
        this.viewer.cesiumWidget.container.appendChild(this.$container);

        hotSpot.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotBottom.png")`;
        labelBoard.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotHead.png")`;
        this.$container.onmouseover = (e) => {
            hotSpot.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotBottom-active.png")`;
            labelBoard.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotHead-active.png")`;
        };

        this.$container.onmouseout = (e) => {
            hotSpot.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotBottom.png")`;
            labelBoard.style.backgroundImage = `url("public/img/hotSpotBoardPoint/hotSpotHead.png")`;
        };
    }

    /**
     * @description: 注册场景事件
     * @return {*}
     */
    #addPostRender() {
        this.postRender({ directionX: "center", directionY: "middle" });
        this.viewer.scene.postRender.addEventListener(
            this.postRenderFunc,
            this
        );
    }
}
