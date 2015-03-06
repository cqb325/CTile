/**
 * Created by cqb on 2014/9/2.
 */
var fs = require("fs");
window.CT = {};

/**
 * 对象扩展
 * @method extend
 * @param {Object} obj 进行扩展的对象
 * @param {Object} source	扩展来源
 * @return {Object} 扩展后的对象
 */
CT.extend = function(obj, source){
    if ( Object.keys ) {
        var keys = Object.keys( source||{} );
        for (var i = 0, il = keys.length; i < il; i++) {
            var prop = keys[i];
            Object.defineProperty( obj, prop, Object.getOwnPropertyDescriptor( source, prop ) );
        }
    } else {
        var safeHasOwnProperty = {}.hasOwnProperty;
        for ( var prop in source ) {
            if ( safeHasOwnProperty.call( source, prop ) ) {
                obj[prop] = source[prop];
            }
        }
    }
    return obj;
}

CT.UUID = function(){
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

CT.DateFormat = function(date, fmt){
    var o = {
        "M+" : date.getMonth()+1,                 //月份
        "d+" : date.getDate(),                    //日
        "h+" : date.getHours(),                   //小时
        "m+" : date.getMinutes(),                 //分
        "s+" : date.getSeconds(),                 //秒
        "q+" : Math.floor((date.getMonth()+3)/3), //季度
        "S"  : date.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};

CT.PROTOCAL = {
    TMS: "TMS",
    WMTS: "WMTS"
}

CT.FROMATEXTS = {
    "image/png" : ".png",
    "image/jpg" : ".jpg",
    "image/gif" : ".gif"
}

CT.mkdirSync = function(url,mode,cb){
    var path = require("path"), fs = require("fs"), arr = url.split("/");
    mode = mode || 0755;
    cb = cb || function(){};
    if(arr[0]==="."){
        arr.shift();
    }
    if(arr[0] == ".."){
        arr.splice(0,2,arr[0]+"/"+arr[1])
    }
    function inner(cur){
        if(!fs.existsSync(cur)){
            fs.mkdirSync(cur, mode)
        }
        if(arr.length){
            inner(cur + "/"+arr.shift());
        }else{
            cb();
        }
    }
    arr.length && inner(arr.shift());
}

var edge = require("edge");
CT.getWKTS = edge.func(function () {/*
     #r "C:\\GDAL\\bin\\CQB.ReadVector.dll"

     using CQB.ReadVector;
     using System.Threading.Tasks;

     public class Startup
     {
         public async Task<object> Invoke(dynamic input)
         {
             ReadVector readvector = new ReadVector((string)input.uri);
             return readvector.getWKTs();
         }
     }
 */});

/**
 * 删除目录或者文件
 */
CT.removeFiles = function(root, cb, end, err) {
    var ret = CT.calculateFiles(root);
    try {
        for(var k = 0; k < ret.files.length; k++){
            var url = ret.files[k];
            fs.unlinkSync(url);
            cb ? cb() : false;
        }
        for (var i = 0, el; el = ret.dirs[i++];) {
            fs.rmdirSync(el);
        }
        end ? end() : false;
    } catch (e) {
        err = err || function(){};
        e.code === "ENOENT" ? err(e) : false;
    }
};

/**
 * 计算目录下的所有目录和文件
 * @param root
 * @returns {{dirs: Array, files: Array}}
 */
CT.calculateFiles = function(root){
    var ret = {
        dirs: [],
        files: []
    };
    function iterator(url){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            ret.dirs.unshift(url);
            inner(url);
        }else if(stat.isFile()){
            ret.files.unshift(url);
        }
    }
    function inner(path){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el);
        }
    }
    iterator(root);

    return ret;
}

/**
 * 打开资源管理器路径
 * @param dirpath
 */
CT.openDir = function(dirpath){
    if(fs.existsSync(dirpath)){
        var fpath = require("path").normalize(dirpath);
        var cmd = "explorer /e,"+fpath;
        var child_process = require("child_process");
        var child = child_process.exec(cmd,function (error, stdout, stderr) {
        });
    }else{
        $.messager.alert("提示",dirpath+": 路径不存在");
    }
}

CT.DOTS_PER_INCHE = 90.71428571428571;
CT.METERS_PER_INCHE = 1 / 0.0254;
CT.DEGREE_PER_INCHE = 4382657.117845413;


CT.GRIDSETSPATH = "/ctile/gridsets";
CT.LAYERSPATH = "/ctile/layers";