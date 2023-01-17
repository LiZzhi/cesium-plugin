const mapv = require("../mapvAPI/mapv.js");

export default function squareGraphData() {
    // 构造数据
    let positions = [];
    let geojson = [];
    let randomCount = 300;
    while (randomCount--) {
        let jd = 113.65276089 + Math.random() * 5;
        let wd = 28.310530293 + Math.random() * 5;
        let point = [jd, wd]
        positions.push(Cesium.Cartesian3.fromDegrees(point[0], point[1]));

        geojson.push({
            geometry: {
                type: 'Point',
                coordinates: point
            },
            count: 30 * Math.random()
        });
    }

    //mapv图层参数
    let options = {
        fillStyle: 'rgba(55, 50, 250, 0.8)',
        shadowColor: 'rgba(255, 250, 50, 1)',
        shadowBlur: 20,
        max: 100,
        size: 50,
        label: {
            show: true,
            fillStyle: 'white'
        },
        globalAlpha: 0.5,
        gradient: {
            0.25: 'rgb(0,0,255)',
            0.55: 'rgb(0,255,0)',
            0.85: 'yellow',
            1.0: 'rgb(255,0,0)'
        },
        draw: 'grid'
    };
    let dataSet = new mapv.DataSet(geojson);
    return [
        [dataSet, options]
    ]
}