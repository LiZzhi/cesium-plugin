import * as Cesium from "cesium";
import { Viewer, GeoJsonDataSource, Event } from "cesium";

type optionType = {
    billboardImg?: string,
    clusterImg?: string,
    pixelRange?: number,
    minimumClusterSize?: number,
    billboardShow?: boolean,
    pointShow?: boolean,
    labelShow?: boolean,
};

export default class pointCluster{
    #viewer: Viewer;
    #geoJson: string;
    #geoJsonDataSource: GeoJsonDataSource;
    #options: optionType;
    #clusterEvent: Event.RemoveCallback|null;
    constructor(viewer: Viewer, jsonUrl: string, options: optionType = {}){
        this.#viewer = viewer;
        this.#geoJson = jsonUrl;
        this.#geoJsonDataSource = new Cesium.GeoJsonDataSource();
        this.#options = Object.assign(this.defaultOption, options);
        this.#clusterEvent = null;
    }

    init(){
        new Cesium.GeoJsonDataSource().load(this.#geoJson).then(data => {
            this.#geoJsonDataSource = data;
            this.#viewer.dataSources.add(data);
            // 开启聚合
            data.clustering.enabled = true;
            // 设置像素
            data.clustering.pixelRange = this.#options.pixelRange!;
            data.clustering.minimumClusterSize = this.#options.minimumClusterSize!;
            // 聚合事件
            this.#setClusterEvent(data);
            // 设置相机的图标
            data.entities.values.forEach((entity) => {
                // billboard图标
                entity.billboard!.image = new Cesium.ConstantProperty(this.#options.billboardImg);
                entity.billboard!.heightReference = new Cesium.ConstantProperty(Cesium.HeightReference.RELATIVE_TO_GROUND);
            });
        })
    }

    /**
     * @description: 设置可见性
     * @param {boolean} show 是否可见
     * @return {*}
     */
    setVisible(show: boolean){
        this.#geoJsonDataSource!.show = show;
    }

    /**
     * @description: 获取可见性
     * @return {boolean}
     */
    getVisible(){
        return this.#geoJsonDataSource!.show;
    }

    #setClusterEvent(geoJsonDataSource: GeoJsonDataSource) {
        this.#clusterEvent = geoJsonDataSource.clustering.clusterEvent.addEventListener(
            (clusteredEntities, cluster)=>{
                cluster.billboard.id = cluster.label.id;
                // 是否显示
                cluster.billboard.show= this.#options.billboardShow!;
                cluster.label.show= this.#options.labelShow!;
                cluster.point.show= this.#options.pointShow!;
                // 位置属性
                cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                cluster.billboard.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                // cluster.point.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                cluster.label.text = clusteredEntities.length.toLocaleString();
                cluster.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                cluster.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                cluster.label.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                // 聚合图标
                cluster.billboard.image = this.#options.clusterImg!;
                // if (clusteredEntities.length > 5) {
                //     cluster.billboard.image = this.#options.clusterImg!;
                // }else {
                //     cluster.billboard.image = this.#options.billboardImg!;
                // }
            }
        )
    }

    get defaultOption(): optionType{
        return {
            pixelRange: 30,
            minimumClusterSize: 3,
            billboardImg: "public/img/pointCluster/bluecamera.png",
            clusterImg: "public/img/pointCluster/board1.png",
            billboardShow: true,
            labelShow: true,
            pointShow: false,
        }
    }
}