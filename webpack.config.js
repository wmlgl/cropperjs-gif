const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

var path = require("path");
var config = {
    entry: {
        'cropperjs-gif-all' : './src/index.js',
        'cropperjs-gif' : './src/cropperjs-gif.js',
        'easy-gif' : './src/easy-gif.js'
    },
    optimization: {},
    output:{
        filename:'[name].js',
        path:path.resolve(__dirname,'dist'),
        publicPath:'/dist/',                       //公共路径，从内存中读取
        library: "", // string,
        libraryTarget: "window",
        // libraryTarget: "umd", // 通用模块定义    // 导出库(exported library)的类型
    },
    devServer:{
        contentBase:'./',
        host:'0.0.0.0',
        compress:false,
        port:8080,
        hot:true,
        setup: function(app) {
            app.post('/post/**', function(req, res) {
                req.on('data', function(chunk){
                    console.log('post length:' + chunk.length);
                });
                req.on('end', function(){
                    console.log('post end');
                    res.end("ok");
                });
            });
       }
    },
    plugins: [
        new CopyPlugin([
          { from: 'bower_components/gif.js/dist/gif.worker.*', toType:"template", to: './[name].[ext]' }
        ]),
        new webpack.BannerPlugin('Project: https://github.com/wmlgl/cropperjs-gif, license: MIT')
    ]
}
module.exports = (env, argv) => {

    if (argv.mode === 'development') {
      console.log('in development mode');
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    
    if (argv.mode === 'production') {
        console.log('in production mode');
        config.devtool = 'source-map';
      //...
    }
  
    return config;
  };