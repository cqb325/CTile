/**
 * Created by qingbiao on 2014/9/21.
 */
(function() {
    var path = require('path');
    var fs = require('fs');
    CT.TilePreview = function () {

    }

    CT.TilePreview.prototype = {
        id: "TilePreview",
        layers: null,

        _created: false,

        server: null,

        /**
         * 初始化
         */
        init: function () {
            this.ele = $("#" + this.id);
            this.layers = {};
        },

        /**
         * 开始
         */
        startRender: function () {
            this.ele.show();
            if (!this._created) {
                this._create();
                this._created = true;
            }

            var ele = $(".layers_list", this.ele);
            ele.empty();
            this.getStoredServiceTileLayers();
            this.getStoredImgTileLayers();
        },

        /**
         * 结束
         */
        stopRender: function(){
            this.ele.hide();
        },

        _create: function () {
            this._createLayout();
            this.server = new CT.Service();
        },

        _createLayout: function(){
            this.ele.append('<div class="client" id="mapwrap">' +
                '<div class="layerprevcontrol title="图层列表"></div>'+
                '<div class="layers_list">' +
                '</div>' +
                '</div>');

            var scope = this;
            $(".layerprevcontrol", this.ele).bind("click", function(){
                var ele = $(".layers_list", scope.ele);
                if(ele.is(":visible")){
                    ele.slideUp();
                }else{
                    ele.slideDown();
                }
            });
        },

        /**
         * 获取存储的图层
         */
        getStoredServiceTileLayers: function(){
            var dirpath = path.dirname(process.execPath)+CT.LAYERSPATH;
            var scope = this;
            if(fs.existsSync(dirpath)){
                fs.readdir(dirpath, function(err, files){
                    var layers = {};
                    files.forEach(function(file){
                        var ext = path.extname(file);
                        if(ext == ".st") {
                            var data = fs.readFileSync(dirpath + "/" + file, "UTF-8");
                            var layer = JSON.parse(data);
                            layers[layer.id] = layer;
                        }
                    });

                    scope.listLayers(layers);
                });
            }
        },

        /**
         *
         * @param layers
         */
        listLayers: function(layers, type){
            for(var id in layers){
                var layer = layers[id];
                this.appendLayer(layer, type);
            }
        },

        /**
         *
         * @param layer
         */
        appendLayer: function(layer, type){
            var ele = $(".layers_list", this.ele);
            var row = $(".layer_list_row:last", ele);
            var isnewrow = row.length ? (row.children().length % 4 == 0) : true;
            if(isnewrow){
                row = $('<div class="layer_list_row"></div>');
                ele.append(row);
            }
            var icon = "icon_server_tile";
            if(type == "raster"){
                icon = "icon_raster";
            }
            row.append('<div class="layer_item">' +
                '<div class="ct_icon '+icon+'"></div>'+
                '<div class="layer_name" title="songshsongsh">'+layer.name+'</div>'+
                '</div>');


            //this.layers[layer.id] = layer;
            var scope = this;
            $(".layer_item", row).bind("click", function(){
                if(!$(this).hasClass("active")) {
                    $(".layer_item.active", row).removeClass("active");
                    $(this).addClass("active");

                    scope.previewMap(layer);
                }
            });
        },

        /**
         * 获取存储的图层
         */
        getStoredImgTileLayers: function(){
            var dirpath = path.dirname(process.execPath)+CT.LAYERSPATH;
            var scope = this;
            if(fs.existsSync(dirpath)){
                fs.readdir(dirpath, function(err, files){
                    var layers = {};
                    files.forEach(function(file){
                        var ext = path.extname(file);
                        if(ext == ".lt") {
                            var data = fs.readFileSync(dirpath + "/" + file, "UTF-8");
                            var layer = JSON.parse(data);
                            layers[layer.id] = layer;
                        }
                    });

                    scope.listLayers(layers, "raster");
                });
            }
        },

        /**
         * 预览地图
         * @param layer
         */
        previewMap: function(layer){
            if(this.map){
                this.map.destroy();
            }
            this.server.setLayer(layer);

            OpenLayers.Map.TILE_WIDTH = layer.width;
            OpenLayers.Map.TILE_HEIGHT = layer.height;

            var bounds = OpenLayers.Bounds.fromString(layer.bounds);
            var resolutions = layer.resolutions;
            if(!resolutions){
                resolutions = this.getResolutionsByScales(layer.scales, layer.srs);
            }
            this.map = new OpenLayers.Map("mapwrap",{
                resolutions: resolutions,
                maxExtent: bounds,
                numZoomLevels: layer.endzoom+1,
                tileSize: new OpenLayers.Size(layer.width, layer.height)
            });

            var url = "http://127.0.0.1:8415/";
            var olayer;
            if(layer.protocal == CT.PROTOCAL.TMS) {
                olayer = new OpenLayers.Layer.TMS(layer.name, url, {
                    imgFormat: 'png',
                    zoomLevels: layer.endzoom + 1,
                    islefttop: layer.lefttop
                });
            }
            if(layer.protocal == CT.PROTOCAL.WMTS){
                url += "wmts";
                var matrixIds = [];
                for(var i = 0; i <= layer.endzoom; i++){
                    matrixIds.push(layer.gsname+":"+i);
                }
                olayer = new OpenLayers.Layer.WMTS({
                    layer: layer.name,
                    url: url,
                    style: 'default',
                    matrixSet: layer.gsname,
                    format: layer.format,
                    isOriginLeftTop: layer.lefttop,
                    matrixIds: matrixIds
                });
            }
            this.map.addLayer(olayer);
            this.map.zoomToExtent(bounds);
        },

        /**
         *
         * @param scales
         */
        getResolutionsByScales: function(scales, srs){
            var resolutions = scales.map(function(scale){
                return this.getResolutionFromScale(scale, srs);
            }, this);

            return resolutions;
        },

        /**
         * 根据比例尺获取分辨率
         * @param scale
         * @returns {number}
         */
        getResolutionFromScale: function(scale, srs){
            var unit = 0;
            if(srs.indexOf("4326") != -1){
                unit = CT.DEGREE_PER_INCHE;
            }else{
                unit = CT.METERS_PER_INCHE;
            }

            return scale / unit / CT.DOTS_PER_INCHE;
        }
    }
})();