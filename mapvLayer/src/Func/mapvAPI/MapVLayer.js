import MapVRenderer from "./MapVRenderer.js"

let classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

let createClass = function () {
  function defineProperties(target, props) {
    for (let i = 0; i < props.length; i++) {
      let descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 * MapVLayer
 */
let MapVLayer = function () {
  /**
   * layer
   * @param viewer
   * @param dataSet
   * @param options
   * @param container
   */
  function layer(viewer, dataSet, options, container) {
    classCallCheck(this, layer);
    this.map = viewer;
    this.scene = viewer.scene;
    this.mapvBaseLayer = new MapVRenderer(viewer, dataSet, options, this);
    this.mapVOptions = options;
    this.initDevicePixelRatio();
    this.canvas = this._createCanvas();
    this.render = this.render.bind(this);
    if (container) {
      this.container = container;
      container.appendChild(this.canvas);
    } else {
      this.container = viewer.container;
      this.addInnerContainer()
    }
    this.bindEvent();
    this._reset()
  }

  /**
   *监听
   */
  createClass(layer, [{
    key: "initDevicePixelRatio",
    value: function () {
      this.devicePixelRatio = window.devicePixelRatio || 1
    }
  },
    {
      key: "addInnerContainer",
      value: function () {
        this.container.appendChild(this.canvas)
      }
    },
    {
      key: "bindEvent",
      value: function () {
        let self = this;
        this.innerMoveStart = this.moveStartEvent.bind(this);
        this.innerMoveEnd = this.moveEndEvent.bind(this);
        this.scene.camera.moveStart.addEventListener(this.innerMoveStart, this);
        this.scene.camera.moveEnd.addEventListener(this.innerMoveEnd, this);
        let eventHandler = new Cesium.ScreenSpaceEventHandler(this.canvas);
        // 添加左键监听
        eventHandler.setInputAction(function (t) {
          self.innerMoveEnd()
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        // 添加右键监听
        eventHandler.setInputAction(function (t) {
          self.innerMoveEnd()
        }, Cesium.ScreenSpaceEventType.MIDDLE_UP);
        this.handler = eventHandler
      }
    },
    {
      key: "unbindEvent",
      value: function () {
        this.scene.camera.moveStart.removeEventListener(this.innerMoveStart, this);
        this.scene.camera.moveEnd.removeEventListener(this.innerMoveEnd, this);
        this.scene.postRender.removeEventListener(this._reset, this);
        if (this.handler) {
          this.handler.destroy();
          this.handler = null;
        }
      }
    },
    {
      key: "moveStartEvent",
      value: function () {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.animatorMovestartEvent();
          this.scene.postRender.addEventListener(this._reset, this);
        }
      }
    },
    {
      key: "moveEndEvent",
      value: function () {
        this.scene.postRender.removeEventListener(this._reset, this);
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.animatorMoveendEvent();
        }
        this._reset();
      }
    },
    {
      key: "zoomStartEvent",
      value: function () {
        this._unvisiable()
      }
    },
    {
      key: "zoomEndEvent",
      value: function () {
        this._unvisiable()
      }
    },
    {
      key: "addData",
      value: function (e, t) {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.addData(e, t)
        }
      }
    },
    {
      key: "updateData",
      value: function (e, t) {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.updateData(e, t)
        }
      }
    },
    {
      key: "getData",
      value: function () {
        if (this.mapvBaseLayer) {
          this.dataSet = this.mapvBaseLayer.getData();
          return this.dataSet
        }
      }
    },
    {
      key: "removeData",
      value: function (data) {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.removeData(data);
        }
      }
    },
    {
      key: "removeAllData",
      value: function () {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer.clearData();
        }
      }
    },
    {
      key: "_visiable",
      value: function () {
        return this.canvas.style.display = "block"
      }
    },
    {
      key: "_unvisiable",
      value: function () {
        return this.canvas.style.display = "none"
      }
    },
    {
      key: "_createCanvas",
      value: function () {
        let id = 0;
        let canvas = document.createElement("canvas");
        canvas.id = this.mapVOptions.layerid || "mapv" + id++;
        canvas.style.position = "absolute";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = this.mapVOptions.zIndex || 100;
        canvas.width = parseInt(this.map.canvas.width);
        canvas.height = parseInt(this.map.canvas.height);
        canvas.style.width = this.map.canvas.style.width;
        canvas.style.height = this.map.canvas.style.height;
        let pixelRatio = this.devicePixelRatio;
        if (this.mapVOptions.context === "2d") {
          canvas.getContext(this.mapVOptions.context).scale(pixelRatio, pixelRatio)
        }
        return canvas
      }
    },
    {
      key: "_reset",
      value: function () {
        this.resizeCanvas();
        this.fixPosition();
        this.onResize();
        this.render();
      }
    },
    {
      key: "draw",
      value: function () {
        this._reset();
      }
    },
    {
      key: "show",
      value: function () {
        this._visiable();
      }
    },
    {
      key: "hide",
      value: function () {
        this._unvisiable();
      }
    },
    {
      key: "destroy",
      value: function () {
        this.unbindEvent();
        this.remove();
      }
    },
    {
      key: "remove",
      value: function () {
        if (this.mapvBaseLayer) {
          this.removeAllData();
          this.mapvBaseLayer.destroy();
          this.mapvBaseLayer = undefined;
          this.canvas.parentElement.removeChild(this.canvas)
        }
      }
    },
    {
      key: "update",
      value: function (value) {
        if (value) {
          this.updateData(value.data, value.options)
        }
      }
    },
    {
      key: "resizeCanvas",
      value: function () {
        if (this.canvas) {
          let canvas = this.canvas;
          canvas.style.position = "absolute";
          canvas.style.top = "0px";
          canvas.style.left = "0px";
          canvas.width = parseInt(this.map.canvas.width);
          canvas.height = parseInt(this.map.canvas.height);
          canvas.style.width = this.map.canvas.style.width;
          canvas.style.height = this.map.canvas.style.height;
        }
      }
    },
    {
      key: "fixPosition",
      value: function () {
      }
    },
    {
      key: "onResize",
      value: function () {
      }
    },
    {
      key: "render",
      value: function () {
        if (this.mapvBaseLayer) {
          this.mapvBaseLayer._canvasUpdate();
        }
      }
    }
  ]);

  return layer
}();

export default MapVLayer;
