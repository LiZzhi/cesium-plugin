import { Viewer } from "cesium";
import type { BookmarkType } from "../type";
import { destination } from "turf";

// 把字符串内容，保存到本地
export function saveShareContent(content: string, fileName: string) {
    let downLink = document.createElement('a');
    downLink.download = fileName;
    //字符内容转换为blod地址
    let blob = new Blob([content]);
    downLink.href = URL.createObjectURL(blob);
    // 链接插入到页面
    document.body.appendChild(downLink);
    downLink.click();
    // 移除下载链接
    document.body.removeChild(downLink);
}

function getFileType(fileName: string) {
    const isJson = /.json$/i
    fileName = fileName.toLowerCase()
    return isJson.test(fileName);
}

export function inputVectorData({errFunc, endFunc}: any) {
    let $oldInput = document.getElementById('_ef');
    $oldInput && $oldInput.remove()

    let $input = document.createElement('input');
    $input.setAttribute('id', '_ef');
    $input.setAttribute('type', 'file');
    $input.setAttribute('style', 'display:none');
    document.body.appendChild($input);
    $input.onchange = function (d) {
        // @ts-ignore
        let file = $input.files[0];
        let fileName = file.name;
        let filePath = $input.value;
        let fileType = getFileType(fileName);
        if (!fileType) {
            typeof errFunc === "function" && errFunc('文件类型无法失败，只支持Json格式');
            return;
        }
        let reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function (evt: any) {
            try {
                let jsonContext = JSON.parse(evt.target.result);
                typeof endFunc === "function" && endFunc({fileName, filePath, jsonContext});
            } catch (e) {
                typeof errFunc === "function" && errFunc('文件已损坏');
            }
        };
    };
    $input.click();
}

export function createBookmarkDom(viewer:Viewer, bookmark: BookmarkType) {
    let $container = document.createElement("div");
    $container.classList.add("markItemBox")

    let $header = document.createElement("div");
    $header.innerHTML = bookmark.name;
    $header.classList.add("markItemHeader");

    let $body = document.createElement("div");
    $body.classList.add("markItemBody");

    let $img = document.createElement("img");
    $img.classList.add("markImg");
    $img.src = bookmark.img

    $container.onclick = ()=>{
        viewer.camera.flyTo({
            destination: bookmark.cameraView.destination,
            orientation: bookmark.cameraView.orientation,
        })
    }

    $body.appendChild($img)
    $container.appendChild($header)
    $container.appendChild($body)
    return $container
}
