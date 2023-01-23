import * as Cesium from "cesium";
import { Cartesian3, HeadingPitchRange, Ellipsoid } from "cesium";

export function calculateHPRPosition(
    point: Cartesian3,
    hpr: HeadingPitchRange
) {
    // 局部坐标系到世界坐标系的变换矩阵
    let localToWorldMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
        point,
        new Cesium.HeadingPitchRoll(hpr.heading, hpr.pitch, 0),
        Ellipsoid.WGS84
    );
    let worldMapPoint = Cesium.Matrix4.multiplyByPoint(
        localToWorldMatrix,
        new Cesium.Cartesian3(hpr.range, 0, 0),
        new Cesium.Cartesian3()
    );
    return worldMapPoint
}
