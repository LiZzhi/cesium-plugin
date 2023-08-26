/*
 * @Author: XingTao xingt@geovis.com.cn
 * @Date: 2023-08-22 17:24:02
 * @LastEditors: XingTao xingt@geovis.com.cn
 * @LastEditTime: 2023-08-22 17:26:46
 * @FilePath: \cesium-plugin\effectLine\src\func\PolylineTrialFlowMaterial.js
 * @Description: 尾迹流动线材质
 */

export default class PolylineTrialFlowMaterialProperty {
    constructor(options) {
        options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = options.color;
        this.duration = options.duration;
        this._time = performance.now();
    }
}
if (window.Cesium) {
    Object.defineProperties(PolylineTrialFlowMaterialProperty.prototype, {
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

    PolylineTrialFlowMaterialProperty.prototype.getType = function (time) {
        return 'PolylineTrialFlow';
    };

    PolylineTrialFlowMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.time = ((performance.now() - this._time) % this.duration) / this.duration;
        return result;
    };

    PolylineTrialFlowMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof PolylineTrialFlowMaterialProperty &&
                this.duration == other.duration &&
                Cesium.Property.equals(this._color, other._color));
    };
    Cesium.Material.PolylineTrialFlowType = 'PolylineTrialFlow';
    Cesium.Material.PolylineTrialFlowSource = `
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            float t = time;
            t *= 1.03;
            float alpha = smoothstep(t- 0.1, t, st.s) * step(-t, -st.s);
            alpha += 0.1;
            material.diffuse= color.rgb;
            material.alpha = alpha;
            return material;
        }
    `

    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrialFlowType, {
        fabric: {
            type: Cesium.Material.PolylineTrialFlowType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                transparent: true,
                time: 20
            },
            source: Cesium.Material.PolylineTrialFlowSource
        },
        translucent: function (material) {
            return true;
        }
    });
}
