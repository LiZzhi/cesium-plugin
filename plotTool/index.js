// 初始化地球
let viewer = new Cesium.Viewer('MapContainer', {
    animation: false,
    homeButton: false,
    geocoder: false,
    baseLayerPicker: false,
    timeline: false,
    fullscreenButton: false,
    scene3DOnly: true,
    infoBox: true,
    sceneModePicker: false,
    navigationInstructionsInitiallyVisible: false,
    navigationHelpButton: false,
    selectionIndicator: false,
    // vrButton: true, // VR 按钮，这个功能需要屏幕【硬件】支持
    orderIndependentTranslucency: false,
    shadows: false,
    shouldAnimate: true,
    contextOptions: {
        webgl: {
            requestWebgl2: true,
            alpha: true,
            preserveDrawingBuffer: true // 通过canvas.toDataURL()实现截图需要将该项设置为true
        }
    }
});
export {};
