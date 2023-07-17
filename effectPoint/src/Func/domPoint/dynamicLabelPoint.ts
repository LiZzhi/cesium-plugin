import * as Cesium from "cesium";
import { Viewer } from "cesium";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../Style/DynamicLabelPoint.css";

export default class dynamicLabelPoint extends domPointBase {
    #contextLabel: string;
    constructor(
        viewer: Viewer,
        worldDegrees: worldDegreesType,
        contextLabel: string
    ) {
        super(viewer, worldDegrees, true);
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
        let $body = document.createElement('div');
        $body.classList.add('sz-component-animate-marker__boder');
        let $label = document.createElement('span');
        $label.classList.add('sz-component-animate-marker__text');

        $label.innerHTML = this.#contextLabel;
        $body.appendChild($label);
        this.$container.appendChild($body);
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
