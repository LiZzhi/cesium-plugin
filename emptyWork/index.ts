import * as Cesium from "cesium";
import { viewerConfig, initViewConfig } from "./src/config/earthConfig";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// token
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTNiYjkwZi1iMzRlLTRjZWQtYWQxMy00MDVmMjk4YTc0YmMiLCJpZCI6MzY3MDksImlhdCI6MTY1NTE3OTc1N30.fv4nNIkCEEy3VqlaekWVcE1btEcge5_zCl_36AtusT0";
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);
