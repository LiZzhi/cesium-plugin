import * as Cesium from "cesium";
import Geohash from "latlon-geohash";
import { Viewer, CustomDataSource, Entity, ScreenSpaceEventHandler } from "cesium";

/**
 * geoHash网格，最高只到六级，高级别卡的厉害
 */
export default class geoHashGrid{
    #viewer: Viewer
    #gridDataSource: CustomDataSource
    #checkedEntity: Entity|null
    #level: number
    #list: string[]
    #start: boolean
    #handler: ScreenSpaceEventHandler|null
    #thisDrawGrid: ()=>void
    constructor(viewer: Viewer) {
        this.#viewer = viewer;
        this.#gridDataSource = new Cesium.CustomDataSource("gridDataSource");
        this.#viewer.dataSources.add(this.#gridDataSource);

        this.#checkedEntity = null;
        this.#level = 0;
        this.#list = [];
        this.#start = false;
        this.#handler = null;
        this.#thisDrawGrid = this.#drawGrid.bind(this); // 防止监听事件中 this 指向丢失
    }

    /**
     * 开启网格绘制
     */
    init(): void {
        if (!this.#start) {
            this.#eraseGrid();
            this.#list.length = 0;
            this.#viewer.camera.changed.addEventListener(this.#thisDrawGrid);
            this.#addEvent();
            this.#start = true;
        }
    }

