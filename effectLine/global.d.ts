import * as C from "cesium";

declare global{
    const Cesium: typeof C;
    interface Window{
        Cesium: typeof C
    }
}
