import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./src/Style/index.css";
import effectPoint from "./src/Func";

// token
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTNiYjkwZi1iMzRlLTRjZWQtYWQxMy00MDVmMjk4YTc0YmMiLCJpZCI6MzY3MDksImlhdCI6MTY1NTE3OTc1N30.fv4nNIkCEEy3VqlaekWVcE1btEcge5_zCl_36AtusT0";
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", {
    terrainProvider: Cesium.createWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true,
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
    orderIndependentTranslucency: false, // 如果为 true 并且配置支持它，请使用与顺序无关的半透明。
    shadows: false, // true时，地表透明会引起变暗，并闪烁??
    shouldAnimate: true,
    contextOptions: {
        webgl: {
            alpha: true,
            preserveDrawingBuffer: true, // 通过canvas.toDataURL()实现截图需要将该项设置为true
        },
    },
});
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView({
    destination: new Cesium.Cartesian3(
        -3897089.9133552085,
        13786107.541338965,
        8627482.948922165
    ),
    orientation: {
        heading: 6.283185307179586,
        pitch: -1.5707963267948966,
        roll: 0,
    },
});

let dom1 = document.createElement("div");
dom1.innerHTML = "测试div";

const point1 = new effectPoint.domPoint.divPoint(
    viewer,
    {
        lon: 108.42533733304246,
        lat: 30.722983346052956,
    },
    dom1
);

point1.init()

const point2 = new effectPoint.domPoint.dynamicLabelPoint(
    viewer,
    {
        lon: 108,
        lat: 30,
    },
    "动态文本点"
);

point2.init()

const point3 = new effectPoint.domPoint.erectLabelPoint(
    viewer,
    {
        lon: 107.5,
        lat: 29.5,
    },
    "竖立文本点",
);

point3.init()

let dom4 = document.createElement("div");
dom4.innerHTML = "测试div";

const point4 = new effectPoint.domPoint.gradientLabelPoint(
    viewer,
    {
        lon: 107,
        lat: 29,
    },
    dom4
);

point4.init()

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(108, 30, 1000000)
})
