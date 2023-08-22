import { Entity } from "cesium";
import { viewerConfig, initViewConfig, cesiumToken } from "./src/config/earthConfig";
import material from "./src/func/index";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);

const lines = [
    new Cesium.Cartesian3(-1705722.7375782044, 5456272.240635795, 2818985.3064158773),
    new Cesium.Cartesian3(-1707465.3050721162, 5455799.126313257, 2818846.9912274643),
    new Cesium.Cartesian3(-1709648.901559206, 5455193.614325796, 2818696.3690761398),
]

let colors = [Cesium.Color.RED, Cesium.Color.AQUA];

const effectLineList = [
    {label:"动态箭头线", name:"polylineArrowMaterial", params: {color: Cesium.Color.AQUA, duration: 800, count: 3}},
    {label:"动态传输线", name:"polylineEnergyTransMaterial", params: {color: Cesium.Color.RED, duration: 2000, count: 3}},
    {label:"发光线", name:"polylineLightingMaterial", params: Cesium.Color.AQUA},
    {label:"动态脉冲线", name:"polylineLinkPulseMaterial", params: {color: Cesium.Color.RED, duration: 5000}},
    {label:"迁徙线", name:"polylineMigrateMaterial", params: {color: new Cesium.Color(1, 0.79, 0.15, 1), duration: 2000}},
    // {label:"热点面板点", name:"hotSpotBoardPoint", params: [{lon: 106.5, lat: 28.5}, creatDiv()]},
    // {label:"LED文本点", name:"ledLabelPoint", params: [{lon: 106, lat: 28}, "led文本点"]},
    // {label:"简单面板点", name:"sampleLabelPoint", params: [{lon: 108.42533733304246, lat: 28.5}, creatDiv()]},
    // {label:"水球点", name:"waterPoloPoint", params: [{lon: 108.42533733304246, lat: 29.5}, 0.56]},
]

let e:Entity|undefined = undefined;

function createLine(m:string, params: any) {
    e && viewer.entities.remove(e)
    e = viewer.entities.add({
        polyline: {
            positions: lines,
            width: 12,
            // @ts-ignore
            material: new material[m](params),
            clampToGround: true
        }
    });
    viewer.flyTo(e);
}

effectLineList.forEach(v=>{
    let btn = document.querySelector(`#${v.name}`) as HTMLElement;
    btn.innerHTML = v.label;
    btn.onclick = ()=>{
        createLine(v.name, v.params)
    }
})
