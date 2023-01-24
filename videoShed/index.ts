import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./src/Style/index.css";
import videoShed from "./src/Func/videoShed";
import { drawCoordinateAxis } from "./src/Func/tool";

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

let $video = document.querySelector("#video") as HTMLVideoElement;
$video.src = "public/lukou.mp4";

let v = new videoShed(viewer, $video, {
    cameraPosition: new Cesium.Cartesian3(
        -2895368.4019486615,
        4717774.458765802,
        3158081.7786266357
    ),
    near: 0.1,
    far: 240,
    fov: 12,
    //旋转参数
    rotation: {
        heading: -145,
        pitch: -45,
        roll: 160
    },
    aspectRatio: 1,
    alpha: 1,
    debugFrustum: true,
});

let $form = document.querySelector("form") as HTMLElement;
let $create = document.querySelector("#create") as HTMLElement;
let $destroy = document.querySelector("#destroy") as HTMLElement;
let $rotationX = document.querySelector("#rotationX") as HTMLElement;
let $rotationXShow = $rotationX.nextElementSibling as HTMLElement;
let $rotationY = document.querySelector("#rotationY") as HTMLElement;
let $rotationYShow = $rotationY.nextElementSibling as HTMLElement;
let $rotationZ = document.querySelector("#rotationZ") as HTMLElement;
let $rotationZShow = $rotationZ.nextElementSibling as HTMLElement;
let $fov = document.querySelector("#fov") as HTMLElement;
let $fovShow = $fov.nextElementSibling as HTMLElement;
let $frustum = document.querySelector("#frustum") as HTMLElement;

$create.onclick = function () {
    v.init();
    let styleOptions = v.styleOptions;
    let heading = styleOptions.rotation!.heading + "";
    let pitch = styleOptions.rotation!.pitch + "";
    let roll = styleOptions.rotation!.roll + "";
    let fov = styleOptions.fov + "";
    $rotationX.setAttribute("value", pitch);
    $rotationXShow.innerHTML = pitch;
    $rotationY.setAttribute("value", heading);
    $rotationYShow.innerHTML = heading;
    $rotationZ.setAttribute("value", roll);
    $rotationZShow.innerHTML = roll;
    $fov.setAttribute("value", fov);
    $fovShow.innerHTML = fov + "";
    $form.style.display = "flex";
};

$destroy.onclick = function () {
    v.destroy();
    $form.style.display = "none";
};

$rotationX.onchange = function (e) {
    // @ts-ignore
    let pitch: number = e.target.valueAsNumber;
    let newR = {
        heading: v.styleOptions.rotation!.heading,
        pitch: pitch,
        roll: v.styleOptions.rotation!.roll,
    };
    $rotationXShow.innerHTML = pitch + "";
    v.updateStyle({
        rotation: newR,
    });
};

$rotationY.onchange = function (e) {
    // @ts-ignore
    let heading: number = e.target.valueAsNumber;
    let newR = {
        heading: heading,
        pitch: v.styleOptions.rotation!.pitch,
        roll: v.styleOptions.rotation!.roll,
    };
    $rotationYShow.innerHTML = heading + "";
    v.updateStyle({
        rotation: newR,
    });
};

$rotationZ.onchange = function (e) {
    // @ts-ignore
    let roll: number = e.target.valueAsNumber;
    let newR = {
        heading: v.styleOptions.rotation!.heading,
        pitch: v.styleOptions.rotation!.pitch,
        roll: roll,
    };
    $rotationZShow.innerHTML = roll + "";
    v.updateStyle({
        rotation: newR,
    });
};

$fov.onchange = function (e) {
    // @ts-ignore
    let fov: number = e.target.valueAsNumber;
    $fovShow.innerHTML = fov + "";
    v.updateStyle({
        fov,
    });
};

$frustum.onclick = function (e) {
    // @ts-ignore
    let checked: boolean = e.target.checked;
    v.updateStyle({
        debugFrustum: checked,
    });
};

viewer.camera.setView({
    destination: new Cesium.Cartesian3(
        -2895429.8939341973,
        4717770.941850088,
        3158085.71284576
    ),
    orientation: {
        heading: 4.917487317285504,
        pitch: -0.6280151824043467,
        roll: 0.0000033167192423633196,
    },
});
