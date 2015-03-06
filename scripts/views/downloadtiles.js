/**
 * Created by qingbiao on 2015/3/6.
 */
(function(){
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
                    <input id="dts_extent">\
                </div>\
                <div class="form_row">\
                    <label>切片层级：</label>\
                    <input id="dts_startzoom" value="0" style="width: 145px;">~<input id="dts_endzoom" value="1" style="width: 145px;">\
                </div>\
                <div class="form_row">\
                    <label>数据服务：</label>\
                    <select id="dts_server">\
                        <option value="">谷歌地图(矢量)</option>\
                        <option value="">谷歌地图(影像)</option>\
                        <option value="">必应地图(矢量)</option>\
                        <option value="">必应地图(影像)</option>\
                        <option value="">天地图(矢量)</option>\
                        <option value="">天地图(影像)</option>\
                    </select>\
                </div>\
            </div>');
        }
    }
})();