/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-07-12 16:22:31
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-07-31 21:12:15
 * @FilePath: \cesium-plugin\effectPoint\src\Utils\tool.ts
 * @Description:
 */
import * as Cesium from "cesium";
import { Viewer, Ellipsoid, Cartesian3 } from "cesium";

/**
 * @description: 获取精准地形高
 * @param {Viewer} viewer viewer
 * @param {number} lon  经度
 * @param {number} lat  纬度
 * @return {number}  地形高(米)
 */
export const getTerrainMostDetailedHeight = async (
    viewer: Viewer,
    lon: number,
    lat: number
): Promise<number> => {
    let terrain = viewer.terrainProvider;
    let ready = await terrain.readyPromise;
    if (ready) {
        // 地形为空（标准椭球）
        if (!terrain.availability) {
            return 0;
        }
        let updatedPositions = await Cesium.sampleTerrainMostDetailed(
            terrain,
            [Cesium.Cartographic.fromDegrees(lon, lat)]
        );
        return updatedPositions[0]?.height || 0;
    }
    return 0;
};

/**
 * @description: 判断在地球的正面还是反面
 * @param {Cartesian3} position 点位
 * @param {Cartesian3} cameraPosition 相机位置
 * @param {Ellipsoid} ellipsoid (可选)椭球,默认为wgs84
 * @return {boolean}
 */
export const isVisible = (position:Cartesian3, cameraPosition: Cartesian3, ellipsoid: Ellipsoid = Cesium.Ellipsoid.WGS84): boolean => {
    // @ts-ignore
    let cameraOccluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);
    let viewerVisible = cameraOccluder.isPointVisible(position);
    return viewerVisible;
}