import * as Cesium from "cesium";
import {
    Cartesian3,
    HeadingPitchRoll,
    Ellipsoid,
    Viewer,
    Matrix4,
} from "cesium";

export function calculateHPRPosition(
    point: Cartesian3,
    hpr: HeadingPitchRoll,
    distance: number
) {
    // 局部坐标系到世界坐标系的变换矩阵
    let localToWorldMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
        point,
        hpr,
        Ellipsoid.WGS84
    );

    // 计算局部坐标系中坐标轴在世界坐标系中的标准化向量
    let localUp = new Cesium.Cartesian3(0, 0, 1);
    let localDirection = new Cesium.Cartesian3(1, 0, 0);
    let localRight = new Cesium.Cartesian3(0, 1, 0);

    let worldUp = coordinateTransform(localToWorldMatrix, localUp);
    let worldDirection = coordinateTransform(
        localToWorldMatrix,
        localDirection
    );
    let worldRight = coordinateTransform(localToWorldMatrix, localRight);

    let upVector = Cesium.Cartesian3.subtract(
        point,
        worldUp,
        new Cesium.Cartesian3()
    );
    let directionVector = Cesium.Cartesian3.subtract(
        point,
        worldDirection,
        new Cesium.Cartesian3()
    );
    let rightVector = Cesium.Cartesian3.subtract(
        point,
        worldRight,
        new Cesium.Cartesian3()
    );

    // 距离相机 distance 距离处的点的世界坐标
    let worldMapPoint = coordinateTransform(
        localToWorldMatrix,
        new Cesium.Cartesian3(distance, 0, 0)
    );
    return {
        worldMapPoint,
        upVector,
        directionVector,
        rightVector,
    };
}

/**
 * 绘制一个小坐标轴,可绘制局部坐标系,X 轴为红色,Y 轴为蓝色,Z 轴为绿色
 * 没有封装成类，所以要删除 Entity 得改方法,建议仅用来测试使用
 * @param { Viewer } viewer
 * @param { Cartesian3 } center 原点,请和传入 matrix4 保持一致,若未设置 matrix4 参数,则为当前世界坐标系
 * @param { number } height (可选),坐标轴长度和离地高
 * @param { Matrix4 } matrix4 (可选)局部转世界的矩阵,通常为建立局部坐标系时得到的矩阵的逆矩阵
 */
export function drawCoordinateAxis(
    viewer: Viewer,
    center: Cartesian3,
    height?: number,
    matrix4?: Matrix4
) {
    let h = height || 100;
    let o = matrix4
        ? coordinateTransform(
              matrix4,
              new Cesium.Cartesian3(center.x || 0, center.y || 0, center.z || 0)
          )
        : center;
    let x = matrix4
        ? coordinateTransform(
              matrix4,
              new Cesium.Cartesian3(center.x + h, center.y, center.z)
          )
        : new Cesium.Cartesian3(center.x + h, center.y, center.z);
    let y = matrix4
        ? coordinateTransform(
              matrix4,
              new Cesium.Cartesian3(center.x, center.y + h, center.z)
          )
        : new Cesium.Cartesian3(center.x, center.y + h, center.z);
    let z = matrix4
        ? coordinateTransform(
              matrix4,
              new Cesium.Cartesian3(center.x, center.y, center.z + h)
          )
        : new Cesium.Cartesian3(center.x, center.y, center.z + h);
    viewer.entities.add({
        polyline: {
            positions: [o, x],
            width: 5,
            material: Cesium.Color.RED,
            arcType: Cesium.ArcType.RHUMB,
        },
    });
    viewer.entities.add({
        polyline: {
            positions: [o, y],
            width: 5,
            material: Cesium.Color.BLUE,
            arcType: Cesium.ArcType.RHUMB,
        },
    });
    viewer.entities.add({
        polyline: {
            positions: [o, z],
            width: 5,
            material: Cesium.Color.GREEN,
            arcType: Cesium.ArcType.RHUMB,
        },
    });
}

/**
 * 坐标转换
 * @param { Matrix4 } m 转换矩阵
 * @param { Cartesian3 } point 坐标
 * @returns
 */
function coordinateTransform(m: Matrix4, point: Cartesian3) {
    return Cesium.Matrix4.multiplyByPoint(m, point, new Cesium.Cartesian3());
}
