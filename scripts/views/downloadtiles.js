/**
 * Created by qingbiao on 2015/3/6.
 */
(function(){
    var path = require("path");
    var fs = require("fs");
    var http = require("http");
    var url = require("url");

    CT.DownloadTiles = function(){

    }

    CT.DownloadTiles.prototype = {
        id: "DownloadTiles",

        ele: null,

        /**
         * 是否创建
         */
        _created: false,

        /**
         * 初始化
         */
        init: function(){
            this.ele = $("#"+this.id);
        },

        /**
         * 开始
         */
        startRender: function(){
            this.ele.show();
            if(!this._created){
                this._create();
                this._created = true;
            }
        },

        /**
         * 结束
         */
        stopRender: function(){
            this.ele.hide();
        },

        _create: function(){
            this._createLayout();
        },

        _createLayout: function(){
            this.ele.append('<div class="client" style="height: 400px; padding: 50px;">\
                <div class="form_row">\
                    <label>四至范围：</label>\
                    <input id="dts_extent" value="-180,-90,180,90">\
                </div>\
                <div class="form_row">\
                    <label>切片层级：</label>\
                    <input id="dts_startzoom" value="0" style="width: 145px;">~<input id="dts_endzoom" value="1" style="width: 145px;">\
                </div>\
                <div class="form_row">\
                    <label>存放路径：</label>\
                    <input id="dts_dir" ><input type="file" nwdirectory title="请选择存放路径" id="dts_pathhelper">\
                </div>\
                <div class="form_row">\
                    <label>数据服务：</label>\
                    <select id="dts_server">\
                        <option value="googleMap:vector">谷歌地图(矢量)</option>\
                        <option value="googleMap:raster">谷歌地图(影像)</option>\
                        <option value="bingMap:vector">必应地图(矢量)</option>\
                        <option value="bingMap:raster">必应地图(影像)</option>\
                        <option value="tianditu:vector">天地图(矢量)</option>\
                        <option value="tianditu:raster">天地图(影像)</option>\
                    </select>\
                </div>\
                <div class="form_row">\
                    <a href="javascript:void(0);" id="service_tile_start" class="start_bt icon_start">开始</a>\
                    <a href="javascript:void(0);" id="service_tile_cancle" class="icon_cancle">取消</a>\
                </div>\
            </div>');
            var scope = this;

            $("#dts_server", this.ele).combobox({
                width: 300
            });

            $("#dts_pathhelper", this.ele).change(function(){
                $("#dts_dir", scope.ele).val($(this).val());
            });

            $(".start_bt", this.ele).bind("click", function(){
                scope.start();
            });
        },

        /**
         * 开始下载
         */
        start: function(){
            var extent = $("#dts_extent", this.ele).val();
            extent = extent.trim() == "" ? null : extent.split(",");
            var server_args = $("#dts_server", this.ele).combobox("getValue").split(":");
            var dts_server = server_args.splice(0,1);
            var params = {
                dts_extent: extent,
                dts_startzoom: Number($("#dts_startzoom", this.ele).val()),
                dts_endzoom: Number($("#dts_endzoom", this.ele).val()),
                dts_dir: $("#dts_dir", this.ele).val(),
                dts_server: dts_server
            };

            var server = TileServer.factory(params.dts_server);

            var tiles = server.buildDownloadTiles(params);
            var tileset = new TileSet(tiles);

            this.download(tileset, server, server_args, params);
        },

        download: function(tileset, server, server_args, params){
            if(tileset.hasNext()){
                var tileobj = tileset.next();
                var imageUrl = server.buildURL(tileobj[0], tileobj[1], tileobj[2], server_args);
                var fileURI = server.buildFileURI(params.dts_dir, tileobj[0]+"", tileobj[1]+"", tileobj[2]+"", server.getExt());
                if(fs.existsSync(fileURI)){
                    this.download(tileset, server, server_args, params);
                    return false;
                }
                CT.mkdirSync(path.dirname(fileURI));

                var scope = this;
                var url = imageUrl;
                if(server.getRequestOptions){
                    url = server.getRequestOptions(imageUrl);
                }
                http.get(url, function(res) {
                    var file = fs.createWriteStream(fileURI);
                    res.on('data', function(data) {
                        file.write(data);
                    }).on('end', function() {
                        file.end();
                        scope.download(tileset, server, server_args, params);
                    });
                }).on('error', function(e) {
                    scope.download(tileset, server, server_args, params);
                });
            }
        }
    }

    var TileSet = function(tiles){
        this.tiles = tiles;
        this.length = tiles.length;

        this.index = -1;
    }

    TileSet.prototype = {
        next: function(){
            this.index ++;
            return this.current();
        },

        hasNext: function(){
            return !(this.tiles[this.index+1] == undefined);
        },

        current: function(){
            return this.tiles[this.index];
        }
    }

    var inherits = require("util").inherits;
    var TileServer = function(){}

    TileServer.prototype = {
        tsize: 180,
        yxratio: 2,
        buildFileURI: function(dir, x, y, z, ext){
            return dir + "/" + z + "/" + y + "/" + x+ext;
        },

        getExt: function(){
            return this.ext || ".png";
        },

        buildDownloadTiles: function(params){
            var minz = params.dts_startzoom,maxz = params.dts_endzoom;
            var bounds = params.dts_extent;
            bounds = bounds.map(function(side){
                return Number(side);
            });
            var tsize = this.tsize;
            var zoomdata = {}
            var tiles = [];
            for(var i = minz; i < maxz; i++){
                var res = tsize / Math.pow(2, i);
                var minx = parseInt((bounds[0] + 180) / res);
                var maxx = (bounds[2] + 180) / res;
                maxx = (maxx == parseInt(maxx)) ? maxx - 1 : maxx;

                var miny = parseInt((90 - bounds[3])/res);
                var maxy = (90 - bounds[1])/res*this.yxratio;
                maxy = (maxy == parseInt(maxy)) ? maxy - 1 : maxy;

                zoomdata[i] = {
                    minx: minx,
                    maxx: maxx,
                    miny: miny,
                    maxy: maxy
                };
            }

            for(var zoom in zoomdata){
                var zoommeta = zoomdata[zoom];
                for(var y = zoommeta.miny; y <= zoommeta.maxy; y++){
                    for(var x = zoommeta.minx; x <= zoommeta.maxx; x++){
                        tiles.push([x, y, zoom]);
                    }
                }
            }

            return tiles;
        }
    };

    TileServer.factory = function(type){
        if(typeof TileServer[type] !== 'function'){
            throw {
                name: "No Factory Error",
                message: type +"不存在"
            }
        }

        return new TileServer[type]();
    }

    TileServer.bingMap = function(){
        this.ext = ".png";
    }

    inherits(TileServer.bingMap, TileServer);

    TileServer.bingMap.prototype.tileXYToQuadKey = function(x, y, level){
        var quadkey = '';
        for ( var i = level; i >= 0; --i) {
            var bitmask = 1 << i;
            var digit = 0;

            if ((x & bitmask) !== 0) {
                digit |= 1;
            }

            if ((y & bitmask) !== 0) {
                digit |= 2;
            }

            quadkey += digit;
        }
        return quadkey;
    };

    TileServer.bingMap.prototype.buildURL = function(x, y, z, type){
        var host = "";
        if(type[0] == "raster"){
            host = "http://{subdomain}.tiles.ditu.live.com/tiles/a{quadkey}.jpeg?g=3308";
            this.ext = ".jpeg";
        }
        if(type[0] == "vector"){
            host = "http://{subdomain}.tiles.ditu.live.com/tiles/r{quadkey}.png?g=3308&mkt=zh-cn&n=z";
            this.ext = ".png";
        }

        if(!host){
            host = "http://{subdomain}.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=3308";
        }

        var quadkey = this.tileXYToQuadKey(x, y, z);
        imageUrl = host.replace('{quadkey}', quadkey);
        var subdomains = ["t0", "t1", "t2", "t3"];
        var subdomainIndex = (x + y + z) % subdomains.length;
        imageUrl = imageUrl.replace('{subdomain}', subdomains[subdomainIndex]);
        return imageUrl;
    }

    TileServer.googleMap = function(){
        this.ext = ".png";
        this.tsize = 360;
    }

    inherits(TileServer.googleMap, TileServer);

    TileServer.googleMap.prototype.buildURL = function(x, y, z, type){
        var host = "";
        if(type[0] == "raster"){
            host = "http://mt0.google.cn/vt?lyrs=s@167&hl=zh-CN&gl=CN&x={x}&y={y}&z={z}";
            this.ext = ".jpeg";
        }
        if(type[0] == "vector"){
            host = "http://mt0.google.cn/vt?hl=zh-CN&gl=CN&x={x}&y={y}&z={z}";
            this.ext = ".png";
        }

        host = host.replace('{x}',x).replace('{y}',y).replace('{z}',z);
        return host;
    }

    TileServer.googleMap.prototype.getRequestOptions = function(imgurl){
        var tilepath = url.parse(imgurl);
        return {
            headers: {
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Encoding":"gzip, deflate, sdch",
                "Accept-Language": "zh-CN,zh;q=0.8",
                "Cache-Control": "max-age=0",
                "Connection": "keep-alive",
                Cookie:"NID=67=MrQZjJZZJxoMj6WshJ2wrRAcGzmTYotTJUPoWFwGMB5LZX5Nacxj_FRKsHyHB2yRIoWq4jZLRwdeNcJQPcJcC1WDFK-87R7HoTqw7pAehS9fnTLK_EPhvBlbasGGJZLB; PREF=ID=233e08144b2229a9:U=ebd39392f1a7c4b0:FF=0:NW=1:TM=1425699428:LM=1425699428:S=oi2FQ4UxxqvJ5UMq",
                "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
                "X-Client-Data": "CIm2yQEIpbbJAQiptskBCMG2yQEInobKAQjqiMoB"
            },
            host: tilepath.hostname,
            path: tilepath.path
        }
    }


    TileServer.tianditu = function(){
        this.ext = ".png";
        this.tsize = 90;
        this.yxratio = 1;
    }

    inherits(TileServer.tianditu, TileServer);

    TileServer.tianditu.prototype.buildURL = function(x, y, z, type){
        var host = "";
        if(type[0] == "raster"){
            host = "http://t{t}.tianditu.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles";
            this.ext = ".jpeg";
        }
        if(type[0] == "vector"){
            host = "http://t{t}.tianditu.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=c&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles";
            this.ext = ".png";
        }
        var t = x % 7;
        host = host.replace('{x}',x).replace('{y}',y).replace('{z}',Number(z)+2).replace('{t}',t);
        console.log(host);
        return host;
    }
})();