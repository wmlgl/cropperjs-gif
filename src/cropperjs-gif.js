/**
 * a plugin support cropperjs to crop gif image
 * 
 * options:
 *  background: "#fff" default background color
 *  maxWidth: output image max width
 *  maxHeight: output image max height
 *  src: original image url (blob, base64, http)
 *  onerror: error callback, onerror(errorCode, error|null)
 */
function GifCropper(options) {
    options.background = options.background || '#fff';
    this.options = options;
    this.containerCanvas = document.createElement('canvas');
    this.containerCtx = this.containerCanvas.getContext('2d');
    this.convertorCanvas = document.createElement('canvas');
    this.convertorCtx = this.convertorCanvas.getContext('2d');
    this.containerCenterX = null;
    this.containerCenterY = null;
    this.image = null;
    this.height = null;
    this.width = null;

    if(options.debug) {
        nextTick = function(callback){
            setTimeout(callback, 500);
        };
        this.containerCanvas.style.width="200px";
        this.convertorCanvas.style.width="200px";
        document.body.insertBefore(this.containerCanvas, document.body.firstChild);
        document.body.insertBefore(this.convertorCanvas, document.body.firstChild);
    }
}

var ERROR = {
    IMAGE_LOAD_ERROR: "IMAGE_LOAD_ERROR",
    IMAGE_READ_ERROR: "IMAGE_READ_ERROR",
    DECODE_ERROR: "DECODE_ERROR",
    ENCODE_ERROR: "ENCODE_ERROR"
}

GifCropper.prototype.ERROR = ERROR;

/**
 * cropper: cropperjs instance
 */
GifCropper.prototype.crop = function(cropper, callback){
    var cropArea = cropper.getData();
    var that = this;
    var limitRatio = this.calcLimitRatio(cropArea);
    var limitCropArea = {
        x: Math.round(cropArea.x * limitRatio),
        y: Math.round(cropArea.y * limitRatio),
        width: Math.round(cropArea.width * limitRatio),
        height: Math.round(cropArea.height * limitRatio),
        scaleX: cropArea.scaleX * limitRatio,
        scaleY: cropArea.scaleY * limitRatio,
        rotate: cropArea.rotate
    };

    this.readAndDecodeGif(function(){
        that.setupCanvas(limitCropArea, limitRatio);
        that.cropFrame(0, limitCropArea, [], function(result) {
            that.saveGif(limitCropArea, result, function(cropBlob){
                callback && callback(cropBlob);
            });
        });
    });
}
/**
 * calculate ratio of output size limit to smaller then maxWidth and maxHeight 
 */
GifCropper.prototype.calcLimitRatio = function(cropArea){
    var xRatio = this.options.maxWidth / cropArea.width;
    var yRatio = this.options.maxHeight / cropArea.height;
    if(xRatio < 1 || yRatio < 1) {
        return Math.min(xRatio, yRatio);
    }
    return 1;
};
/**
 * get gif width and height, decode gif to frame array
 */
GifCropper.prototype.readAndDecodeGif = function(callback){
    var that = this;
    this.image = new Image();
    this.image.onload = function(){
        that.width = this.naturalWidth || this.width;
        that.height = this.naturalHeight || this.height;

        var xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4) {
                if(xhr.status == 200) {
                    that.decode(xhr.response, callback);
                } else {
                    that.errorHandler(ERROR.IMAGE_READ_ERROR, new Error(xhr.statusText));
                }
            }
        }
        xhr.open('GET', that.options.src);
        xhr.send(null);
    }
    this.image.onerror = function(){
        that.errorHandler(ERROR.IMAGE_LOAD_ERROR);
    }
    this.image.src = this.options.src;
}
/**
 * decode gif
 */
GifCropper.prototype.decode = function(arraybuffer, callback){
    try {
        var gifDecoder = EasyGif.decoder(arraybuffer);
        this.frames = gifDecoder.decompressFrames();
        callback && callback();
    } catch (error) {
        this.errorHandler(ERROR.DECODE_ERROR, error);
    }
}
/**
 * setup canvas size
 */
