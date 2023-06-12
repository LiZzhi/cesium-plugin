let classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
};

let possibleConstructorReturn = function(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

let inherits = function(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};


let createClass = function() {
    function defineProperties(target, props) {
        for (let i = 0; i < props.length; i++) {
            let descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

let get = function get(object, property, receiver) {
        if (object === null) object = Function.prototype;
        let desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
            let parent = Object.getPrototypeOf(object);

            if (parent === null) {
                return undefined;
            } else {
                return get(parent, property, receiver);
            }
        } else if ("value" in desc) {
            return desc.value;
        } else {
            let getter = desc.get;

            if (getter === undefined) {
                return undefined;
            }

            return getter.call(receiver);
        }
    },

    baseLayer = Function;


let MapVRenderer = undefined;
if (window.mapv) {
    MapVRenderer = function(_baseLayer) {
        function layer(viewer, dataSet, options, mapVLayer) {
            classCallCheck(this, layer);
            let _this = possibleConstructorReturn(this, (layer.__proto__ || Object.getPrototypeOf(layer)).call(this, viewer, dataSet, options));
            return baseLayer ? (_this.map = viewer,
                _this.scene = viewer.scene,
                _this.dataSet = dataSet,
                options = options || {},
                _this.init(options),
                _this.argCheck(options),
                _this.initDevicePixelRatio(),
                _this.canvasLayer = mapVLayer,
                _this.stopAniamation = !1,
                _this.animation = options.animation,
                _this.clickEvent = _this.clickEvent.bind(_this),
                _this.mousemoveEvent = _this.mousemoveEvent.bind(_this),
                _this.bindEvent(), _this) : possibleConstructorReturn(_this)
        };

        /**
         * 从mapv继承baseLayer
         * @type {function(*=, *=, *=, *): *}
         */
        inherits(layer, _baseLayer);

        /**
         * 注册监听
         */
        createClass(layer, [{
                key: "initDevicePixelRatio",
                value: function() {
                    this.devicePixelRatio = window.devicePixelRatio || 1
                }
            },
            {
                key: "clickEvent",
                value: function(e) {
                    let i = e.point,
                        _obj = layer.prototype.__proto__ || Object.getPrototypeOf(layer.prototype);
                    get(_obj, "clickEvent", this).call(this, i, e)
                }
            },
            {
                key: "mousemoveEvent",
                value: function(e) {
                    let point = e.point,
                        _obj = layer.prototype.__proto__ || Object.getPrototypeOf(layer.prototype);
                    get(_obj, "mousemoveEvent", this).call(this, point, e);
                }
            },
            {
                key: "addAnimatorEvent",
                value: function() {}
            },
            {
                key: "animatorMovestartEvent",
                value: function() {
                    let animation = this.options.animation;
                    this.isEnabledTime() && this.animator && (this.steps.step = animation.stepsRange.start)
                }
            },
            {
                key: "animatorMoveendEvent",
                value: function() {
                    this.isEnabledTime() && this.animator
                }
            },
            {
                key: "bindEvent",
                value: function() {
                    this.options.methods && (this.options.methods.click, this.options.methods.mousemove)
                }
            },
            {
                key: "unbindEvent",
                value: function() {
                    let map = this.map;
                    //  this.options.methods && (this.options.methods.click && map.off("click", this.clickEvent),
                    //      this.options.methods.mousemove //&& map.off("mousemove", this.mousemoveEvent)
                    //  )
                }
            },
            {
                key: "getContext",
                value: function() {
                    return this.canvasLayer.canvas.getContext(this.context);
                }
            },
            {
                key: "init",
                value: function(e) {
                    this.options = e;
                    this.initDataRange(e);
                    this.context = this.options.context || "2d";
                    this.options.zIndex &&
                        this.canvasLayer &&
                        this.canvasLayer.setZIndex &&
                        this.canvasLayer.setZIndex(this.options.zIndex);
                    this.initAnimator();
                }
            },
            {
                key: "_canvasUpdate",
                value: function(e) {
                    let scene = this.scene;
                    if (this.canvasLayer && !this.stopAniamation) {
                        let animation = this.options.animation,
                            context = this.getContext();
                        if (this.isEnabledTime()) {
                            if (void 0 === e) return void this.clear(context);
                            if ("2d" === this.context) {
                                context.save();
                                context.globalCompositeOperation = "destination-out";
                                context.fillStyle = "rgba(0, 0, 0, .1)";
                                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
                                context.restore();
                            }
                        } else {
                            this.clear(context);
                        }

                        if ("2d" === this.context) {
                            for (let i in this.options) {
                                context[i] = this.options[i];
                            }
                        } else {
                            context.clear(context.COLOR_BUFFER_BIT);
                        }

                        let _tCoord = {
                            transferCoordinate: function(e) {
                                let i = [99999, 99999],
                                    a = Cesium.Cartesian3.fromDegrees(e[0], e[1]);
                                if (!a) return i;
                                let n = scene.cartesianToCanvasCoordinates(a);
                                if (!n) return i;
                                if (scene.mode === Cesium.SceneMode.SCENE3D) {
                                    if (Cesium.Cartesian3.angleBetween(scene.camera.position, a) > Cesium.Math.toRadians(80)) return !1
                                }
                                return [n.x, n.y]
                            }
                        };

                        if (e) {
                            _tCoord.filter = function(scene) {
                                let trails = animation.trails || 10;
                                return !!(e && scene.time > e - trails && scene.time < e)
                            }
                        }

                        let data = this.dataSet.get(_tCoord);
                        this.processData(data);

                        if ("m" === this.options.unit && this.options.size) {
                            this.options._size = this.options.size;
                        }

                        // WGS84坐标中的位置转换为窗口坐标
                        let coord = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, Cesium.Cartesian3.fromDegrees(0, 0));
                        this.drawContext(context, new mapv.DataSet(data), this.options, coord);
                        this.options.updateCallback && this.options.updateCallback(e)
                    }
                }
            },
            {
                key: "updateData",
                value: function(e, i) {
                    if (e) {
                        let data = e.get(),
                            _obj = layer.prototype.__proto__ || Object.getPrototypeOf(layer.prototype);
                        this.dataSet.set(data);
                        get(_obj, "update", this).call(this, { options: i });

                    }
                }
            },
            {
                key: "addData",
                value: function(e, t) {
                    if (e) {
                        let data = e.get;
                        this.dataSet.add(data);
                        this.update({ options: t });
                    }
                }
            },
            {
                key: "getData",
                value: function() {
                    return this.dataSet;
                }
            },
            {
                key: "removeData",
                value: function(e) {
                    if (this.dataSet) {
                        let data = this.dataSet.get({
                            filter: function(t) {
                                return null == e || "function" != typeof e || !e(t)
                            }
                        });
                        this.dataSet.set(data);
                        this.update({ options: null });
                    }
                }
            },
            {
                key: "clearData",
                value: function() {
                    if (this.dataSet) {
                        this.dataSet.clear();
                        this.update({ options: null });
                    }
                }
            },
            {
                key: "draw",
                value: function() {
                    this.canvasLayer.draw();
                }
            },
            {
                key: "clear",
                value: function(data) {
                    if (data && data.hasOwnProperty('clearRect')) {
                        data.clearRect(0, 0, data.canvas.width, data.canvas.height)
                    }
                }
            },
            {
                key: "destroy",
                value: function() {
                    this.unbindEvent();
                    this.clear(this.getContext());
                    this.clearData();
                    if (this.animator) {
                        this.animator.stop();
                        this.animator = null;
                        this.canvasLayer = null;
                    }

                }
            }
        ]);

        return layer;
    }(mapv.baseLayer);
}


export default MapVRenderer;