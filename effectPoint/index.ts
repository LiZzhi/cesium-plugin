import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";
import effectPoint from "./src/Func";
import {
    viewerConfig,
    initViewConfig,
    cesiumToken,
} from "./src/config/earthConfig";

// token
Cesium.Ion.defaultAccessToken = cesiumToken;
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);

// @ts-ignore
window.viewer = viewer;

function creatDiv(){
    let dom = document.createElement("div");
    dom.innerHTML = "测试div";
    return dom;
}

// dom点
const domPointList = [
    {label:"普通面板点", name:"divPoint", params: [{lon: 108.42533733304246, lat: 30.722983346052956}, creatDiv()]},
    {label:"动态文本点", name:"dynamicLabelPoint", params: [{lon: 108, lat: 30}, "动态文本点"]},
    {label:"竖立文本点", name:"erectLabelPoint", params: [{lon: 107.5, lat: 29.5}, "竖立文本点"]},
    {label:"渐变面板点", name:"gradientLabelPoint", params: [{lon: 107, lat: 29}, creatDiv()]},
    {label:"热点面板点", name:"hotSpotBoardPoint", params: [{lon: 106.5, lat: 28.5}, creatDiv()]},
    {label:"LED文本点", name:"ledLabelPoint", params: [{lon: 106, lat: 28}, "led文本点"]},
    {label:"简单面板点", name:"sampleLabelPoint", params: [{lon: 108.42533733304246, lat: 28.5}, creatDiv()]},
    {label:"水球点", name:"waterPoloPoint", params: [{lon: 108.42533733304246, lat: 29.5}, 0.56]},
]

domPointList.forEach(v=>{
    // @ts-ignore
    const point = new effectPoint.domPoint[v.name](viewer, ...v.params);
    point.init()
    let btn = document.querySelector(`#${v.name}`) as HTMLElement;
    btn.innerHTML = v.label;
    btn.onclick = ()=>{
        point.setVisible(!point.getVisible());
    }
})

// 特效点
const effectPointList = [
    {label:"闪烁点", name:"flickerPoint", params: [{lon: 107, lat: 28.5}]},
    {label:"浮动点", name:"floatPoint", params: [{lon: 108, lat: 28}]},
]

effectPointList.forEach(v=>{
    // @ts-ignore
    const point = new effectPoint.effectPoint[v.name](viewer, ...v.params);
    point.init()
    let btn = document.querySelector(`#${v.name}`) as HTMLElement;
    btn.innerHTML = v.label;
    btn.onclick = ()=>{
        point.setVisible(!point.getVisible());
    }
})

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(108, 30, 1000000)
});
