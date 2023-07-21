import { Cartesian3, HeadingPitchRoll } from "cesium"

export type CameraLimitOptionType = {
    position: Cartesian3,   // 限制中心点
    radius: number, // 限制半径
    debugExtent: boolean    // 是否显示限制范围
}

export type CameraRollbackViewType = {
    destination?: Cartesian3,    // 初始位置
    orientation?: HeadingPitchRoll,  // 初始方向
    duration?: number   // 回滚动画事件
}