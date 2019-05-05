var BlobCreator = {
    createBlob: function(uint8Arr, options){
        var blob;
        try {
            blob = new Blob( uint8Arr, options )
        } catch (e) {
            // TypeError old chrome and FF
            window.BlobBuilder = window.BlobBuilder || 
                                    window.WebKitBlobBuilder || 
                                    window.MozBlobBuilder || 
                                    window.MSBlobBuilder;
            if(e.name == 'TypeError' && window.BlobBuilder){
                var bb = new BlobBuilder();
                bb.append(uint8Arr[0].buffer);
                blob = bb.getBlob(options.type || 'image/png');
            }
            else if(e.name == "InvalidStateError"){
                // InvalidStateError (tested on FF13 WinXP)
                blob = new Blob( [uint8Arr[0].buffer], options);
            }
            else{
                throw Error('Not Supported Blob Constructor!')
                // We're screwed, blob constructor unsupported entirely   
            }
        }
        return blob;
    }
}

export default BlobCreator;