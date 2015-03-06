/**
 * Created by qingbiao on 2014/9/13.
 */
(function(){
    var jsts = require("jsts");
    var wktreader = new jsts.io.WKTReader();
     var gdalTiles = edge.func(function () {/*
     #r "C:\\GDAL\\bin\\CQB.ReSample.dll"

     using CQB.GDALTiles;
     using System;
     using System.Threading.Tasks;

     public class Startup
     {
         public async Task<object> Invoke(dynamic input)
         {
            GDALTiles gdaltiles = new GDALTiles(input);
            gdaltiles.execute();
            return null;
         }
     }
     */});

    CT.RasterTile = function(params){
        this._init(params);
    }

    CT.RasterTile.prototype = {
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

        locked: false,

        /**
         * 初始化
         * @param options
         * @private
         */
        _init: function(options){
            CT.extend(this, options);
            this.options = options;

            this.tileSet = [];
            if(this.wkt) {
                this.wrapgeometry = this.buildGeometry(this.wkt);
            }

            this.options.log = function(obj){
                console.log(obj);
            }

            var scope = this;
            this.options.updateProcess = function(finished){
                scope.updateProcess(finished);
            };
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
                unit = CT.DEGREE_PER_INCHE;
            }else{
                unit = CT.METERS_PER_INCHE;
            }

            return scale / unit / CT.DOTS_PER_INCHE;
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

        updateProcess: function(finished){
            this.options.finished = finished;
            var ret = {
                finished: finished,
                total: this.total
            }
            this.onUpdateProcess(ret);
        },

        /**
         * 外部回调更新进度
         * @param ret
         */
        onUpdateProcess: function(ret){

        },

        start: function(){
            if(!this.options.tileSet){
                this.total = this.getTotalTiles();
                this.options.total = this.total;
                this.options.tileSet = this.tileSet;

                this.storeLayerInfo(this.options);
            }
            console.log("total tiles: "+this.total);

            gdalTiles(this.options, function(err, ret){
                console.log(err);
                console.log(ret);
            });
        },

        pause: function(){
            this.locked = true;
        },

        /**
         * 存储图层信息
         */
        storeLayerInfo: function(params){
            var jsonString = JSON.stringify(params);
            var name = params.name;
            var path = require("path"), fs = require("fs");
            var filepath = path.dirname(process.execPath)+CT.LAYERSPATH+"/"+name+".lt";
            CT.mkdirSync(path.dirname(filepath));
            var file = fs.createWriteStream(filepath);
            file.end(jsonString);
        },

        getOptions: function(){
            var ret = {};
            for(var i in this.options){
                var val = this.options[i];
                if(typeof val != 'function') {
                    ret[i] = val;
                }
            }
            delete ret["tileSet"];
            return ret;
        },

        /**
         * 设置参数
         */
        setOptions: function(options){
            CT.extend(this, options);
            CT.extend(this.options, options);

            this.tileSet = [];
            if(this.wkt) {
                this.wrapgeometry = wktreader.read(this.wkt);
            }

            this.options.tileSet = this.tileSet;
        }
    }
})();