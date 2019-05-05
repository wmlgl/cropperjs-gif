const CopyPlugin = require('copy-webpack-plugin');

var path = require("path");
module.exports = {
    entry:'./src/index.js',
    output:{
        filename:'main.js',
        path:path.resolve(__dirname,'dist'),
        publicPath:'/',                       //公共路径，从内存中读取
        library: "", // string,
        libraryTarget: "umd", // 通用模块定义    // 导出库(exported library)的类型
    },
    devServer:{
        contentBase:'./',
        host:'0.0.0.0',
        compress:false,
        port:8080,
        hot:true
    },
    plugins: [
        new CopyPlugin([
          { from: 'bower_components/gif.js/dist/gif.worker.js', to: './' },
          { from: 'bower_components/gif.js/dist/*.map', toType:"template", to: './[name].[ext]' }
        ])
    ]
}
