import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./src/Style/index.css";
import layerSplit from "./src/Func/layerSplit"

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

viewer.imageryLayers.removeAll()

// 创建左侧窗口
let splitLayerL = Cesium.createWorldImagery({
    style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
})
let left = new layerSplit(viewer, splitLayerL, Cesium.SplitDirection.LEFT)

// 创建右侧窗口
let splitLayerR = new Cesium.UrlTemplateImageryProvider({
    url: 'http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', // 3857 的切片方案
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    // fileExtension: 'png'
});
let right = new layerSplit(viewer, splitLayerR, Cesium.SplitDirection.RIGHT)

// 将影像添加至左侧窗口
let singleLayerL = viewer.imageryLayers.addImageryProvider(
    new Cesium.SingleTileImageryProvider({
        url: 'public/2006FVCmax.jpg', rectangle: Cesium.Rectangle.fromDegrees(95.20, 30, 115, 40)
    })
)
left.changeLayer(singleLayerL)
