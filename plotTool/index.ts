import * as Cesium from "cesium"
import "cesium/Build/Cesium/Widgets/widgets.css"
import "./src/Style/index.css"
import drawShape from "./src/Func/drawShape";

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
viewer.scene.globe.depthTestAgainstTerrain = true;
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
let draw = new drawShape(viewer);
(document.querySelector("#drawPoint") as HTMLElement).onclick = function(){
    draw.drawPoint();
};
(document.querySelector("#drawPloyline") as HTMLElement).onclick = function(){
    draw.drawPloyline();
};
(document.querySelector("#drawPloygon") as HTMLElement).onclick = function(){
    draw.drawPloygon();
};
(document.querySelector("#drawCircle") as HTMLElement).onclick = function(){
    draw.drawCircle();
};
(document.querySelector("#drawRectangle") as HTMLElement).onclick = function(){
    draw.drawRectangle();
};
(document.querySelector("#revock") as HTMLElement).onclick = function(){
    draw.revoke();
};
(document.querySelector("#removeAll") as HTMLElement).onclick = function(){
    draw.removeAll();
};







