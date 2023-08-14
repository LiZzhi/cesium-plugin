import { Cartesian2, Cartesian3, HeightReference, HorizontalOrigin, VerticalOrigin } from "cesium";

// 经纬度坐标
export type worldDegreesType = {
    lon: number;
    lat: number;
    height?: number;
}

export type domRenderType = {
    directionX?: "left" | "center" | "right";
    directionY?: "bottom" | "middle" | "top";
    maxHeight?: number;
    callback?: () => any
}
