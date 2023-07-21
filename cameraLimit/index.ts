import * as Cesium from "cesium";
import { viewerConfig, initViewConfig, cesiumToken } from "./src/config/earthConfig";
import cameraLimit from "./src/func/cameraLimit";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// token
Cesium.Ion.defaultAccessToken = cesiumToken;
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);
// 开启深度监测
viewer.scene.globe.depthTestAgainstTerrain = true;

let c = new cameraLimit(
    viewer,
    {
        position: Cesium.Cartesian3.fromDegrees(
            118.42533733304246,
            40.722983346052956,
            10000
        ),
        radius: 100000,
        debugExtent: true,
    },
    1
);

c.setLimit()