GifCropper.prototype.setupCanvas = function(cropArea, limitRatio) {
    // 计算图片旋转后的尺寸和切剪后的尺寸， 取最大的一方作为container的尺寸
    var radian = Math.PI/180*cropArea.rotate;
    var rotatedBoxWidth = (this.width*Math.cos(radian)+this.height*Math.sin(radian)) * limitRatio;
    var rotatedBoxHeight = (this.height*Math.cos(radian)+this.width*Math.sin(radian)) * limitRatio;
    
    this.offsetX = -Math.min(cropArea.x, 0);
    this.offsetY = -Math.min(cropArea.y, 0);
    this.containerCenterX = this.offsetX + rotatedBoxWidth / 2;
    this.containerCenterY = this.offsetY + rotatedBoxHeight / 2;

    this.containerCanvas.width = Math.max(this.offsetX + rotatedBoxWidth, this.offsetX + cropArea.width, cropArea.x + cropArea.width);
    this.containerCanvas.height = Math.max(this.offsetY + rotatedBoxHeight, this.offsetY + cropArea.height, cropArea.y + cropArea.height);
    this.containerCtx.clearRect(0, 0, this.containerCanvas.width, this.containerCanvas.height);

    this.convertorCanvas.width = this.width;
    this.convertorCanvas.height = this.height;
}
/**
 * crop one frame by index
 */
GifCropper.prototype.cropFrame = function(frameIndex, cropArea, result, callback) {
    var frame = this.frames[frameIndex];
    var imgData = EasyGif.frameToImageData(this.containerCtx, frame);
    var cropImgData = null;
    var that = this;

    this.containerCtx.save();
    this.containerCtx.translate(this.containerCenterX, this.containerCenterY);
    this.containerCtx.rotate(cropArea.rotate*Math.PI/180);
    this.containerCtx.scale(cropArea.scaleX, cropArea.scaleY);
    this.containerCtx.drawImage(this.drawImgDataToCanvas(frame, imgData), -this.convertorCanvas.width/2, -this.convertorCanvas.height/2);
    this.containerCtx.restore();

    if(frameIndex == 0 && this.containerCtx.globalCompositeOperation) {
        // 添加gif背景颜色
        this.containerCtx.fillStyle = this.options.background;
        this.containerCtx.globalCompositeOperation = "destination-over";
        this.containerCtx.fillRect(0, 0, this.containerCanvas.width, this.containerCanvas.height);
        this.containerCtx.globalCompositeOperation = "source-over";
    }
                
    cropImgData = this.containerCtx.getImageData(
        cropArea.x + this.offsetX,
        cropArea.y + this.offsetY,
        cropArea.width,
        cropArea.height
    );

    result.push(cropImgData);

    frameIndex++;
    if(frameIndex < this.frames.length) {
        nextTick(function(){
            that.cropFrame(frameIndex, cropArea, result, callback);
        });
    } else {
        callback && callback(result);
    }
}
GifCropper.prototype.drawImgDataToCanvas = function(frame, imgData) {
    this.convertorCtx.clearRect(0,0, this.width, this.height);
    this.convertorCtx.putImageData(imgData, frame.dims.left, frame.dims.top);
    return this.convertorCanvas;
}
GifCropper.prototype.saveGif = function(cropArea, imgDataList, callback){
    var options = this.options.encoder || {};
    options.width = cropArea.width;
    options.height = cropArea.height;

    try {
        var encoder = EasyGif.encoder(options);
    
        for(var i=0;i<imgDataList.length;i++) {
            encoder.addFrame(imgDataList[i], {
                delay: this.frames[i].delay
            });
        }
        encoder.on('finished', function(blob){
            callback && callback(blob);

            encoder.abort();
            var workers = encoder.freeWorkers;
            for (var i = 0; i < workers.length; i++) {
                var worker = workers[i];
                worker.terminate();
            }
        });
        encoder.render();
    } catch (error) {
        this.errorHandler(ERROR.DECODE_ERROR, error);
    }
}

GifCropper.prototype.errorHandler = function(errorCode, error){
    this.options.onerror && this.options.onerror(errorCode, error);
}

var nextTick = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.setTimeout;


var CropperjsGif = {
    /**
     * options: GifCropper options
     * cropper: cropperjs instance
     * callback: 
     */
    crop: function(options, cropper, callback){
        return new GifCropper(options).crop(cropper, callback);
    }
}

export { CropperjsGif };