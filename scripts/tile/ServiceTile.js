/**
 * Created by cqb on 2014/9/3.
 * 服务切片
 */
(function(){
    var fs = require("fs");
    var http = require("http");
    var path = require("path");
    var jsts = require("jsts");
    var wktreader = new jsts.io.WKTReader();

    CT.ServiceTileUtil = function(params){
        this._init(params);
    }

    CT.ServiceTileUtil.prototype = {
        pointer: null,

        pathname: null,

        finished: 0,

        maxthreed: 10,

        locked: false,

        tileSet: null,

        options: null,

        _init: function(options){
            CT.extend(this, options);
            this.options = options;

            this.tileSet = [];
            if(this.wkt) {
                this.wrapgeometry = this.buildGeometry(this.wkt);
            }

            this.total = this.getTotalTiles();
            this.options.total = this.total;
            console.log("total tiles: "+this.total);
            this.pointer = this.finished-1;
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
         * 开始
         */
        start: function(){
            this.locked = false;
            for(var i = 0; i<this.maxthreed; i++) {
                var newpointer = this.getNextPointerTile();
                this.startThreed(newpointer);
            }
        },

        startThreed: function(pointer){
            if(this.finished == this.total){
                if(this.cc) {
                    this.cc.exit();
                }
                console.log("end .................");
                return;
            }
            this.finished ++;
            if(this.finished <= this.total){
                if(pointer) {
                    this.downloadTile(pointer, function () {
                        this.options.finished = this.finished;
                        this._onUpdateProcess(this.finished);
                        //锁住，暂停
                        if(this.locked){
                            return;
                        }
                        var newpointer = this.getNextPointerTile();
                        this.startThreed(newpointer);
                    }, this);
                }
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
                        this.tileSet.push([zoom, y, x, false]);
                    }
                }
            }
            return num;
        },

        /**
         * 下一个切片
         * @returns {*}
         */
        getNextPointerTile: function(){
            this.pointer ++;
            return this.tileSet[this.pointer];
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
         * 下载切片
         * @param pointer
         */
        downloadTile: function(pointer, cback, scope){
            //判断是否需要下载该切片
            if (this.needDownload(pointer)) {
                this._downloadTile(pointer, function(){
                    cback.call(scope, null);
                }, this);
            } else {
                cback.call(scope, null);
            }
        },

        /**
         * 从服务器中下载切片
         * @param pointer
         * @param cback
         * @param scope
         * @private
         */
        _downloadTile: function(pointer, cback, scope){
            var x = pointer[2],y = pointer[1], z = pointer[0];
            var url = this.getURL(x, y ,z);
            var tilepath = this.getTilePath(x, y, z);
            if(fs.existsSync(tilepath)){
                cback.call(scope, null);
                return false;
            }

            http.get(url, function(res) {
                CT.mkdirSync(path.dirname(tilepath));
                var file = fs.createWriteStream(tilepath);
                res.on('data', function(data) {
                    file.write(data);
                }).on('end', function() {
                    file.end();
                    pointer[3] = true;
                    cback.call(scope, null);
                });
            }).on('error', function(e) {
                cback.call(scope, null);
            });
        },

        /**
         * 是否需要下载该切片
         * @param pointer
         */
        needDownload: function(pointer){
            var need = true;
            if(pointer[3]){
                return false;
            }
            if(this.wrapgeometry) {
                var polygon = this.getTileExtent(pointer[2], pointer[1], pointer[0]);
                return this.wrapgeometry.intersects(polygon);
            }
            return need;
        },

        /**
         * 获取切片的四至
         * @param x
         * @param y
         * @param z
         * @returns {*}
         */
        getTileExtent: function(x, y, z){
            var bounds = this.getTileBounds(x, y, z);
            bounds = bounds.split(",");
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
         * 获取切片地址
         * @param x
         * @param y
         * @param z
         */
        getURL: function(x, y, z){
            if(!this.pathname) {
                this.host.indexOf("?") == -1 ? this.host = this.host + "?" : false;
                var url = this.host + "TRANSPARENT=true&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage";
                url += "&LAYERS=" + this.layers;
                url += "&FORMAT=" + this.format;
                url += "&SRS=" + this.srs;
                url += "&WIDTH=" + this.width;
                url += "&HEIGHT=" + this.height;
                this.pathname = url;
            }
            var bbox = this.getTileBounds(x, y, z);
            var tileurl = this.pathname + "&BBOX="+bbox;
            return tileurl;
        },

        /**
         * 存放地址
         * @param x
         * @param y
         * @param z
         */
        getTilePath: function(x, y, z){
            var ext = CT.FROMATEXTS[this.format];
            var despath = "";
            if(this.protocal == CT.PROTOCAL.TMS) {
                despath = this.dir + "/" + this.name + "/" + z + "/" + y + "/" + y+"_"+x+ext;
            }
            if(this.protocal == CT.PROTOCAL.WMTS){
                var level = z < 10 ? this.gsname + "_0" + z : this.gsname+"_"+z;
                var shift = z / 2;
                var half = 2 << shift;
                var digits = 1;
                if (half > 10){
                    digits = parseInt(Math.log(half)/Math.log(10)) + 1;
                }
                var halfx = this.zeroPadder(digits, parseInt(x / half));
                var halfy = this.zeroPadder(digits, parseInt(y / half));

                x = this.zeroPadder(2*digits, x);
                y = this.zeroPadder(2*digits, y);
                despath = this.dir + "/" + this.name + "/" + level + "/" + halfx+"_"+halfy + "/" + x+"_"+y+ext;
            }
            return despath;
        },

        /**
         * 行列前面加0
         * @param order
         * @param number
         */
        zeroPadder: function(order, number) {
            var numberOrder = 1;
            var prefix = "";
            if (number > 9) {
                if (number > 11) {
                    numberOrder = parseInt(Math.ceil(Math.log(number)/Math.log(10) - 0.001));
                } else {
                    numberOrder = 2;
                }
            }

            var diffOrder = order - numberOrder;

            if (diffOrder > 0) {
                while (diffOrder > 0) {
                    prefix += '0';
                    diffOrder--;
                }
                prefix += number;
            } else {
                prefix += number;
            }

            return prefix;
        },

        /**
         * 更新进度
         * @param num
         */
        _onUpdateProcess: function(num){
            var ret = {
                finished: num,
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

        pause: function(){
            this.locked = true;
        },

        getOptions: function(){
            return this.options;
        },

        /**
         * 重新设置任务的参数
         * @param options
         */
        setOptions: function(options){
            CT.extend(this, options);
            this.options = options;

            this.tileSet = [];
            if(this.wkt) {
                this.wrapgeometry = wktreader.read(this.wkt);
            }

            this.finished = 0;
            this.total = this.getTotalTiles();
            this.options.total = this.total;
            console.log("after reset total tiles: "+this.total);
            this.pointer = this.finished-1;
        }
    }
})();