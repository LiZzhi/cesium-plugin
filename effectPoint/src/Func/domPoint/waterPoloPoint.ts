import * as Cesium from "cesium";
import * as echarts from "echarts";
import 'echarts-liquidfill'
import { Viewer } from "cesium";
import type { EChartsType} from "echarts";
import domPointBase from "./domPointBase";
import type { worldDegreesType } from "../../Type";
import "../../assets/css/waterPoloPoint.css";

export default class waterPoloPoint extends domPointBase {
    #contextNumber: number;
    #chart: EChartsType|null;
    /**
     * @description: 水球点，显示为可表达比例的水球图表
     * @param {Viewer} viewer viewer实例
     * @param {worldDegreesType} worldDegrees 位置，经纬度和高
     * @param {number} contextNumber 插入的数字,会被转化为百分数
     * @param {boolean} showEntityPoint (可选)是否显示点实体，默认为false
     * @return {*}
     */
    constructor(
        viewer: Viewer,
        worldDegrees: worldDegreesType,
        contextNumber: number,
        showEntityPoint: boolean = false
    ) {
        super(viewer, worldDegrees, showEntityPoint);
        this.#contextNumber = contextNumber;
        this.#chart = null;
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
            const chartDom = this.$container.querySelector(".waterpolo-container") as HTMLElement;
            this.#chart = echarts.init(chartDom);
            this.#chart.setOption(this.defaultOption);
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
            this.#chart && this.#chart.dispose();
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
     * @description: 默认配置项
     * @return {any} 默认配置项,没有类型
     */
    get defaultOption():any{
        return{
            series: [{
                type: 'liquidFill',
                data: [this.#contextNumber],
                radius: '90%',
                outline: {
                    show: false
                },
                label: {
                    position: ['50%', '65%'],
                    textStyle: {
                        fontSize: 15,
                        fontFamily: 'Lobster Two'
                    }
                },
                itemStyle: {
                    color: '#ff9501'
                }
            }]
        }
    }

    /**
     * @description: 添加DOM
     * @return {*}
     */
    #addDom() {
        this.$container.innerHTML = `
            <div class="waterpolo-point-container">
                <div class="waterpolo-container"></div>
            </div>
        `;
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
