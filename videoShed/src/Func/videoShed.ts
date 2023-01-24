import * as Cesium from "cesium";
import {
    Viewer,
    Event,
    Quaternion,
    Primitive,
    Camera,
    PerspectiveFrustum,
    PostProcessStage,
    Cartesian3,
} from "cesium";
// @ts-ignore
import videoShed3dShader from "../glsl/index.js";
import { calculateHPRPosition } from "./tool";
import type { videoShedOptions } from "../Type/type";

export default class videoShed {
    #viewer: Viewer;
    #options: videoShedOptions;
    #position: Cartesian3;
    #orientation: Quaternion;
    #activeVideoListener: Event.RemoveCallback | undefined;
    #videoTexture: any;
    #viewShadowMap: any;
    #shadowMapCamera: Camera;
    #cameraFrustum: Primitive | undefined;
    #postProcess: PostProcessStage | undefined;
    #curDepth: boolean;
    #isStart: boolean;
    constructor(viewer: Viewer, options: videoShedOptions) {
        this.#viewer = viewer;
        this.#options = Object.assign(
            {
                near: 0.1,
                far: 40,
                alpha: 1,
                aspectRatio: 1,
                fov: 40,
                debugFrustum: true,
            },
            options
        );
        this.#position = new Cesium.Cartesian3();
        this.#orientation = new Cesium.Quaternion();
        this.#activeVideoListener = undefined;
        this.#videoTexture = undefined;
        this.#viewShadowMap = undefined;
        this.#cameraFrustum = undefined;
        this.#shadowMapCamera = new Cesium.Camera(viewer.scene);
        this.#postProcess = undefined;
        this.#curDepth = viewer.scene.globe.depthTestAgainstTerrain;
        this.#isStart = false;
    }

    /**
     * 创建投影
     */
    init() {
        this.#isThis();
        if (this.#isStart) return;
        if (!this.#options.cameraPosition) {
            throw new Error("缺少 cameraPosition 参数"); 
        }
        this.#isStart = true;
        // 不开深度检测会陷下去
        this.#viewer.scene.globe.depthTestAgainstTerrain = true;
        this.#initCamera();
        this.#activeVideo();
        this.#getOrientation();
        this.#createShadowMap();
        this.#addCameraFrustum();
        this.#addPostProcess();
        this.#viewer.scene.primitives.add(this);
    }

    /**
     * 获取当前配置参数参数
     * @returns {videoShedOptions}
     */
    get styleOptions(): videoShedOptions{
        let o = JSON.parse(JSON.stringify(this.#options))
        return o
    }

    /**
     * 更新当前投影位置
     * @param {videoShedOptions} options 更新参数
     */
    updateStyle(options: Partial<videoShedOptions>){
        this.#isThis();
        if (!this.#isStart){
            throw new Error("请先调用实例方法 <videoShed.init>"); 
        }
        this.#viewer.scene.primitives.remove(this.#cameraFrustum);
        this.#options = Object.assign(
            this.styleOptions,
            options
        )
        this.#initCamera();
        this.#getOrientation();
        this.#createShadowMap();
        this.#addCameraFrustum();
    }

    /**
     * 销毁
     */
    destroy() {
        this.#isThis();
        this.#postProcess &&
            this.#viewer.scene.postProcessStages.remove(this.#postProcess);
        this.#viewer.scene.primitives.remove(this.#cameraFrustum);
        this.#activeVideoListener &&
            this.#viewer.clock.onTick.removeEventListener(
                this.#activeVideoListener
            );
        this.#videoTexture && this.#videoTexture.destroy();
        this.#postProcess = undefined;
        this.#cameraFrustum = undefined;
        this.#activeVideoListener = undefined;
        this.#viewShadowMap = undefined;
        this.#videoTexture = undefined;
        this.#shadowMapCamera = new Cesium.Camera(this.#viewer.scene);
        this.#viewer.scene.globe.depthTestAgainstTerrain = this.#curDepth;
        this.#viewer.scene.primitives.remove(this);
        this.#isStart = false;
    }

    /**
     * 【不要调用】实现Primitive接口,供Cesium内部在每一帧中调用。
     * 因为此类本质为自定义primitive,故要实现 update 接口,Cesium
     * 每一帧都会调用一次
     * @param { Cesium.FrameState } frameState
     */
    update(frameState: any) {
        this.#viewShadowMap && frameState.shadowMaps.push(this.#viewShadowMap);
    }

    #initCamera() {
        let rotation = this.#options.rotation
        if(rotation){
            if(!rotation.heading) rotation.heading = 0
            if(!rotation.pitch) rotation.pitch = 0
        } else {
            this.#options.rotation = { heading: 90, pitch: 0 };
        }
        this.#position = calculateHPRPosition(
            this.#options.cameraPosition,
            new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(
                    rotation!.heading
                ),
                Cesium.Math.toRadians(
                    rotation!.pitch
                ),
                this.#options.far
            )
        );
    }

    #activeVideo() {
        let video = this.#options.$video;
        // @ts-ignore
        let context = this.#viewer.scene.context;
        if (!video) {
            throw new Error("options 中没有 video<HTMLVideoElement> 属性");
        } else {
            this.#activeVideoListener = () => {
                this.#videoTexture && this.#videoTexture.destroy();
                // @ts-ignore
                this.#videoTexture = new Cesium.Texture({
                    context: context,
                    source: video,
                    width: 1,
                    height: 1,
                    pixelFormat: Cesium.PixelFormat.RGBA,
                    pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
                });
            };
            this.#viewer.clock.onTick.addEventListener(
                this.#activeVideoListener
            );
        }
    }

    // 获取shadowmap位置
    #getOrientation() {
        // 相机的观看方向
        let direction = Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.subtract(
                this.#position,
                this.#options.cameraPosition,
                new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
        );
        // 相机的向上方向
        let up = Cesium.Cartesian3.normalize(
            this.#options.cameraPosition,
            new Cesium.Cartesian3()
        );
        let camera = new Cesium.Camera(this.#viewer.scene);
        camera.position = this.#options.cameraPosition;
        camera.direction = direction;
        camera.up = up;
        direction = camera.directionWC;
        up = camera.upWC;

        let rightWC = Cesium.Cartesian3.negate(
            camera.rightWC,
            new Cesium.Cartesian3()
        );

        let matrix3 = new Cesium.Matrix3();
        Cesium.Matrix3.setColumn(matrix3, 0, rightWC, matrix3);
        Cesium.Matrix3.setColumn(matrix3, 1, up, matrix3);
        Cesium.Matrix3.setColumn(matrix3, 2, direction, matrix3);
        let orientation = Cesium.Quaternion.fromRotationMatrix(
            matrix3,
            new Cesium.Quaternion()
        );
        this.#orientation = orientation;
        return orientation;
    }

    // 创建shadowmap
    #createShadowMap() {
        this.#shadowMapCamera = new Cesium.Camera(this.#viewer.scene);
        this.#shadowMapCamera.position = this.#options.cameraPosition;
        //计算两个笛卡尔的组分差异。
        this.#shadowMapCamera.direction = Cesium.Cartesian3.subtract(
            this.#position,
            this.#options.cameraPosition,
            new Cesium.Cartesian3(0, 0, 0)
        );
        // 归一化
        this.#shadowMapCamera.up = Cesium.Cartesian3.normalize(
            this.#options.cameraPosition,
            new Cesium.Cartesian3(0, 0, 0)
        );
        let distance = Cesium.Cartesian3.distance(
            this.#position,
            this.#options.cameraPosition
        );

        this.#shadowMapCamera.frustum = new Cesium.PerspectiveFrustum({
            fov: Cesium.Math.toRadians(this.#options.fov!),
            aspectRatio: this.#options.aspectRatio,
            near: this.#options.near,
            far: distance,
        });
        // @ts-ignore
        this.#viewShadowMap = new Cesium.ShadowMap({
            lightCamera: this.#shadowMapCamera,
            enable: false,
            darkness: 1,
            isPointLight: false,
            isSpotLight: true,
            cascadesEnabled: false,
            // @ts-ignore
            context: this.#viewer.scene.context,
            pointLightRadius: distance,
        });
    }

    //创建视锥
    #addCameraFrustum() {
        this.#cameraFrustum = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
                geometry: new Cesium.FrustumOutlineGeometry({
                    origin: this.#options.cameraPosition,
                    orientation: this.#orientation,
                    frustum: this.#shadowMapCamera
                        .frustum as PerspectiveFrustum,
                    // @ts-ignore
                    _drawNearPlane: true,
                }),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        Cesium.Color.YELLOW.withAlpha(0.5)
                    ),
                },
            }),
            appearance: new Cesium.PerInstanceColorAppearance({
                translucent: false,
                flat: true,
            }),
            asynchronous: false,
            show: this.#options.debugFrustum,
        });
        this.#viewer.scene.primitives.add(this.#cameraFrustum);
    }

    //添加后处理程序
    #addPostProcess() {
        let bias = this.#viewShadowMap._isPointLight
            ? this.#viewShadowMap._pointBias
            : this.#viewShadowMap._primitiveBias;
        this.#postProcess = new Cesium.PostProcessStage({
            fragmentShader: videoShed3dShader,
            uniforms: {
                mixNum: () => {
                    return this.#options.alpha;
                },
                stcshadow: () => {
                    return this.#viewShadowMap._shadowMapTexture;
                },
                videoTexture: () => {
                    return this.#videoTexture;
                },
                _shadowMap_matrix: () => {
                    return this.#viewShadowMap._shadowMapMatrix;
                },
                shadowMap_lightPositionEC: () => {
                    return this.#viewShadowMap._lightPositionEC;
                },
                shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
                    let cartesian2 = new Cesium.Cartesian2();
                    cartesian2.x = 1 / this.#viewShadowMap._textureSize.x;
                    cartesian2.y = 1 / this.#viewShadowMap._textureSize.y;
                    return Cesium.Cartesian4.fromElements(
                        cartesian2.x,
                        cartesian2.y,
                        bias.depthBias,
                        bias.normalShadingSmooth
                    );
                },
                // @ts-ignore
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness:
                    () => {
                        return Cesium.Cartesian4.fromElements(
                            bias.normalOffsetScale,
                            this.#viewShadowMap._distance,
                            this.#viewShadowMap.maximumDistance,
                            this.#viewShadowMap._darkness
                        );
                    },
            },
        });
        this.#viewer.scene.postProcessStages.add(this.#postProcess);
    }

    /**
     * 判断 this 指向
     */
    #isThis(): void {
        if (!(this instanceof videoShed)) {
            // 判断 this 指向, 防止全局执行
            throw new Error(
                "videoShed 实例中 this 指向全局，请正确调用或修正 this 指向"
            );
        }
    }
}
