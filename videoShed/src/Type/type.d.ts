import { Cartesian3 } from "cesium";

export type cameraOrientationVector = {
    upVector: Cartesian3;
    directionVector: Cartesian3;
    rightVector: Cartesian3;
};

export type videoShedOptions = {
    cameraPosition: Cartesian3;
    near?: number; // 近平面的距离
    far?: number; // 远平面的距离
    fov?: number; // 张角
    alpha?: number; // 透明度
    rotation?: rotation; // 旋转参数
    aspectRatio?: number; // 视锥的宽度与高度的纵横比
    debugFrustum?: boolean; // 是否显示投影线
};

type rotation = {
    heading: number;
    pitch: number;
    roll: number;
};
