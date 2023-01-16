import * as Cesium from "cesium"
import { Cartesian3, Cartographic } from "cesium"

export function getHeading(pointA:Cartesian3, pointB:Cartesian3){
    //建立以点A为原点，X轴为east,Y轴为north,Z轴朝上的坐标系
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(pointA);
    //向量AB
    const positionvector = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
    //因transform是将A为原点的eastNorthUp坐标系中的点转换到世界坐标系的矩阵
    //AB为世界坐标中的向量
    //因此将AB向量转换为A原点坐标系中的向量，需乘以transform的逆矩阵。
    const vector = Cesium.Matrix4.multiplyByPointAsVector(Cesium.Matrix4.inverse(transform, new Cesium.Matrix4()), positionvector, new Cesium.Cartesian3());
    //归一化
    const direction = Cesium.Cartesian3.normalize(vector, new Cesium.Cartesian3());
    //heading
    const heading = Math.atan2(direction.y, direction.x) - Cesium.Math.PI_OVER_TWO;
    return Cesium.Math.TWO_PI - Cesium.Math.zeroToTwoPi(heading);
}

export function fromDegreesToCartesian3Arr(arr: Cartographic[]):Cartesian3[]{
    let arrC3:Cartesian3[] = []
    arr.forEach(v=>{
        let c = Cesium.Cartesian3.fromDegrees(v.longitude, v.latitude, v.height);
        arrC3.push(c)
    })
    return arrC3
}