    /**
     * 移除网格绘制
     */
    remove(): void {
        if (this.#start) {
            this.#viewer.camera.changed.removeEventListener(this.#thisDrawGrid);
            this.#eraseGrid();
            this.#list.length = 0;
            if (this.#checkedEntity) {
                this.#viewer.entities.remove(this.#checkedEntity);
                this.#checkedEntity = null;
            }
            if (this.#handler) {
                this.#handler.removeInputAction(
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                this.#handler.removeInputAction(
                    Cesium.ScreenSpaceEventType.RIGHT_CLICK
                );
                this.#handler.destroy();
                this.#handler = null;
            }
            this.#start = false;
        }
    }

    /**
     * 绘制网格
     * @param {string} hash geoHash字符串
     * @returns
     */
    #drawHashBox(hash: string): void {
        if (this.#gridDataSource.entities.getById(hash) != undefined) {
            return;
        }
        let b = Geohash.bounds(hash);

        let rectangle = Cesium.Rectangle.fromDegrees(
            b.sw.lon,
            b.sw.lat,
            b.ne.lon,
            b.ne.lat
        );
        // 网格数
        let gridNumLon = this.#level <= 5 ? 1 : 4;
        let gridNumLat = this.#level <= 5 ? 1 : 8;
        this.#gridDataSource.entities.add({
            id: hash,
            // position: Cesium.Cartesian3.fromDegrees((b.sw.lon + b.ne.lon) / 2, (b.sw.lat + b.ne.lat) / 2),
            rectangle: {
                coordinates: rectangle,
                fill: true,
                outline: true,
                outlineColor: Cesium.Color.WHITE,
                // 利用网格材质通过低级别的网格模拟高级别的网格，减少Entity数量
                material: new Cesium.GridMaterialProperty({
                    color: Cesium.Color.WHITE,
                    cellAlpha: 0,
                    lineCount: new Cesium.Cartesian2(gridNumLon, gridNumLat),
                    lineThickness: new Cesium.Cartesian2(1.0, 1.0),
                }),
            },
            // label: {
            //     text: hash,
            //     verticalOrigin: Cesium.VerticalOrigin.TOP,
            //     font: '12px sans-serif',
            //     fillColor: Cesium.Color.WHITE,
            // },
        });
        this.#list.push(hash);
    }

    /**
     * 清空网格
     */
    #eraseGrid(): void {
        this.#gridDataSource.entities.removeAll();
        this.#list.length = 0;
    }

    /**
     * 计算网格
     * @returns
     */
    #drawGrid():void {
        let rectangle = this.#viewer.camera.computeViewRectangle();

        // 获取当前相机高度
        let height = Math.ceil(this.#viewer.camera.positionCartographic.height);
        let zoom = this.getLevel(height);
        // 获取相机视角
        let north = (rectangle!.north * 180) / Math.PI;
        let south = (rectangle!.south * 180) / Math.PI;
        let east = (rectangle!.east * 180) / Math.PI;
        let west = (rectangle!.west * 180) / Math.PI;

        // 级别太高了卡，最高只到 6 级
        let level = Math.min(zoom / 2, 6);

        // 当大于5级时，依然用5级计算，以减少Entity数量，用网格材质模拟高等级效果
        let useLevel = level <= 5 ? level : 5;
        let neHash = Geohash.encode(north, east, useLevel);
        let nwHash = Geohash.encode(north, west, useLevel);
        let swHash = Geohash.encode(south, west, useLevel);

        let current = neHash;
        let eastBound = neHash;
        let westBound = nwHash;
        let maxHash = 102400;
        if (level !== this.#level) {
            this.#eraseGrid();
        }
        this.#level = level;
        while (maxHash-- > 0) {
            this.#drawHashBox(current);
            do {
                current = Geohash.adjacent(current, "w");
                this.#drawHashBox(current);
            } while (maxHash-- > 0 && current != westBound);
            if (current == swHash) {
                return;
            }
            westBound = Geohash.adjacent(current, "s");
            current = eastBound = Geohash.adjacent(eastBound, "s");
        }
    }

    /**
     * 点击高亮事件
     */
    #addEvent():void {
        this.#handler = new Cesium.ScreenSpaceEventHandler(
            this.#viewer.scene.canvas
        );
        this.#handler.setInputAction((e:any) => {
            let height = Math.ceil(
                this.#viewer.camera.positionCartographic.height
            );
            let zoom = this.getLevel(height);
            let level = Math.min(zoom / 2, 6);

            let ellipsoid = this.#viewer.scene.globe.ellipsoid;
            let pickPosition = this.#viewer.scene.camera.pickEllipsoid(
                e.position,
                ellipsoid
            );
            if (Cesium.defined(pickPosition)) {
                let cartographic =
                    ellipsoid.cartesianToCartographic(pickPosition!);
                let lat = Cesium.Math.toDegrees(cartographic.latitude);
                let lon = Cesium.Math.toDegrees(cartographic.longitude);
                let hash = Geohash.encode(lat, lon, level);
                let bound = Geohash.bounds(hash);
                if (this.#checkedEntity) {
                    this.#viewer.entities.remove(this.#checkedEntity);
                }

                this.#checkedEntity = this.#viewer.entities.add({
                    id: "hash-checked",
                    rectangle: new Cesium.RectangleGraphics({
                        coordinates: Cesium.Rectangle.fromDegrees(
                            bound.sw.lon,
                            bound.sw.lat,
                            bound.ne.lon,
                            bound.ne.lat
                        ),
                        fill: false,
                        outline: true,
                        outlineColor: Cesium.Color.RED,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    }),
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.#handler.setInputAction(() => {
            if (this.#checkedEntity) {
                this.#viewer.entities.remove(this.#checkedEntity);
                this.#checkedEntity = null;
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /**
     * 获取层级
     * @param {number} height 高度
     * @returns {number} 层级
     */
    getLevel(height: number):number {
        if (height > 48000000) {
            return 0;
        } else if (height > 24000000) {
            return 1;
        } else if (height > 12000000) {
            return 2;
        } else if (height > 6000000) {
            return 3;
        } else if (height > 3000000) {
            return 4;
        } else if (height > 1500000) {
            return 5;
        } else if (height > 750000) {
            return 6;
        } else if (height > 375000) {
            return 7;
        } else if (height > 187500) {
            return 8;
        } else if (height > 93750) {
            return 9;
        } else if (height > 46875) {
            return 10;
        } else if (height > 23437.5) {
            return 11;
        } else if (height > 11718.75) {
            return 12;
        } else if (height > 5859.38) {
            return 13;
        } else if (height > 2929.69) {
            return 14;
        } else if (height > 1464.84) {
            return 15;
        } else if (height > 732.42) {
            return 16;
        } else if (height > 366.21) {
            return 17;
        } else {
            return 18;
        }
    }
}