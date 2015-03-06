/**
 * Created by qingbiao on 2014/9/27.
 */
(function(){
    var fs = require('fs');
    var path = require('path');
    var spawn = require('child_process').spawn;
    var cwd = process.cwd();
    var exepath = cwd + "/plugins/pngquant.exe";
    var jpegexepath = cwd + "/plugins/jpeg-recompress.exe";

    CT.ImageCompress = function(options){

    }

    CT.ImageCompress.prototype = {
        /**
         * 插件id
         */
        id: "ImageCompress",
        /**
         * 是否创建
         */
        _created: false,
        /**
         * 正在压缩状态
         */
        runing: false,
        /**
         * 压缩比
         */
        compression: 1,

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

        /**
         * 创建
         * @private
         */
        _create: function(){
            this._dolayout();
        },

        _dolayout: function(){
            this.ele.append('<div class="client menu_toolbar" style="height: 35px;">' +
                '<span id="icsf"></span><span class="menu_bt sourceFolder" title="添加文件夹"></span>' +
                '<span class="menu_bt start_compress" title="开始压缩"></span>' +
                '</div>' +
                '<div class="client" style="top: 35px; overflow: auto;">' +
                    '<div id="icprogress" style="height: 25px; cursor: default;" class="task_progress_bar">' +
                        '<span class="task_progress_innerbar"></span>' +
                    '</div>'+
                    '<div id="icchart" class="client" style="top: 35px;"></div>' +
                '</div>');

            var scope = this;
            $(".sourceFolder", this.ele).bind("click", function(){
                if(!$("#sourceFolder_helper").length){
                    $("body").append('<input type="file" id="sourceFolder_helper" nwdirectory style="display: none;">');

                    $("#sourceFolder_helper").change(function(){
                        var sourcedir = $(this).val();
                        $("#icsf", scope.ele).html(sourcedir);
                    });
                }

                $("#sourceFolder_helper").click();
            });

            $(".start_compress", this.ele).bind("click", function(){
                var sourcedir = $("#icsf", scope.ele).html();
                if(sourcedir) {
                    var rets = scope.loadFiles(sourcedir);
                    scope.runing = true;
                    scope._initChart();
                    scope.compressImages(rets.files);
                }
            });
        },

        loadFiles: function(sourcedir){
            var ret = {
                files: []
            };
            var scope = this;
            function iterator(url){
                var stat = fs.statSync(url);
                if(stat.isDirectory()){
                    inner(url);
                }else if(stat.isFile()){
                    var file = {
                        name: path.basename(url),
                        ext: path.extname(url),
                        size: stat.size,
                        dir: path.dirname(url),
                        path: url
                    };
                    ret.files.push(file);
                }
            }
            function inner(path){
                var arr = fs.readdirSync(path);
                for(var i = 0, el ; el = arr[i++];){
                    iterator(path+"/"+el);
                }

            }
            iterator(sourcedir);

            return ret;
        },

        _initChart: function(){
            Highcharts.setOptions({
                global: {
                    useUTC: false
                }
            });

            var scope = this;
            var options = {
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg,
                    marginRight: 10,
                    events: {
                        load: function() {
                            var series = this.series[0];
                            setInterval(function() {
                                if(scope.runing){
                                    var x = (new Date()).getTime(),
                                        y = scope.getCompression();
                                    series.addPoint([x, y], true, true);
                                }
                            }, 1000);
                        }
                    }
                },
                title: {
                    text: '数据压缩比'
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: {
                        text: '压缩比'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                tooltip: {
                    formatter: function() {
                        return '<b>'+ this.series.name +'</b><br>'+Highcharts.numberFormat(this.y*100, 2)+'%';
                    }
                },
                legend: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: '图片压缩比',
                    data: (function() {
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -19; i <= 0; i++) {
                            data.push({
                                x: time + i * 1000,
                                y: 1
                            });
                        }
                        return data;
                    })()
                }]
            };

            $('#icchart', this.ele).highcharts(options);
        },

        getCompression: function(){
            return this.compression;
        },

        /**
         * 压缩图片
         * @param files
         */
        compressImages: function(files){
            if(files){
                var allsize = 0;
                files.forEach(function(file){
                    allsize += file.size;
                }, this);
                //console.log(files);
                this._doCompressImages(files, 0, allsize, allsize);
            }
        },

        _doCompressImages: function(files, index, allsize, remaind){
            var file = files[index];
            console.log(files.length, index, file);
            if(file) {
                if(file.ext == ".png"){
                    this._doCompressPng(file, function (reducesize) {
                        if(reducesize) {
                            remaind = remaind - reducesize;
                            this.compression = remaind / allsize;
                            this.setProgrees((index+1)/files.length);
                        }
                        this._doCompressImages(files, index+1, allsize, remaind);
                    }, this);
                }
                if(file.ext == ".jpg"){
                    this._doCompressJpeg(file, function (reducesize) {
                        if(reducesize) {
                            remaind = remaind - reducesize;
                            this.compression = remaind / allsize;
                            this.setProgrees((index+1)/files.length);
                        }
                        this._doCompressImages(files, index+1, allsize, remaind);
                    }, this);
                }

            }else{
                this.runing = false;
                $.messager.alert("提示","该路径下的图片已经压缩完成");
            }
        },

        /**
         *
         * @param file
         */
        _doCompressPng: function(file, cback, scope){
            var ret = [];
            var len = 0;
            var args = ['--speed','11','--ext',file.ext,'--force','--quality','50-70',file.path];
            var cp = spawn(exepath, args);
            cp.on('error', function (err) {
                console.log(err);
                cback ? cback.call(scope, null) : false;
            });
            cp.on('close', function (code) {
                var stat = fs.statSync(file.path);
                cback ? cback.call(scope, file.size-stat.size) : false;
            });
        },

        /**
         *
         * @param file
         * @param cback
         * @param scope
         * @private
         */
        _doCompressJpeg: function(file, cback, scope){
            var ret = [];
            var len = 0;
            var args = ['-q','low','-n','20','-m','smallfry',file.path,file.path];
            var cp = spawn(jpegexepath, args);
            cp.on('error', function (err) {
                console.log(err);
                cback ? cback.call(scope, null) : false;
            });
            cp.on('close', function (code) {
                var stat = fs.statSync(file.path);
                console.log(file.size,stat.size);
                cback ? cback.call(scope, file.size-stat.size) : false;
            });
        },

        /**
         * 设置进度
         * @param ele
         * @param layer
         * @param percent
         */
        setProgrees: function(percent){
            var left = (percent - 1) * 100 + "%";
            $(".task_progress_innerbar", this.ele).css("left", left);
        }
    }
})();