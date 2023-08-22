/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 17:24:02
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 18:31:01
 * @FilePath: \cesium-plugin\effectLine\src\func\PolylineArrowMaterial.js
 * @Description: 动态箭头线材质
 */
export default class PolylineArrowMaterialProperty {
    constructor(options) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = options.color;
        this.duration = options.duration;
        this.url = options.url || 'public/img/箭头线材质.png';
        this.count = options.count;
        this._time = (new Date()).getTime();
    }
}

if (window.Cesium) {
    Object.defineProperties(PolylineArrowMaterialProperty.prototype, {
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

    PolylineArrowMaterialProperty.prototype.getType = function (time) {
        return 'PolylineArrowOpacity';
    };

    PolylineArrowMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.image = this.url;
        result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
        result.count = this.count || 4;
        return result;
    };

    PolylineArrowMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof PolylineArrowMaterialProperty &&
                Cesium.Property.equals(this._color, other._color) &&
                this.duration == other.duration &&
                this.count == other.count
            );

    };
    Cesium.Material.PolylineArrowOpacityType = 'PolylineArrowOpacity';
    Cesium.Material.PolylineArrowOpacitySource =`
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(fract(count * st.s - time), fract(st.t)));
            material.alpha =  colorImage.a * color.a;
            material.diffuse =  color.rgb * 3.0;
            return material;
        }
    `
        // texture 会报错，需要用texture2D
        // 'czm_material czm_getMaterial(czm_materialInput materialInput)\n\
        // { czm_material material = czm_getDefaultMaterial(materialInput); vec2 st = materialInput.st;\n\
        // vec4 colorImage = texture(image, vec2(fract( count * st.s - time),fract(st.t)));\n\
        // material.alpha =  colorImage.a * color.a;\n\
        // material.diffuse =  color.rgb * 3.0 ;\n\
        // return material;}';

    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineArrowOpacityType, {
        fabric: {
            type: Cesium.Material.PolylineArrowOpacityType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                image: '',
                time: 20,
                count: 4
            },
            source: Cesium.Material.PolylineArrowOpacitySource
        },
        translucent: function (material) {
            return true;
        }
    });

}
