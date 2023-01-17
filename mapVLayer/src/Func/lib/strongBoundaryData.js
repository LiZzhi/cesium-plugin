const mapv = require("../mapvAPI/mapv.js");

export default function strongBoundaryData() {
    let randomCount = 500;
    let node_data = {
        '0': {
            'x': 108.154518,
            'y': 36.643346
        },
        '1': {
            'x': 121.485124,
            'y': 31.235317
        }
    };

    let edge_data = [{
        'source': '1',
        'target': '0'
    }];

    let citys = ['北京', '天津', '上海', '重庆', '石家庄', '太原', '呼和浩特', '哈尔滨', '长春', '沈阳', '济南', '南京', '合肥', '杭州', '南昌', '福州', '郑州', '武汉', '长沙', '广州', '南宁', '西安', '银川', '兰州', '西宁', '乌鲁木齐', '成都', '贵阳', '昆明', '拉萨', '海口'];

    // 构造数据
    for (let i = 1; i < randomCount; i++) {
        let cityCenter = mapv.utilCityCenter.getCenterByCityName(citys[parseInt(Math.random() * citys.length)]);
        node_data[i] = {
            x: cityCenter.lng - 5 + Math.random() * 10,
            y: cityCenter.lat - 5 + Math.random() * 10
        };
        edge_data.push({
            'source': ~~(i * Math.random()),
            'target': '0'
        });
    }

    let fbundling = mapv.utilForceEdgeBundling()
        .nodes(node_data)
        .edges(edge_data);

    let results = fbundling();

    let data = [];
    let timeData = [];

    for (let i = 0; i < results.length; i++) {
        let line = results[i];
        let coordinates = [];
        for (let j = 0; j < line.length; j++) {
            coordinates.push([line[j].x, line[j].y]);
            timeData.push({
                geometry: {
                    type: 'Point',
                    coordinates: [line[j].x, line[j].y]
                },
                count: 1,
                time: j
            });
        }
        data.push({
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        });
    }

    let dataSet1 = new mapv.DataSet(data);
    let options1 = {
        strokeStyle: 'rgba(55, 50, 250, 0.3)',
        globalCompositeOperation: 'lighter',
        shadowColor: 'rgba(55, 50, 250, 0.5)',
        shadowBlur: 10,
        methods: {
            click: function (item) {}
        },
        lineWidth: 1.0,
        draw: 'simple'
    };

    let dataSet2 = new mapv.DataSet(timeData);
    let options2 = {
        fillStyle: 'rgba(255, 250, 250, 0.9)',
        globalCompositeOperation: 'lighter',
        size: 1.5,
        animation: {
            type: 'time',
            stepsRange: {
                start: 0,
                end: 100
            },
            trails: 1,
            duration: 5
        },
        draw: 'simple'
    };

    return [
        [dataSet1, options1],
        [dataSet2, options2]
    ];
}