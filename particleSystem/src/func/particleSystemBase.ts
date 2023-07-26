import * as Cesium from "cesium";
import type { particleStyleType, eventFuncType } from "../type";

export default class particleSystemBase {
    protected viewer: Cesium.Viewer;
    protected entity: Cesium.Entity;
    protected particleSystemCollection: Cesium.CustomDataSource;
    protected particleSystem: Cesium.ParticleSystem;
    protected emitterModelMatrix: Cesium.Matrix4;
    protected translation: Cesium.Cartesian3;
    protected rotation: Cesium.Quaternion;
    protected hpr: Cesium.HeadingPitchRoll;
    protected trs: Cesium.TranslationRotationScale;
    protected preUpdateEventFunc: eventFuncType;
    protected entityChangedEvent: eventFuncType;
    protected gravityScratch: Cesium.Cartesian3;
    protected isStart: boolean;
    protected isDestroy: boolean;
    protected visible: boolean;

    /**
     * @description: 粒子系统基类，用于继承，不应实例化
     * @param {Cesium.Viewer} viewer
     * @param {Cesium.Cartesian3} position
     * @return {*}
     */
    constructor(viewer: Cesium.Viewer, position: Cesium.Cartesian3) {
        this.viewer = viewer;
        // 通过entity控制位置
        this.entity = new Cesium.Entity({
            position,
            show: false,
        });
        let particleSystemSource = this.viewer.dataSources.getByName(
            "particleSystemSource"
        );
        if (particleSystemSource.length) {
            this.particleSystemCollection = particleSystemSource[0];
        } else {
            this.particleSystemCollection = new Cesium.CustomDataSource(
                "particleSystemSource"
            );
            this.viewer.dataSources.add(this.particleSystemCollection);
        }
        this.particleSystemCollection.entities.add(this.entity);
        // 粒子
        this.particleSystem = new Cesium.ParticleSystem();
        // 方位属性
        this.emitterModelMatrix = new Cesium.Matrix4();
        this.translation = new Cesium.Cartesian3();
        this.rotation = new Cesium.Quaternion();
        this.hpr = new Cesium.HeadingPitchRoll();
        this.trs = new Cesium.TranslationRotationScale();
        // 更新事件,用于后续移除
        this.preUpdateEventFunc = () => {};
        // 重力方向
        this.gravityScratch = new Cesium.Cartesian3();
        // 移除entity即触发destroy
        this.entityChangedEvent = (e: any) => {
            if(this.isStart && !this.isDestroy){
                let entity = e._entities._array.find((entity: any) => entity.id === this.entity.id);
                if (entity === undefined) {
                    this.destroy();
                }
            }
        }
        this.entity.entityCollection.collectionChanged.addEventListener(this.entityChangedEvent);
        // 是否创建或销毁
        this.isStart = false;
        this.isDestroy = false;
        // 是否可见
        this.visible = false;
    }

    /**
     * @description: 设置可见性
     * @param {boolean} show 是否可见
     * @return {*}
     */
    protected setVisible(show: boolean){
        this.particleSystem.show = show;
        this.visible = show;
    }

    /**
     * @description: 获取可见性
     * @return {*}
     */
    protected getVisible(){
        return this.visible;
    }

    /**
     * @description: 公用销毁
     * @return {*}
     */
    protected destroy(){
        if(this.isStart && !this.isDestroy){
            this.#removeEvent(); //清除事件
            this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
            this.particleSystemCollection.entities.remove(this.entity); //删除entity
            this.isStart = false;
            this.isDestroy = true;
            return true;
        } else {
            console.log("未创建或已经销毁");
            return false;
        }
    }

    /**
     * @description: 
     * @param {particleStyleType} style 粒子的 particleStyleType
     * @param {eventFuncType} callBack 回调函数,每次更新都会执行
     * @return {*}
     */
    protected preUpdateEvent(style: particleStyleType, callBack?: eventFuncType) {
        this.preUpdateEventFunc = (scene: Cesium.Scene, time: Cesium.JulianDate) => {
            this.particleSystem.modelMatrix = this.entity.computeModelMatrix(
                time,
                new Cesium.Matrix4()
            );
            this.hpr = Cesium.HeadingPitchRoll.fromDegrees(
                style.heading!,
                style.pitch!,
                0.0,
                this.hpr
            );
            this.trs.translation = Cesium.Cartesian3.fromElements(
                0,
                0,
                0,
                this.translation
            );
            this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(
                this.hpr,
                this.rotation
            );
            this.particleSystem.emitterModelMatrix =
                Cesium.Matrix4.fromTranslationRotationScale(
                    this.trs,
                    this.emitterModelMatrix
                );
            typeof callBack === "function" && callBack();
        };
        return this.preUpdateEventFunc
    }

    /**
     * @description: 重力 计算局部向上量
     * @return {*}
     */
    protected applyGravity(particle: Cesium.Particle, dt: number, style: particleStyleType) {
        // We need to compute a local up vector for each particle in geocentric space.
        Cesium.Cartesian3.normalize(particle.position, this.gravityScratch);
        Cesium.Cartesian3.multiplyByScalar(
            this.gravityScratch,
            style.gravity! * dt,
            this.gravityScratch
        );
        Cesium.Cartesian3.add(
            particle.velocity,
            this.gravityScratch,
            particle.velocity
        );
    }

    /**
     * @description: 销毁事件
     * @return {*}
     */
    #removeEvent() {
        this.entity.entityCollection.collectionChanged.removeEventListener(this.entityChangedEvent);
        this.viewer.scene.preUpdate.removeEventListener(
            this.preUpdateEventFunc,
            this
        );
        this.emitterModelMatrix = new Cesium.Matrix4();
        this.translation = new Cesium.Cartesian3();
        this.rotation = new Cesium.Quaternion();
        this.hpr = new Cesium.HeadingPitchRoll();
        this.trs = new Cesium.TranslationRotationScale();
    }
}
