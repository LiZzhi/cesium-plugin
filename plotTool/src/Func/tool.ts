import * as Cesium from "cesium";
import * as turf from "turf"
import { Viewer, Cartesian3, Ellipsoid, HeadingPitchRoll, Matrix3, Matrix4 } from "cesium";

/**
 * 【笛卡尔坐标对象】数组 转 【经纬度】数组
 * @param { Cartesian3 } p 笛卡尔坐标
 * @param { Ellipsoid } e (可选)坐标系，默认为WGS_84
 * @returns { number[] } [lon, lat, alt]
 */
export function formCartesian3(
    p: Cartesian3,
    e: Ellipsoid = Cesium.Ellipsoid.WGS84
): number[] {
    let ellipsoid = e;
    let cartesian3 = new Cesium.Cartesian3(p.x, p.y, p.z);
    let cartographic = ellipsoid.cartesianToCartographic(cartesian3);
    let lon = Cesium.Math.toDegrees(cartographic.longitude);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let alt = cartographic.height;

    return [lon, lat, alt];
}

/**
 * 【笛卡尔坐标对象】数组 转 【经纬度】数组
 * @param { Cartesian3 } p 笛卡尔坐标
 * @param { Ellipsoid } e (可选)坐标系，默认为WGS_84)
 * @returns { number[][] }
 *  [
 *      [lon, lat, alt],
 *      [lon, lat, alt],
 *      ...,
 *      [lon, lat, alt]
 *  ]
 */
export function formCartesian3S(
    p: Cartesian3[],
    e: Ellipsoid = Cesium.Ellipsoid.WGS84
): number[][] {
    let arr = [];
    for (let i = 0; i < p.length; i++) {
        let ps = p[i];
        arr.push(formCartesian3(ps));
    }
    return arr;
}

/**
 * 绘制矩形，依次输入A,B,C三点(目前有点问题，还需要修复)
 * 以B为原点，重新建立局部坐标系，计算C在AB法线的投影终点C1和第四点D，构成矩形
 * @param { Cartesian3[] } param0 A,B,C三点
 * @param { Ellipsoid } e {可选}，世界坐标系，默认为WGS_84
 * @returns 
 */
export function calculateRectangle2(
    [pointA, pointB, pointC]: Cartesian3[],
    e: Ellipsoid = Ellipsoid.WGS84
): any[] {
    // pointA.z, pointB.z, pointC.z = 0

    // 局部坐标系到世界坐标系的变换矩阵
    let localToWorldMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        pointB, e
    );
    // 世界坐标系到局部坐标系的变换矩阵
    let worldToLocalMatrix = Cesium.Matrix4.inverse(
        localToWorldMatrix,
        new Cesium.Matrix4()
    );

    // pointA,pointC 转局部坐标
    let localPosA = Cesium.Matrix4.multiplyByPoint(
        worldToLocalMatrix,
        pointA,
        new Cesium.Cartesian3()
    );    
    let localPosC = Cesium.Matrix4.multiplyByPoint(
        worldToLocalMatrix,
        pointC,
        new Cesium.Cartesian3()
    );
    // let localPosC1 = new Cesium.Cartesian3(0 , localPosC.y)
    // let localPosD = new Cesium.Cartesian3(localPosA.x, localPosC.y)

    // C 点和 A 点相对 B 点和坐标轴的夹角，代表 ∠ABX 轴和 ∠CBX 轴
    let angleABX = Math.atan2(localPosA.y, localPosA.x);
    let angleCBX = Math.atan2(localPosC.y, localPosC.x);

    // ∠CBC1,C1 是 C 在 AB 法线方向的投影
    // let angleCBC1 = pi + angleABX - angleCBX;
    // BC 的距离
    let distanceBC = Math.sqrt(Math.pow(localPosC.x, 2) + Math.pow(localPosC.y, 2));
    // XC1 和 YC1
    let localXC1 = -distanceBC * Math.sin(angleABX)
    let localYC1 = distanceBC * Math.cos(angleABX)
    // XD 和 YD
    let localXD = localPosA.x + localXC1
    let localYD = localPosA.y + localYC1
    // C1,D 世界坐标
    let worldPointC1 = Cesium.Matrix4.multiplyByPoint(
        localToWorldMatrix, 
        new Cesium.Cartesian3(localXC1, localYC1), 
        new Cesium.Cartesian3()
    );
    let worldPointD = Cesium.Matrix4.multiplyByPoint(
        localToWorldMatrix, 
        new Cesium.Cartesian3(localXD, localYD), 
        new Cesium.Cartesian3()
    );
    return [[ pointA, pointB, worldPointC1, worldPointD ], localToWorldMatrix];
}
/**
 * 绘制矩形，依次输入A,B,C三点
 * 以A为原点，重新建立局部坐标系，计算C在AB法线的投影终点C1和第四点D，构成矩形
 * @param { Cartesian3[] } param0 A,B,C三点
 * @param { Ellipsoid } e {可选}，世界坐标系，默认为WGS_84
 * @returns 
 */
