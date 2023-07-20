import * as Cesium from "cesium";
import {
    viewerConfig,
    initViewConfig,
    cesiumToken,
} from "./src/config/earthConfig";
import bookmarkManager from "./src/func/bookmarkManager";
import { createBookmarkDom } from "./src/utils";
import type { BookmarkType } from "./src/type";
// css
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// token
Cesium.Ion.defaultAccessToken = cesiumToken;
// 初始化地球
let viewer = new Cesium.Viewer("MapContainer", viewerConfig);
(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
viewer.camera.setView(initViewConfig);

const b = new bookmarkManager(viewer);

const markName = document.querySelector("#name") as HTMLInputElement;
const addMark = document.querySelector("#add") as HTMLInputElement;
const importMark = document.querySelector("#import") as HTMLInputElement;
const exportMark = document.querySelector("#export") as HTMLInputElement;
const markBody = document.querySelector(".bookmarkerBody") as HTMLInputElement;

const width = markBody.clientWidth;
const height = width * 0.56;

function addMarkDom(bookmark: BookmarkType) {
    const dom = createBookmarkDom(viewer, bookmark);
    markBody.appendChild(dom);
}

addMark.onclick = async () => {
    const name = markName.value;

    const bookmark = await b.createBookmark(name, height, width);
    b.add(bookmark);

    addMarkDom(bookmark);
};

importMark.onclick = () => {
    b.loadMark((v: BookmarkType, i: number, status: boolean)=>{
        status && addMarkDom(v);
    });
};

exportMark.onclick = () => {
    b.saveMark("markJson");
};
