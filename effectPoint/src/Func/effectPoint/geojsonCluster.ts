/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 09:58:54
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 11:21:17
 * @FilePath: \cesium-plugin\effectPoint\src\Func\effectPoint\geojsonCluster.ts
 * @Description: geojson聚合，使用的时原生聚合方法，大量entity可能会导致卡顿
 */
import * as Cesium from "cesium";
import {Viewer, Event, GeoJsonDataSource, Billboard, Label, PointPrimitive, Entity} from 'cesium';

export type callBackParamsType = {
    billboard: Billboard | undefined;
    label: Label | undefined;
    point: PointPrimitive | undefined;
    entities: Entity[];
}

export type clusterOptionType = {
    enabled?: boolean;  // 是否启用聚合
    pixelRange?: number;    // 聚合像素范围
    minimumClusterSize?: number;    // 聚合开启临界(当屏幕内实体数量低于此时无需聚合)
    billboard?: boolean;    // 是否显示billboards
    label?: boolean;    // 是否显示label
    point?: boolean;    // 是否显示point
    callBack?: (p: callBackParamsType) => void;   // 回调
};

export default class geojsonCluster {
    #viewer: Viewer;
    #options: clusterOptionType;
    #start: boolean;
    #visible: boolean;
    #listener: Event.RemoveCallback|undefined;
    #geoJsonDataSource: GeoJsonDataSource;

    /**
     * @description: geojson聚合，使用的时原生聚合方法，大量entity可能会导致卡顿
     * @param {Viewer} viewer
     * @param {clusterOptionType} options
     * @return {*}
     */
    constructor(viewer: Viewer, options: clusterOptionType={}) {
        this.#viewer = viewer;
        this.#options = Object.assign(this.defaultOption, options);
        this.#geoJsonDataSource = new Cesium.GeoJsonDataSource();
        this.#listener = undefined;
        this.#start = false;
        this.#visible = true;
    }

    /**
     * @description: 开启聚合
     * @param {any} data  待加载的url或GeoJson对象或TopoJSON对象
     * @return {*}
     */
    init(data: any) {
        if(!this.#start){
            this.#start = true;
            let dataSource = new Cesium.GeoJsonDataSource().load(data, {
                clampToGround: true,
            });
            dataSource.then((geoJsonDataSource) => {
                this.#geoJsonDataSource = geoJsonDataSource;
                this.#viewer.dataSources.add(geoJsonDataSource);
                geoJsonDataSource.clustering.enabled = true;
                //设置像素
                this.#setClusterEvent(geoJsonDataSource);
            });
        }
    }

    /**
     * @description: 销毁
     * @return {*}
     */
    destroy() {
        if (this.#start) {
            this.#listener && this.#geoJsonDataSource.clustering.clusterEvent.removeEventListener(
                this.#listener
            );
            this.#listener = undefined;
            this.#viewer.dataSources.remove(this.#geoJsonDataSource);
        }
    }

    /**
     * @description: 设置可见性
     * @param {boolean} visible 是否可见
     * @return {*}
     */
    setVisible(visible: boolean){
        if (this.#start) {
            this.#visible = visible;
            this.#geoJsonDataSource.show = visible;
        }
    }

    /**
     * @description: 获取可见性
     * @return {boolean} 是否可见
     */
    getVisible(){
        return this.#visible;
    }

    /**
     * @description: 聚合事件
     * @param {GeoJsonDataSource} geoJsonDataSource
     * @return {*}
     */
    #setClusterEvent(geoJsonDataSource: GeoJsonDataSource) {
        const options = this.#options;
        if(!options.enabled){
            geoJsonDataSource.clustering.enabled = !!options.enabled;
            return;
        }
        geoJsonDataSource.clustering.pixelRange = options.pixelRange || 50;
        geoJsonDataSource.clustering.minimumClusterSize = options.minimumClusterSize || 2;

        const offset = new Cesium.Cartesian2(0, -50);
        this.#listener = geoJsonDataSource.clustering.clusterEvent.addEventListener(
            (clusteredEntities, cluster) => {
                // 是否显示
                cluster.billboard.show = !!options.billboard;
                cluster.point.show = !!options.point;
                cluster.label.show = !!options.label;
                // billboard默认属性
                cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                cluster.billboard.image = "public/img/pointCluster/bluecamera.png";
                cluster.billboard.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
                // label默认属性
                cluster.label.text = clusteredEntities.length + '';
                cluster.label.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
                cluster.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                cluster.label.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
                cluster.label.pixelOffset = offset;
                if (typeof options.callBack === "function") {
                    options.callBack({
                        billboard: cluster.billboard,
                        label: cluster.label,
                        point: cluster.point,
                        entities: clusteredEntities
                    })
                }
            }
        );
    }

    /**
     * @description: 默认配置项
     * @return {clusterOptionType}
     */
    get defaultOption(): clusterOptionType {
        return {
            enabled: true,  // 是否启用聚合
            pixelRange: 50,    // 聚合像素范围
            minimumClusterSize: 2,    // 聚合开启临界(当屏幕内实体数量低于此时无需聚合)
            billboard: true,    // 是否显示billboards
            label: true,    // 是否显示label
            point: false,    // 是否显示point
            callBack: undefined,   // 回调
        };
    }
}
