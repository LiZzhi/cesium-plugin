/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 17:24:02
 * @LastEditors: “Lizhi” “362042734@qq.com”
 * @LastEditTime: 2023-08-26 16:51:08
 * @FilePath: \cesium-plugin\effectLine\src\func\PolylineSpriteMaterial.js
 * @Description: 精灵线材质
 */

export default class PolylineSpriteMaterialProperty {
    constructor(options) {
        this._definitionChanged = new Cesium.Event();
        this.duration = options.duration;
        this.url = options.url || 'public/img/精灵线材质02.png';
        this._time = performance.now();
    }
}
if (window.Cesium) {
    Object.defineProperties(PolylineSpriteMaterialProperty.prototype, {
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


    PolylineSpriteMaterialProperty.prototype.getType = function (time) {
        return 'PolylineSprite';
    };

    PolylineSpriteMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.image = this.url;
        result.time = ((performance.now() - this._time) % this.duration) / this.duration;
        return result;
    };

    PolylineSpriteMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof PolylineSpriteMaterialProperty &&
                this.duration == other.duration);
    };

    Cesium.Material.PolylineSpriteType = 'PolylineSprite';
    Cesium.Material.PolylineSpriteSource =`
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));
            material.alpha = colorImage.a;
            material.diffuse = colorImage.rgb * 1.5 ;
            return material;
        }
    `
    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineSpriteType, {

        fabric: {
            type: Cesium.Material.PolylineSpriteType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                image: '',
                transparent: true,
                time: 20
            },
            source: Cesium.Material.PolylineSpriteSource
        },

        translucent: function (material) {
            return true;
        }
    });

}
