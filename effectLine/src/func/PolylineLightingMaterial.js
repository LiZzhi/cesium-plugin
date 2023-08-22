/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 17:24:02
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 17:24:52
 * @FilePath: \cesium-plugin\effectLine\src\func\PolylineLightingMaterial.js
 * @Description: 发光线材质
 */

export default class PolylineLightingMaterialProperty {
    constructor(color) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = color;
    }
}

if (window.Cesium) {
    Object.defineProperties(PolylineLightingMaterialProperty.prototype, {
        isConstant: {
            get: function () {
                return false;
            }
        },
        definitionChanged: {
            get: function () {
                return this._definitionChanged;
            }
        },
        color: Cesium.createPropertyDescriptor('color')
    });

    PolylineLightingMaterialProperty.prototype.getType = function (time) {
        return 'PolylineLighting';
    };

    PolylineLightingMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.image = Cesium.Material.PolylineLightingImage;
        return result;
    };

    PolylineLightingMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof PolylineLightingMaterialProperty &&
                Cesium.Property.equals(this._color, other._color));

    };

    Cesium.Material.PolylineLightingType = 'PolylineLighting';
    Cesium.Material.PolylineLightingImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAACYCAYAAACS0lH9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAJ0GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgMTE2LjE2NDY1NSwgMjAyMS8wMS8yNi0xNTo0MToyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDplODY0YmNmNy1lZGIyLWIyNDQtYWI0NC04OWZkNmMwOTQ4MDYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NjIyOGMxMDUtODFmZS00MjAxLWIwOTEtZDkwMGI0NTI0NWMwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9IjcxNzA5OEJGODAwODNEREJGRDQyQzAzMzQ5NDlDRDFDIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IiIgdGlmZjpJbWFnZVdpZHRoPSI1MTIiIHRpZmY6SW1hZ2VMZW5ndGg9IjE1MiIgdGlmZjpQaG90b21ldHJpY0ludGVycHJldGF0aW9uPSIyIiB0aWZmOlNhbXBsZXNQZXJQaXhlbD0iMyIgdGlmZjpYUmVzb2x1dGlvbj0iMS8xIiB0aWZmOllSZXNvbHV0aW9uPSIxLzEiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjEiIGV4aWY6RXhpZlZlcnNpb249IjAyMzEiIGV4aWY6Q29sb3JTcGFjZT0iNjU1MzUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI1MTIiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSIxNTIiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAyLTIzVDEwOjAyOjQxKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMi0yM1QxMDowODo0NCswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMi0yM1QxMDowODo0NCswODowMCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmZmYTk5ZjhhLTdiZmQtNDcxNi04MTgwLWJmZTUyMmFmNGUzNSIgc3RFdnQ6d2hlbj0iMjAyMS0wMi0yM1QxMDowODo0NCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBpbWFnZS9qcGVnIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2UvanBlZyB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjYyMjhjMTA1LTgxZmUtNDIwMS1iMDkxLWQ5MDBiNDUyNDVjMCIgc3RFdnQ6d2hlbj0iMjAyMS0wMi0yM1QxMDowODo0NCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmZmYTk5ZjhhLTdiZmQtNDcxNi04MTgwLWJmZTUyMmFmNGUzNSIgc3RSZWY6ZG9jdW1lbnRJRD0iNzE3MDk4QkY4MDA4M0REQkZENDJDMDMzNDk0OUNEMUMiIHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD0iNzE3MDk4QkY4MDA4M0REQkZENDJDMDMzNDk0OUNEMUMiLz4gPHBob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHJkZjpCYWc+IDxyZGY6bGk+NzE3MDk4QkY4MDA4M0REQkZENDJDMDMzNDk0OUNEMUM8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPHRpZmY6Qml0c1BlclNhbXBsZT4gPHJkZjpTZXE+IDxyZGY6bGk+ODwvcmRmOmxpPiA8cmRmOmxpPjg8L3JkZjpsaT4gPHJkZjpsaT44PC9yZGY6bGk+IDwvcmRmOlNlcT4gPC90aWZmOkJpdHNQZXJTYW1wbGU+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+h9EbuwAAA01JREFUeJzt3TuOFVkQBNDoJhmEkDBgZv8L5GMgIcRvHg5ryDTiHKn98Co67q16T4/HYwIAVHm+DgAA7FMAAKCQAgAAhSbJ03UIAGCXBQAACikAAFDIEQAAFLIAAEAhBQAACikAAFBoogQAQB0PfwAopAAAQCGvAQJAIQsAABSyAABAIQsAABSyAABAIQUAAAo5AgCAQr4ECACFPPwBoJACAACFHAEAQCEPfwAoZAEAgEIe/gBQyAIAAIU8/AGgkAUAAAr5LQAAKOS/fwAoZAEAgELuAABAIQsAABRSAACgkAIAAIXcAQCAQhYAAChkAQCAQgoAABRSAACgkIc/ABSaJC+uQwAAu7wFAACFFAAAKDR//wCAIhYAACjkEiAAFLIAAEChSfLyOgQAsMuXAAGgkLcAAKCQAgAAhbwFAACFFAAAKOQIAAAKTZJ/rkMAALsUAAAo5AgAAAr5EiAAFFIAAKCQOwAAUEgBAIBCk+TVdQgAYNckeXMdAgDYNUneXocAAHZNkvfXIQCAXZPkv+sQAMCuSfLvdQgAYNckeXcdAgDY5RIgABSaJK+vQwAAu/wWAAAUmiRP1yEAgF2T5HEdAgDYNUl+XocAAHZNkm/XIQCAXZPky3UIAGDXJPl8HQIA2DVJPl6HAAB2TZIP1yEAgF2T5NN1CABgl0uAAFBokny9DgEA7Jok369DAAC7JsmP6xAAwC4FAAAK+S0AACikAABAoUny6zoEALDLHQAAKKQAAEAhRwAAUGiS/L4OAQDsUgAAoJAjAAAopAAAQKFJ8v91CABgly8BAkChSfK4DgEA7PIWAAAUsgAAQCFvAQBAIQsAABRSAACgkEuAAFDo+ToAALDPlwABoJACAACFFAAAKOQtAAAoZAEAgEIWAAAopAAAQCEFAAAKuQMAAIUsAABQyKeAAaCQBQAACrkDAACFHAEAQCELAAAUsgAAQCELAAAUsgAAQCELAAAUsgAAQCEFAAAKOQIAgEIWAAAo5LcAAKCQAgAAhRwBAEAhCwAAFLIAAEAhCwAAFLIAAEAhBQAACvkSIAAUsgAAQCEFAAAKKQAAUMhrgABQyAIAAIUUAAAo5AgAAApZAACgkAIAAIUUAAAo5A4AABT6A6gaPQ6/wRIfAAAAAElFTkSuQmCC';
    Cesium.Material.PolylineLightingSource =`
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(fract(st.s), st.t));
            material.alpha = colorImage.a * color.a;
            material.diffuse = (colorImage.rgb + color.rgb)* 1.3;
            return material;
        }
    `
        // texture 会报错，需要用texture2D
        // 'czm_material czm_getMaterial(czm_materialInput materialInput)\n\
        // { czm_material material = czm_getDefaultMaterial(materialInput); vec2 st = materialInput.st;\n\
        // vec4 colorImage = texture(image, vec2(fract(st.s), st.t));\n\
        // material.alpha = colorImage.a * color.a;\n\
        // material.diffuse = (colorImage.rgb + color.rgb)* 1.3 ;\n\
        // return material;}';

    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineLightingType, {
        fabric: {
            type: Cesium.Material.PolylineLightingType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                image: Cesium.Material.PolylineLightingImage
            },
            source: Cesium.Material.PolylineLightingSource
        },
        translucent: function (material) {
            return true;
        }
    });

}
