/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 17:24:02
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 17:26:59
 * @FilePath: \cesium-plugin\effectLine\src\func\PolylineVolumeTrialMaterial.js
 * @Description: 流动管线材质
 */

export default class PolylineVolumeTrialMaterialProperty {
    constructor(options) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = options.color;
        this.duration = options.duration;
        this.count = options.count;
        this.url = options.url || 'public/img/管道线材质.png';
        this._time = (new Date()).getTime();
    }
}

if (window.Cesium) {
    Object.defineProperties(PolylineVolumeTrialMaterialProperty.prototype, {
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

    PolylineVolumeTrialMaterialProperty.prototype.getType = function (time) {
        return 'PolylineVolumeTrial';
    };

    PolylineVolumeTrialMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.image = this.url;
        result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
        result.count = this.count || 4;
        return result;
    };

    PolylineVolumeTrialMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof PolylineVolumeTrialMaterialProperty &&
                Cesium.Property.equals(this._color, other._color) &&
                this.duration == other.duration &&
                this.count == other.count
            );

    };

    Cesium.Material.PolylineVolumeTrialType = 'PolylineVolumeTrial';
    Cesium.Material.PolylineVolumeTrialSource =
        'czm_material czm_getMaterial(czm_materialInput materialInput)\n\
     { czm_material material = czm_getDefaultMaterial(materialInput); vec2 st = materialInput.st;\n\
        vec4 colorImage = texture(image, vec2(fract( count * st.s - time),fract(st.t)));\n\
         material.alpha =  colorImage.a * color.a;\n\
         material.diffuse =  color.rgb *1.5 ;\n\
         return material;}';

    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineVolumeTrialType, {
        fabric: {
            type: Cesium.Material.PolylineVolumeTrialType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                image: '',
                time: 20,
                count: 4
            },
            source: Cesium.Material.PolylineVolumeTrialSource
        },
        translucent: function (material) {
            return true;
        }
    });
}
