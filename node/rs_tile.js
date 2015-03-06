/**
 * Created by cqb on 2015/1/7.
 */

var fs = require("fs"),path = require("path");
var RasterTile = require("./RasterTile");

var params = {};
if(process.argv.length % 2 != 0){
    throw "命令行参数不对!";
}
process.argv.forEach(function (val, index, array) {
    if(index == 0){
        return ;
    }
    if(index % 2 == 0) {
        params[val.replace("-","")] = array[index+1];
    }
});


getLayerInfo(params);

function getLayerInfo(params){
    if(fs.existsSync(params.layer)){
        var data = fs.readFileSync(params.layer, "UTF-8");
        var layer = JSON.parse(data);
        layer.finished = getLayerFinishedNum(params.finished);

        start(params, layer);
    }
}

function getLayerFinishedNum(filepath){
    if(fs.existsSync(filepath)){
        var ret = fs.readFileSync(filepath, "UTF-8");
        if(ret) {
            return parseInt(ret);
        }else{
            return 0;
        }
    }
    return 0;
}

function start(params, layer){
    var tile = new RasterTile(params.layer, params.finished, layer);
    tile.start();
}