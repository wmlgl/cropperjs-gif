import BlobCreator from './blob-creator'
import GIF from '../bower_components/gif.js/dist/gif'
import { GIFuctJS } from 'exports-loader?GIFuctJS=GIF!../bower_components/gifuct-js/dist/gifuct-js'

/**
 * constructor
 * @param {*} options 
 */
var EasyGif = {
    /**
     * 1.修复Worker不能传递CanvasPixelArray的问题
     * 2.修复BLOB构造BUG
     */
    fixCompatibility: function(){
        GIF.prototype.getContextData = function(ctx){
            var data = ctx.getImageData(0, 0, this.options.width, this.options.height).data;
            if(/CanvasPixelArray/.test(Object.prototype.toString.call(data))){
                data = EasyGif.toUint8Array(data);
            }
            return data;
        }

        // 将代码中的"new Blob"替换成 "BlobCreator.createBlob"
        var sourceCode = GIF.prototype.finishRendering.toString();
        sourceCode = sourceCode.replace('new Blob', 'createBlob');
        GIF.prototype.finishRendering = new Function('createBlob', 'return (' + sourceCode + ')')(BlobCreator.createBlob);
    },
    toUint8Array: function(data){
        var uintArray = new Uint8Array(data.length);
        for(var i=0,l=data.length; i<l; i++) {
            uintArray[i] = data[i];
        }
        return uintArray;
    },
    frameToImageData: function(ctx, frame) {
        var totalPixels = frame.pixels.length;
        var imgData = ctx.createImageData(frame.dims.width, frame.dims.height);
        // var patchData = window.Uint8ClampedArray ? new Uint8ClampedArray(totalPixels * 4) : imgData.data;
		var patchData = imgData.data;
		for(var i=0; i<totalPixels; i++){
			var pos = i * 4;
			var colorIndex = frame.pixels[i];
			var color = frame.colorTable[colorIndex];
			patchData[pos] = color[0];
			patchData[pos + 1] = color[1];
			patchData[pos + 2] = color[2];
			patchData[pos + 3] = colorIndex !== frame.transparentIndex ? 255 : 0;
		}
		return imgData;
    },
    decoder: function (arrayBuffer) {
        return new GIFuctJS(arrayBuffer);
    },
    encoder: function (options) {
        return new GIF(options);
    }
};
EasyGif.fixCompatibility();
export default EasyGif;