/**
 * Created by cqb on 2015/1/7.
 */

var jsts = require("jsts");
var wktreader = new jsts.io.WKTReader();
var edge = require("edge");
var fs = require("fs");
var DOTS_PER_INCHE = 90.71428571428571;
var METERS_PER_INCHE = 1 / 0.0254;
var DEGREE_PER_INCHE = 4382657.117845413;

var gdalTiles = edge.func(function () {/*
 #r "C:\\GDAL\\bin\\CQB.GDALTILES.dll"

 using CQB.GDALTILES;
 using System;
 using System.Threading.Tasks;

 public class Startup
 {
     public async Task<object> Invoke(dynamic input)
     {
         GDALTiles gdaltiles = new GDALTiles(input);
         return (Func<object,Task<object>>)(async (i) => { return gdaltiles.writeTiles(i); });
     }
 }
 */});

var RasterTile = module.exports = function(layerfile, finishedfile, params){
    this._init(layerfile, finishedfile, params);
}

function __extend(obj, source){
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

RasterTile.prototype = {
    /**
     * 参数选项
     */
    options: null,
    /**
     * 所有切片信息
     */
    tileSet: null,
    /**
     * 切片总数
     */
    total: 0,
    /**
     * 完成的个数
     */
    finished: -1,

    layerfile: null,

    finishedfile: null,

    writeTile: null,

    /**
     * 初始化
     * @param options
     * @private
     */
    _init: function (layerfile, finishedfile, options) {
        this.layerfile = layerfile;
        this.finishedfile = finishedfile;
        __extend(this, options);
        this.options = options;

        this.tileSet = [];
        if (this.wkt) {
            this.wrapgeometry = this.buildGeometry(this.wkt);
        }

//        this.options.log = function (obj) {
//            console.log("log: "+obj);
//        };

        var scope = this;
//        this.options.updateProcess = function (finished) {
//            scope.updateProcess(finished);
//        };
    },

    buildGeometry: function(wkt){
        var wkts = wkt.split(/\#/g);
        var geometry = null;
        wkts.forEach(function(awkt){
            var geom = wktreader.read(awkt);
            if(!geometry){
                geometry = geom;
            }else{
                geometry = geometry.union(geom);
            }
        });

        return geometry;
    },

    updateProcess: function(finished){
        this.options.finished = finished;
        console.log("---> "+finished);
//        var file = fs.createWriteStream(this.finishedfile);
//        file.end(finished+"");
    },

    start: function(){
        if(!this.options.tileSet){
            this.total = this.getTotalTiles();
            this.options.total = this.total;
            this.options.tileSet = this.tileSet;

            this.storeLayerInfo(this.options);
        }
        console.log("total tiles: "+this.total);

        this.writeTile = gdalTiles(this.options, true);
        this._goNext();
    },

    _goNext: function(){
        var finished = this.writeTile({}, true);
        this.updateProcess(finished);
        if(finished < this.total-1){
            this._goNext();
        }
    },

    /**
     * 计算所有的切片
     * @returns {number}
     */
    getTotalTiles: function(){
        var num = 0;
        var zoomdata = {};
        for(var i = this.startzoom; i <= this.endzoom; i++){
            var res = this.getResolution(i);
            var wres = res * this.width;

            var bounds = this.bounds.split(",");
            var xw = bounds[2] - bounds[0];
            var maxx = Math.ceil(xw / wres);

            var yh = bounds[3] - bounds[1];
            var maxy = Math.ceil(yh / wres);

            num += maxx * maxy;
            zoomdata[i] = {
                minx: 0,
                maxx: maxx,
                miny: 0,
                maxy: maxy
            }
        }

        this.tileSet = [];
        for(var zoom in zoomdata){
            var zoommeta = zoomdata[zoom];
            for(var y = zoommeta.miny; y < zoommeta.maxy; y++){
                for(var x = zoommeta.minx; x < zoommeta.maxx; x++){
                    var tilebounds = this.getTileBounds(x, y, zoom);
                    if(this.needDownload(tilebounds)) {
                        this.tileSet.push([parseInt(zoom), y, x, tilebounds]);
                    }
                }
            }
        }
        return this.tileSet.length;
    },

    /**
     * 四至
     * @param x
     * @param y
     * @param z
     * @returns {string}
     */
    getTileBounds: function(x, y, z){
        var bounds = this.bounds.split(",");
        var res = this.getResolution(z);
        var left = parseFloat(bounds[0]) + x * res * this.width;
        var right = left + res * this.width;

        var bottom,top;
        if(this.lefttop) {
            top = parseFloat(bounds[3]) - y * res * this.height;
            bottom = top - res * this.width;
        }else{
            bottom = parseFloat(bounds[1]) + y * res * this.height;
            top = bottom + res * this.width;
        }

        return left+","+bottom+","+right+","+top;
    },

    /**
     * 是否需要下载该切片
     * @param bounds
     */
    needDownload: function(bounds){
        var need = true;
        if(this.wrapgeometry) {
            var polygon = this.getTileExtent(bounds);
            return this.wrapgeometry.intersects(polygon);
        }
        return need;
    },

    /**
     * 获取切片矩形
     * @param abounds
     * @returns {*}
     */
    getTileExtent: function(abounds){
        var bounds = abounds.split(",");
        var left = parseFloat(bounds[0]);
        var bottom = parseFloat(bounds[1]);
        var right = parseFloat(bounds[2]);
        var top = parseFloat(bounds[3]);

        var lt = left +" "+top;
        var lb = left +" "+bottom;
        var rt = right +" "+top;
        var rb = right +" "+bottom;

        var polygon = "POLYGON(("+lt+","+lb+","+rb+","+rt+","+lt+"))";
        return wktreader.read(polygon);
    },

    /**
     * 获取分辨率
     * @param zoom
     */
    getResolution: function(zoom){
        var res = null;
        if(this.resolutions){
            res = this.resolutions[zoom];
        }
        if(this.scales){
            var scale = this.scales[zoom];
            res = this.getResolutionFromScale(scale);
        }

        return res;
    },

    /**
     *
     * @param scale
     */
    getResolutionFromScale: function(scale){
        var unit = 0;
        if(this.srs.indexOf("4326") != -1){
            unit = DEGREE_PER_INCHE;
        }else{
            unit = METERS_PER_INCHE;
        }

        return scale / unit / DOTS_PER_INCHE;
    },

    /**
     * 存储图层信息
     */
    storeLayerInfo: function(params){
        var jsonString = JSON.stringify(params);
        var name = params.name;
        var file = fs.createWriteStream(this.layerfile);
        file.end(jsonString);
    }
}