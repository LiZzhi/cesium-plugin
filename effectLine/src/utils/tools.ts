import * as Cesium from "cesium";

export const equals = function (left:any, right:any) {
    return left === right || (Cesium.defined(left) && left.equals(right));
};