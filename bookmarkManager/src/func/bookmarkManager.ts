import * as Cesium from "cesium";
import { Viewer } from "cesium";
import { saveShareContent, inputVectorData } from "../utils";
import type { BookmarkType } from "../type";

export default class bookmarkManager {
    #viewer: Viewer;
    #bookmarkList: BookmarkType[];
    /**
     * @description: 相机书签管理功能
     * @param {Viewer} viewer viewer
     * @param {BookmarkType[]} bookmarkList (可选)带传入的书签数组，默认为空数组
     */
    constructor(viewer: Viewer, bookmarkList: BookmarkType[] = []) {
        this.#viewer = viewer;
        this.#bookmarkList = bookmarkList;
    }

    /**
     * @description: 添加书签,返回是否添加成功
     * @param {BookmarkType} bookmark 书签
     * @return {boolean} 是否添加成功
     */
    add(bookmark: BookmarkType): boolean {
        if (!this.#bookmarkList.find((v) => bookmark.id === v.id)) {
            this.#bookmarkList.push(bookmark);
            return true;
        } else {
            return false;
        }
    }

    /**
     * 从书签列表中移除指定id的书签
     * @param {number} id 指定书签的id
     * @return {BookmarkType} 返回删除的书签或undefined
     */
    remove(id: number) {
        let index = this.#bookmarkList.findIndex((v) => v.id === id);
        if (index >= 0) {
            let del = this.#bookmarkList.splice(index, 1);
            return del && del[0];
        }
    }

    /**
     * 获取书签列表
     * @returns {BookmarkType[]} 当前书签列表
     */
    getBookmarkList() {
        return this.#bookmarkList;
    }

    /**
     * 获取指定书签
     * @param {number} id 书签id
     * @returns {BookmarkType} 指定id的书签
     */
    getBookmarkById(id: number) {
        return this.#bookmarkList.find((v) => v.id === id);
    }

    /**
     * 创建书签
     * @param {string} name 书签名称
     * @param {number} height 场景截图canvas高度
     * @param {number} width 场景截图canvas宽度
     * @returns {BookmarkType} 返回一个新的相机书签
     */
    createBookmark(
        name: string,
        height: number,
        width: number
    ): Promise<BookmarkType> {
        let scene = this.#viewer.scene;
        return new Promise((resolve, reject) => {
            this.#getSceneImage(height, width).then((res) => {
                resolve({
                    id: new Date().getTime(),
                    img: res,
                    name: name,
                    cameraView: {
                        destination: new Cesium.Cartesian3(
                            scene.camera.position.x,
                            scene.camera.position.y,
                            scene.camera.position.z
                        ),
                        orientation: new Cesium.HeadingPitchRoll(
                            scene.camera.heading,
                            scene.camera.pitch,
                            scene.camera.roll
                        ),
                    },
                });
            });
        });
    }

    /**
     * 存储json格式的视角书签
     * @param {string} filsName 保存的文件名
     * @param {BookmarkType[]} markList (可选)要保存的书签列表，默认全部保存
     * @returns {MarkJsonType} 待存储的书签json
     */
    saveMark(filsName: string, markList: BookmarkType[] = this.#bookmarkList) {
        saveShareContent(JSON.stringify(markList), `${filsName}.json`);
    }

    /**
     * 读取MarkJsonType格式加入书签列表中
     * @param {CallBackType} callback (可选)第一个参数为MarkJsonType类型的书签, 第二个参数为该书签在读取列表中的存储索引
     * @returns {*}
     */
    loadMark(callback?: any){
        let that = this;
        inputVectorData({
            errFunc: (msg: string) => {
                console.log(msg);
            },
            endFunc: (res: any) => {
                res.jsonContext.forEach((e: BookmarkType, i: number) => {
                    let status = that.add(e);
                    typeof callback === "function" && callback(e, i, status);
                });
            },
        });
    }

    /**
     * 创建书签时当前场景截图
     * @param {number} height canvas高度
     * @param {number} width canvas宽度
     * @returns
     */
    #getSceneImage(height: number, width: number): Promise<string> {
        let canvas = this.#viewer.scene.canvas;
        let image = new Image();
        image.src = canvas.toDataURL("image/png");

        return new Promise((resolve, reject) => {
            image.onload = function () {
                canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas
                    .getContext("2d")!
                    .drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg"));
            };
        });
    }
}
