import GIF from '../bower_components/gif.js/dist/gif'
import { GIFuctJS } from 'exports-loader?GIFuctJS=GIF!../bower_components/gifuct-js/dist/gifuct-js'

/**
 * constructor
 * @param {*} options 
 */
const EasyGif = {
    decoder: function (arrayBuffer) {
        return new GIFuctJS(arrayBuffer);
    },
    encoder: function (options) {
        return new GIF(options);
    }
};
export default EasyGif;