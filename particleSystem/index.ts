import * as Cesium from "cesium";
import { viewerConfig, initViewConfig, cesiumToken } from "./src/config/earthConfig";
import particleSystem from "./src/func";
import { getTerrainMostDetailedHeight } from "./src/utils/tool";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// token
Cesium.Ion.defaultAccessToken = cesiumToken;
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
// 开启深度监测
viewer.scene.globe.depthTestAgainstTerrain = true;
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);

// @ts-ignore
window.viewer = viewer;
// @ts-ignore
window.Cesium = Cesium;

getTerrainMostDetailedHeight(viewer, 108.42533733304246, 30.722983346052956).then(height => {
    const fire = new particleSystem.fireParticle(viewer, Cesium.Cartesian3.fromDegrees(108.42533733304246, 30.722983346052956, height))
    fire.init()
})

getTerrainMostDetailedHeight(viewer, 108.42583733304246, 30.723483346052956).then(height => {
    const fountain = new particleSystem.fountainParticle(viewer, Cesium.Cartesian3.fromDegrees(108.42583733304246, 30.723483346052956, height))
    fountain.init()
})

getTerrainMostDetailedHeight(viewer, 108.42633733304246, 30.723983346052956).then(height => {
    const smoke = new particleSystem.smokeParticle(viewer, Cesium.Cartesian3.fromDegrees(108.42633733304246, 30.723983346052956, height), {
        heading: 240,
        pitch: 30
    })
    smoke.init()
})


viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(108.42583733304246, 30.723483346052956, 500),
});