export function calculateRectangle( 
    [pointA, pointB, pointC]: Cartesian3[],
    e: Ellipsoid = Ellipsoid.WGS84
): Cartesian3[] {
    // 局部坐标系到世界坐标系的变换矩阵
    // let heading = Math.atan2(pointB.x-pointA.x, pointB.y-pointA.y)
    let heading = getHeading(pointA, pointB)
    let pitch = getPitch(pointA, pointB)

    let hpr = new Cesium.HeadingPitchRoll(heading, pitch, 0)
    let localToWorldMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
        pointA, hpr, e
    )
    
    // 世界坐标系到局部坐标系的变换矩阵
    let worldToLocalMatrix = Cesium.Matrix4.inverse(
        localToWorldMatrix,
        new Cesium.Matrix4()
    );

    // pointB,pointC 转局部坐标
    let localPosB = Cesium.Matrix4.multiplyByPoint(
        worldToLocalMatrix,
        pointB,
        new Cesium.Cartesian3()
    );    

    let localPosC = Cesium.Matrix4.multiplyByPoint(
        worldToLocalMatrix,
        pointC,
        new Cesium.Cartesian3()
    );
    let localPosC1 = new Cesium.Cartesian3(localPosC.x , localPosB.y)
    let localPosD = new Cesium.Cartesian3(localPosC.x, 0)

    // C1,D 世界坐标
    let worldPointC1 = Cesium.Matrix4.multiplyByPoint(
        localToWorldMatrix, 
        localPosC1, 
        new Cesium.Cartesian3()
    );
    let worldPointD = Cesium.Matrix4.multiplyByPoint(
        localToWorldMatrix, 
        localPosD, 
        new Cesium.Cartesian3()
    );
    return [ pointA, pointB, worldPointC1, worldPointD ];
}

/**
 * 计算两点 Heading
 * @param { Cartesian3 } pointA 
 * @param { Cartesian3 } pointB 
 * @returns number
 */
export function getHeading(pointA: Cartesian3, pointB: Cartesian3): number{
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

/**
 * 计算两点 Pitch
 * @param { Cartesian3 } pointA 
 * @param { Cartesian3 } pointB 
 * @returns number
 */
export function getPitch(pointA: Cartesian3, pointB: Cartesian3): number {
    let transfrom = Cesium.Transforms.eastNorthUpToFixedFrame(pointA);
    let vector = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
    let direction = Cesium.Matrix4.multiplyByPointAsVector(Cesium.Matrix4.inverse(transfrom, transfrom), vector, vector);
    Cesium.Cartesian3.normalize(direction, direction);

    return Cesium.Math.PI_OVER_TWO - Cesium.Math.acosClamped(direction.z);
}

/**
 * 绘制一个小坐标轴,可绘制局部坐标系,X 轴为红色,Y 轴为蓝色,Z 轴为绿色
 * @param { Viewer } viewer 
 * @param { Cartesian3 } center 原点,请和传入 matrix4 保持一致,若未设置 matrix4 参数,则为当前世界坐标系
 * @param { number } height (可选),坐标轴长度和离地高
 * @param { Matrix4 } matrix4 (可选)局部转世界的矩阵,通常为建立局部坐标系时得到的矩阵的逆矩阵
 */
export function drawCoordinateAxis(viewer:Viewer, center:Cartesian3, height?:number, matrix4?:Matrix4){
    let h = height||100
    let o = matrix4? Cesium.Matrix4.multiplyByPoint(
        matrix4, 
        new Cesium.Cartesian3(center.x||0, center.y||0, center.z||0), 
        new Cesium.Cartesian3()
    ):center
    let x = matrix4?Cesium.Matrix4.multiplyByPoint(
        matrix4, 
        new Cesium.Cartesian3(center.x+h, center.y, center.z), 
        new Cesium.Cartesian3()
    ):new Cesium.Cartesian3(center.x+h, center.y, center.z)
    let y = matrix4?Cesium.Matrix4.multiplyByPoint(
        matrix4, 
        new Cesium.Cartesian3(center.x, center.y+h, center.z), 
        new Cesium.Cartesian3()
    ):new Cesium.Cartesian3(center.x, center.y+h, center.z)
    let z = matrix4?Cesium.Matrix4.multiplyByPoint(
        matrix4, 
        new Cesium.Cartesian3(center.x, center.y, center.z+h), 
        new Cesium.Cartesian3()
    ):new Cesium.Cartesian3(center.x, center.y, center.z+h)
    viewer.entities.add({
        polyline: {
            positions: [o, x],
            width: 5,
            material: Cesium.Color.RED,
            arcType: Cesium.ArcType.RHUMB
        }
    })
    viewer.entities.add({
        polyline: {
            positions: [o, y],
            width: 5,
            material: Cesium.Color.BLUE,
            arcType: Cesium.ArcType.RHUMB
        }
    })
    viewer.entities.add({
        polyline: {
            positions: [o, z],
            width: 5,
            material: Cesium.Color.GREEN,
            arcType: Cesium.ArcType.RHUMB
        }
    })
}