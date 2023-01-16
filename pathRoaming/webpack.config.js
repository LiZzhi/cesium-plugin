const path = require("path")
const webpack = require("webpack")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
// 重新编译自动清空build文件夹
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
// cesium 配置
const cesiumSource = "./node_modules/cesium/Build/Cesium"
const cesiumWorkers = "Workers"

module.exports = {
    entry: "./index.ts",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "js/index.js", // js输出在js/下
        environment: {
            // 是否允许webpack使用箭头函数(为了兼容IE)
            arrowFunction: true,
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        // 当配置项复杂时可用{}
                        // 指定加载器
                        loader: "babel-loader",
                        // 设置预定义的环境
                        options: {
                            // 设置预定义的环境
                            presets: [
                                [
                                    // 指定环境插件
                                    "@babel/preset-env",
                                    // 配置信息
                                    {
                                        // 要兼容的目标浏览器
                                        targets: {
                                            "chrome": "88",
                                            "ie": "11"
                                        },
                                        // 指定corejs版本
                                        "corejs": "3",
                                        // 使用corejs的方式为"usage",表示按需加载
                                        "useBuiltIns": "usage"
                                    }
                                ]
                            ]
                        }
                    },
                    "ts-loader"
                ],
                // 排除node-modules中的ts
                exclude: /node-modules/
            },
            {
                test: /\.js$/,
                use: {
                    loader: '@open-wc/webpack-import-meta-loader',
                },
                exclude: /node-modules/
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve("../", cesiumSource, cesiumWorkers),
                    to: "Workers"
                },
                {
                    from: path.resolve("../", cesiumSource, "Assets"),
                    to: "Assets"
                },
                {
                    from: path.resolve("../", cesiumSource, "Widgets"),
                    to: "Widgets"
                },
                {
                    from: path.resolve("../", cesiumSource, "ThirdParty/Workers"),
                    to: "ThirdParty/Workers",
                },
                {
                    // 从public中复制文件,注意空目录会报错
                    from: path.resolve(__dirname, 'public'),
                    // 把复制的文件存放到dist里面
                    to: path.resolve(__dirname, 'dist/public')
                }
            ]
        }),
        new webpack.DefinePlugin({
            CESIUM_BASE_URL: JSON.stringify("./"),
        }),
        new NodePolyfillPlugin(),
    ],
    // 用来设置引用模块
    resolve: {
        // ts,js文件都可以设置为引用模块
        extensions: [".ts", ".js"],
    },
    devServer: {
        // 端口
        port: 9000,
        // 开启压缩
        compress: true,
        // 打开默认浏览器
        open: false,
        // 模块热更新
        hot: true
    }
}