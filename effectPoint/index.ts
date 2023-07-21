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

function creatDiv(){
    let dom = document.createElement("div");
    dom.innerHTML = "测试div";
    return dom;
}

// dom点
const point1 = new effectPoint.domPoint.divPoint(viewer, {lon: 108.42533733304246, lat: 30.722983346052956}, creatDiv());
const point2 = new effectPoint.domPoint.dynamicLabelPoint(viewer, {lon: 108, lat: 30}, "动态文本点");
const point3 = new effectPoint.domPoint.erectLabelPoint(viewer, {lon: 107.5, lat: 29.5}, "竖立文本点");
const point4 = new effectPoint.domPoint.gradientLabelPoint(viewer, {lon: 107, lat: 29}, creatDiv());
const point5 = new effectPoint.domPoint.hotSpotBoardPoint(viewer, {lon: 106.5, lat: 28.5}, creatDiv());
const point6 = new effectPoint.domPoint.ledLabelPoint(viewer, {lon: 106, lat: 28}, "led文本点");
const point7 = new effectPoint.domPoint.sampleLabelPoint(viewer, {lon: 108.42533733304246, lat: 28.5}, creatDiv());


point1.init();
point2.init();
point3.init();
point4.init();
point5.init();
point6.init();
point7.init();

const list = [
    {label:"普通面板点", id:"divPoint", exam: point1},
    {label:"动态文本点", id:"dynamicLabelPoint", exam: point2},
    {label:"竖立文本点", id:"erectLabelPoint", exam: point3},
    {label:"渐变面板点", id:"gradientLabelPoint", exam: point4},
    {label:"热点面板点", id:"hotSpotBoardPoint", exam: point5},
    {label:"LED文本点", id:"ledLabelPoint", exam: point6},
    {label:"简单面板点", id:"sampleLabelPoint", exam: point7},
]

list.forEach(v=>{
    let btn = document.querySelector(`#${v.id}`) as HTMLElement;
    let exam = v.exam;
    exam.init();
    btn.onclick = ()=>{
        exam.setVisible(!exam.getVisible());
    }
})


viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(108, 30, 1000000),
});
