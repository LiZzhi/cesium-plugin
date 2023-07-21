import * as Cesium from "cesium";
import { viewerConfig, initViewConfig, cesiumToken } from "./src/config/earthConfig";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// token
Cesium.Ion.defaultAccessToken = cesiumToken;
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);
