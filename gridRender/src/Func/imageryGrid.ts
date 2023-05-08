import * as Cesium from "cesium";
import { Viewer, ScreenSpaceEventHandler, ImageryProvider, ImageryLayer, TilingScheme, Entity } from "cesium";

export default class imageryGrid{
    #viewer: Viewer;
    #handler: ScreenSpaceEventHandler|null;
    #gridImagery: ImageryProvider;
    #gridImageryLayer: ImageryLayer|null;
    #tilingScheme: TilingScheme;
    #entity: Entity|null;
    constructor(viewer: Viewer) {
        this.#viewer = viewer;
        this.#gridImagery = new Cesium.GridImageryProvider({
            backgroundColor: Cesium.Color.TRANSPARENT,
            color: Cesium.Color.WHITE,
            glowWidth: 0,
            cells: 1,
        });
        this.#tilingScheme = this.#gridImagery.tilingScheme;
        this.#gridImageryLayer = null;
        this.#handler = null;
        this.#entity = null;
    }

    /**
     * 创建网格
     */
    init():void {
        this.addImagery();
        this.addEvent();
    }

    /**
     * 删除网格
     */
    remove():void {
        if (this.#handler) {
            this.#handler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );
            this.#handler.removeInputAction(
                Cesium.ScreenSpaceEventType.RIGHT_CLICK
            );
            // this.#handler.removeInputAction(
            //     Cesium.ScreenSpaceEventType.WHEEL
            // );
            this.#handler.destroy();
            this.#handler = null;
        }
        if (this.#gridImageryLayer) {
            this.#viewer.imageryLayers.remove(this.#gridImageryLayer);
            this.#gridImageryLayer = null;
        }
        if(this.#entity){
            this.#viewer.entities.remove(this.#entity);
            this.#entity = null;
        }
    }

    /**
     * 添加网格 imageryProvider
     */
    addImagery():void {
        if (!this.#gridImageryLayer) {
            this.#gridImageryLayer = this.#viewer.imageryLayers.addImageryProvider(this.#gridImagery);
            //将图层置顶
            this.#viewer.imageryLayers.raiseToTop(this.#gridImageryLayer);
        }
    }

    /**
     * 高亮点击网格
     */
    addEvent():void {
        this.#handler = new Cesium.ScreenSpaceEventHandler(this.#viewer.scene.canvas);
        this.#handler.setInputAction((e:any) => {
            // @ts-ignore
            let level = this.#viewer.scene._globe._surface._tilesToRender[0]._level;    // 瓦片层级

            let pickPosition = this.#viewer.scene.camera.pickEllipsoid(e.position, this.#viewer.scene.globe.ellipsoid);
            if(Cesium.defined(pickPosition)){
                let cartographic = Cesium.Cartographic.fromCartesian(pickPosition!);

                let xy = this.#tilingScheme.positionToTileXY(cartographic, level);  // 获取瓦片 XY 编号
                // 根据瓦片 XY 编号和层级获取矩形
                let rectangle = this.#tilingScheme.tileXYToRectangle(
                    xy.x,
                    xy.y,
                    level
                );
                if(this.#entity){
                    this.#viewer.entities.remove(this.#entity);
                }
                // 添加 Entity
                this.#entity = this.#viewer.entities.add({
                    position: Cesium.Cartesian3.fromRadians((rectangle.west + rectangle.east) / 2, (rectangle.south + rectangle.north) / 2),
                    rectangle: new Cesium.RectangleGraphics({
                        coordinates: rectangle,
                        fill: false,
                        outline: true,
                        outlineColor: Cesium.Color.RED,
                        height: 1,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    }),
                    label:{
                        text: `X${xy.x}Y${xy.y}`,
                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                        font: '15px sans-serif',
                        fillColor: Cesium.Color.WHITE,
                    }
                });
            }


        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 右击移除 Entity
        this.#handler.setInputAction(() => {
            if(this.#entity){
                this.#viewer.entities.remove(this.#entity);
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        // this.#handler.setInputAction((e) => {
        //     if(this.#entity){
        //         this.#viewer.entities.remove(this.#entity);
        //     }
        // }, Cesium.ScreenSpaceEventType.WHEEL);
    }
}