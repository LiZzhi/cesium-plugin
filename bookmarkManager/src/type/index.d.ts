import { Cartesian3, HeadingPitchRoll } from "cesium";

type CameraViewType = {
    // 位置
    destination: Cartesian3;
    // 方向
    orientation: HeadingPitchRoll;
};

export type BookmarkType = {
    id: number;
    img: string;
    name: string;
    cameraView: CameraViewType;
    description?: any;
};
