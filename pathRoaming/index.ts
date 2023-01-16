import * as Cesium from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"
import "./src/Style/index.css"
import pathRoaming from "./src/Func/pathRoaming"
import { fromDegreesToCartesian3Arr } from "./src/Func/tool"

// token
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTNiYjkwZi1iMzRlLTRjZWQtYWQxMy00MDVmMjk4YTc0YmMiLCJpZCI6MzY3MDksImlhdCI6MTY1NTE3OTc1N30.fv4nNIkCEEy3VqlaekWVcE1btEcge5_zCl_36AtusT0"
// 初始化地球
let viewer = new Cesium.Viewer('MapContainer', {
    terrainProvider: Cesium.createWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true
    }),
    animation: false, // 是否显示动画控件
    homeButton: false, // 是否显示home键
    geocoder: false, // 是否显示地名查找控件        如果设置为true，则无法查询
    baseLayerPicker: false, // 是否显示图层选择控件
    timeline: false, // 是否显示时间线控件
    fullscreenButton: false, // 是否全屏显示
    scene3DOnly: true, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    infoBox: true, // 是否显示点击要素之后显示的信息
    sceneModePicker: false, // 是否显示投影方式控件  三维/二维
    navigationInstructionsInitiallyVisible: false,
    navigationHelpButton: false, // 是否显示帮助信息控件
    selectionIndicator: false, // 是否显示指示器组件
    orderIndependentTranslucency: false,    // 如果为 true 并且配置支持它，请使用与顺序无关的半透明。
    shadows: false, // true时，地表透明会引起变暗，并闪烁??
    shouldAnimate: true,
    contextOptions: {
        webgl: {
            alpha: true,
            preserveDrawingBuffer: true // 通过canvas.toDataURL()实现截图需要将该项设置为true
        }
    }
});
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";

let ps = [
    new Cesium.Cartographic(119.44037341293323, 35.34197106899855, 5.872732096309598),
    new Cesium.Cartographic(119.44252948098223, 35.34223901339689, 6.31711015359973),
    new Cesium.Cartographic(119.4560550425358, 35.34202148007459, 22.906707659456394),
    new Cesium.Cartographic(119.45610614546445, 35.32762691608659, 3.0852594116911622)
];

viewer.entities.add({
    polyline: {
        positions: fromDegreesToCartesian3Arr(ps),
        width: 4,
        clampToGround: true,
        arcType: Cesium.ArcType.RHUMB,
    }
})

let speed = 1
let roam = pathRoaming.getInstance(viewer);

(document.querySelector("#start1") as HTMLElement).onclick = () => {
    roam.startRoaming(ps, 1);
};
(document.querySelector("#start2") as HTMLElement).onclick = () => {
    roam.startRoaming(ps, 2);
};
(document.querySelector("#stop") as HTMLElement).onclick = () => {
    roam.stopRoaming();
};
(document.querySelector("#add") as HTMLElement).onclick = () => {
    speed++
    roam.runSpeed = speed;
};
(document.querySelector("#reduce") as HTMLElement).onclick = () => {
    if (speed > 1) {
        speed--
    }
    roam.runSpeed = speed;
};
(document.querySelector("#destroy") as HTMLElement).onclick = () => {
    roam.destroy();
};
