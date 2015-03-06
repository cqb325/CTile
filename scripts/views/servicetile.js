/**
 * Created by lenovo on 2014/9/2.
 */
(function(){
    var fs = require("fs"),
        path = require('path');

    CT.ServiceTile = function(){

    }

    CT.ServiceTile.prototype = {
        /**
         * 插件id
         */
        id: "ServiceTileView",
        /**
         * 是否创建
         */
        _created: false,
        /**
         * 当前网格
         */
        currentGridSet: null,

        tasks: null,

        /**
         * 初始化
         */
        init: function(){
            this.ele = $("#"+this.id);
            this.tasks = {};
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

            $("#st_gsname", this.ele).combobox("reload");
        },

        /**
         * 结束
         */
        stopRender: function(){
            this.ele.hide();
        },

        _create: function(){
            this._createLayout();
            this.getStoredLayers();
        },

        /**
         * 布局
         * @private
         */
        _createLayout: function(){
            this.ele.append('<div class="client"></div>');

            this.ele.children("div").append('<div style="padding: 10px; width: 50%;" class="client">' +
                '<form class="data_form">'+
                '<input type="hidden" id="st_id">'+
                '<div class="form_row">' +
                    '<lable>切片名称:</lable><input id="st_name">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>服务地址:</lable><input id="st_host">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>选择图层:</lable><input id="st_layers">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>网格名称:</lable><select id="st_gsname"></select>' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>切片格式:</lable><select id="st_format">' +
                    '<option value="image/png">image/png</option>' +
                    '<option value="image/jpg">image/jpg</option>' +
                    '<option value="image/gif">image/gif</option>' +
                    '</select>' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>切片层级:</lable><input id="st_startzoom" value="0">~<input id="st_endzoom" value="1">' +
                '</div>'+
                '<div class="form_row" style="height: auto">' +
                    '<lable style="position: relative; top: -60px;">切片范围:</lable><textarea id="st_wkt"></textarea>' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable></lable><input id="st_import_wkt" type="button" value="导入shp范围"><input type="file" title="选择要导入的shp文件" id="st_importhelper" accept=".shp">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>存放路径:</lable><input id="st_path" value="D:\\Tiles"><input type="file" title="请选择存放路径" id="st_pathhelper" nwdirectory nwworkingdir="D:\\Tiles">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>切片线程:</lable><input id="st_thread" value="4">' +
                '</div>'+
                '<div class="form_row" style="padding-left: 50px; padding-top: 30px;">' +
                    '<a href="javascript:void(0);" id="service_tile_start" class="start_bt icon_start">开始</a>' +
                    '<a href="javascript:void(0);" id="service_tile_cancle" class="icon_cancle">取消</a>' +
                    '<a href="javascript:void(0);" id="load_layer_config" class="start_bt icon_layer_import">导入图层参数</a>' +
                '</div>'+
                '</form>'+
                '</div>' +
                '<div class="tasklist client" style="padding: 10px; float: left;">' +
//                    '<div class="task_item" data-id="">' +
//                        '<div class="task_progress">'+
//                            '<span class="ct_icon icon_server_tile"></span>' +
//                            '<div class="task_progress_bar">' +
//                                '<span class="task_name"> basemap </span>' +
//                                '<span class="task_progress_innerbar"></span>' +
//                            '</div>' +
//                            '<span class="task_control"></span>' +
//                            '<div class="task_progress_num">10.99%</div>' +
//                        '</div>'+
//                        '<div class="task_tools">' +
//                            '<div class="task_tool_item"><span class="ct_icon ct_icon_middle task_delete" title="删除"></span></div>' +
//                            '<div class="task_tool_item"><span class="ct_icon ct_icon_middle task_zip" title="压缩"></span></div>' +
//                        '</div>'+
//                    '</div>'+

                '</div>');

            var scope = this;
            $("#st_name", this.ele).blur(function(){
                scope.validateName();
            });
            $("#st_format", this.ele).combobox({
                width: 300
            });
            $("#st_thread", this.ele).numberspinner({
                min:1,
                max:10,
                width: 300
            });

            var loader = function(param,success,error){
                scope._getGridSets(function(gridSets){
                    this.gridSets = gridSets;
                    var rows = [];
                    for(var filename in gridSets){
                        var gridSet = gridSets[filename];
                        rows.push({
                            value: filename,
                            text: gridSet.name
                        });
                    }
                    success(rows);
                }, scope);
            }
            $("#st_gsname", this.ele).combobox({
                width: 300,
                loader: loader,
                onChange: function(val){
                    scope.selectGridSet(val);
                }
            });

            $("#st_host", this.ele).change(function(){
                var url = $(this).val();
                scope.parseCapabilities(url);
            });

            $("#service_tile_start", this.ele).bind("click", function(){
                scope.start();
            });

            $("#st_pathhelper", this.ele).change(function(){
                $("#st_path", scope.ele).val($(this).val());
            });

            $("#st_importhelper", this.ele).change(function(){
                var filepath = $(this).val();
                scope.parseShpFile(filepath);
            });
            var wkdir = path.dirname(process.execPath);
            var layerspath = path.join(wkdir, CT.LAYERSPATH);
            $("#load_layer_config", this.ele).append('<input type="file" id="load_layer_config_helper" nwworkingdir="'+layerspath+'" accept=".st">');
            $("#load_layer_config_helper", this.ele).change(function(){
                var layerpath = $(this).val();
                scope.loadLayerConfig(layerpath);
            });

            $(".task_progress_bar", this.ele).live("click", function(){
                var toolsele = $(this).parent().parent().children(".task_tools");
                if(toolsele.is(":hidden")){
                    $(".task_tools:visible", scope.ele).slideUp();
                    toolsele.slideDown();
                }else{
                    toolsele.slideUp();
                }
            });

            $(".task_delete", this.ele).live("click", function(){
                var $this = $(this);
                $.messager.confirm("提示", "确认删除该切片？", function(t){
                    if(t){
                        scope.deleteTile($this.parent().parent().parent());
                    }
                });
            });

            $(".task_open", this.ele).live("click", function(){
                var $this = $(this);
                scope.openDir($this.parent().parent().parent());
            });

            $("#service_tile_cancle", this.ele).bind("click", function(){
                scope.reset();
                $(this).hide();
            });
        },

        /**
         * 验证名称
         */
        validateName: function(){
            var ele = $("#st_name", this.ele);
            var val = ele.val();
            var hasspetialchar = /[^0-9a-zA-Z_\-]/.test(val);
            if(hasspetialchar) {
                $.messager.alert("提示", "切片名称不能包含特殊字符或中文,请重新填写");
                ele.val("").focus();
            }
        },

        /**
         * 获取存储的图层
         */
        getStoredLayers: function(){
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
         * 图层列表
         * @param layers
         */
        listLayers: function(layers){
            this.layers = layers;
            for(var layerid in this.layers){
                var layer = this.layers[layerid];
                this.addTask(layer);
                this.updateTaskProcess(layer, {
                    finished: layer.finished,
                    total: layer.total
                });
            }
        },

        /**
         * 获取网格配置
         * @private
         */
        _getGridSets: function(cback, scope){
            var dirpath = path.dirname(process.execPath)+CT.GRIDSETSPATH;
            if(fs.existsSync(dirpath)){
                fs.readdir(dirpath, function(err, files){
                    var gridsets = {};
                    files.forEach(function(file){
                        var ext = path.extname(file);
                        if(ext == ".json") {
                            var data = fs.readFileSync(dirpath + "/" + file, "UTF-8");
                            var tilename = path.basename(file, ".json");
                            gridsets[tilename] = JSON.parse(data);
                        }
                    });
                    cback ? cback.call(scope, gridsets) : false;
                });
            }
        },

        /**
         *
         * @param key
         */
        selectGridSet: function(key){
            var gridset = this.gridSets[key];
            if(gridset){
                this.currentGridSet = gridset;
                var levels = 0;
                if(gridset.resolutions){
                    levels = gridset.resolutions.length;
                }
                if(gridset.scales){
                    levels = gridset.scales.length;
                }
                if(levels > 1) {
                    $("#st_endzoom", this.ele).val(levels - 1);
                }
            }else{
                $.messager.alert("网格"+key+"已被删除,请重新配置网格");
            }
        },

        /**
         * 解析wms服务的capabilities
         * @param url
         */
        parseCapabilities: function(url){
            url += "?service=wms&request=getcapabilities";
            var scope = this;
            $.ajax({
                url: url,
                success: function(xml){
                    xml = $(xml);
                    var layernames = [{
                        "id": "-1",
                        "text": "图层树",
                        "children": []
                    }];
                    var capabilitynode = xml.find("Capability");
                    var parent = capabilitynode.children("Layer");
                    var layers = parent.children("Layer");
                    scope._parseCapabilities(layers, layernames[0]);
                    scope.createLayersTree(layernames);
                },
                error: function(err){
                    $.messager.alert("请求服务错误","请求"+url+"错误，请确认地址正确并且服务正常");
                }
            });
        },

        _parseCapabilities: function(layers, layernames){
            var scope = this;
            layers.each(function(){
                var name = $(this).children("Name");
                var title = $(this).children("Title").text();
                if(name && name.length){
                    name = name.text();
                }else{
                    name = "group_"+CT.UUID();
                }
                var node = {
                    id: name,
                    text: title
                };
                layernames.children.push(node);

                var children = $(this).children("Layer");
                if(children && children.length ){
                    node.children = [];
                    scope._parseCapabilities(children, node);
                }
            });
        },

        /**
         * 创建图层树
         * @param layernames
         */
        createLayersTree: function(layernames){
            $("#st_layers", this.ele).combotree({
                width: 300,
                multiple: true,
                cascadeCheck: true
            });
            $("#st_layers", this.ele).combotree("loadData", layernames);
            if(this.onCreatedLayerTree){
                this.onCreatedLayerTree();
            }
        },

        /**
         * 获取选择的图层
         */
        getCheckedLayers: function(){
            var values = $("#st_layers", this.ele).combotree("getValues");
            values = values.filter(function(value){
                if(value == "-1"){
                    return false;
                }
                if(value.indexOf("group_") == -1) {
                    return true;
                }
                return false;
            });
            return values;
        },

        /**
         * 解析shp文件
         */
        parseShpFile: function(filepath){
            var scope = this;
            CT.getWKTS({
                uri: filepath
            }, function(err, wkts){
                if(err) {
                    console.log(err);
                    return;
                }
                $("#st_wkt", scope.ele).val(wkts.join("#"));
            });
        },

        /**
         * 存储图层信息
         */
        storeLayerInfo: function(params){
            var jsonString = JSON.stringify(params);
            var name = params.name;
            var filepath = path.dirname(process.execPath)+CT.LAYERSPATH+"/"+name+".st";
            CT.mkdirSync(path.dirname(filepath));
            var file = fs.createWriteStream(filepath);
            file.end(jsonString);
        },

        /**
         * 加载图层配置信息
         * @param layerpath
         */
        loadLayerConfig: function(layerpath){
            if(fs.existsSync(layerpath)){
                var scope = this;
                fs.readFile(layerpath, "utf-8", function(err, data){
                    var layer = JSON.parse(data);
                    $("#st_id", scope.ele).val(layer.id);
                    $("#st_name", scope.ele).val(layer.name);
                    $("#st_host", scope.ele).val(layer.host);
                    scope.checkedids = layer.layers.split(",");
                    $("#st_host", scope.ele).change();
                    $("#st_gsname", scope.ele).combobox("setValue", layer.gsname);
                    scope.selectGridSet(layer.gsname);
                    $("#st_format", scope.ele).combobox("setValue", layer.format);
                    $("#st_startzoom", scope.ele).val(layer.startzoom);
                    $("#st_endzoom", scope.ele).val(layer.endzoom);
                    $("#st_wkt", scope.ele).val(layer.wkt);
                    $("#st_path", scope.ele).val(layer.dir);
                    $("#st_thread", scope.ele).numberspinner("setValue",layer.maxthreed);
                    $("#service_tile_cancle", scope.ele).show();
                });
            }
        },

        onCreatedLayerTree: function(){
            if(this.checkedids){
                $("#st_layers", this.ele).combotree("setValues", this.checkedids);
                this.checkedids = null;
            }
        },

        /**
         * 开始
         */
        start: function(){
            var layers = this.getCheckedLayers();
            var gridSet = this.currentGridSet;
            var stid = $("#st_id", this.ele).val();
            var params = {
                id: stid||CT.UUID(),
                name: $("#st_name", this.ele).val(),
                host: $("#st_host", this.ele).val(),
                layers: layers.join(","),
                format: $("#st_format", this.ele).combobox("getValue"),
                startzoom: parseInt($("#st_startzoom", this.ele).val()),
                endzoom: parseInt($("#st_endzoom", this.ele).val()),
                wkt: $("#st_wkt", this.ele).val(),
                dir: $("#st_path", this.ele).val(),
                maxthreed: parseInt($("#st_thread", this.ele).numberspinner("getValue")),
                gsname: gridSet.name,
                bounds: gridSet.bounds,
                protocal: gridSet.protocal,
                lefttop: gridSet.lefttop,
                width: gridSet.width,
                height: gridSet.height,
                srs: gridSet.srs
            }
            if(gridSet.resolutions){
                params.resolutions = gridSet.resolutions;
            }
            if(gridSet.scales){
                params.scales = gridSet.scales;
            }

            this.storeLayerInfo(params);

            var isexsist = (stid != "");
            if(isexsist){
                var task = this.tasks[params.id];
                //是同一个
                if(task && task.name == params.name) {
                    task.setOptions(params);
                }else{//用户想通过这个拷贝一个修改一些参数重新切片
                    params.id = CT.UUID();
                    this.addTask(params);
                }
                $("#service_tile_cancle", this.ele).hide();
            }else {
                this.addTask(params);
            }
            this.startTask(params.id);

            this.reset();
        },

        storeLayerInfoByTask: function(id){
            var task = this.tasks[id];
            if(task){
                var params = task.getOptions();
                this.storeLayerInfo(params);
            }
        },

        /**
         * 开始任务
         * @param id
         */
        startTask: function(id){
            var ele = $(".task_item[data-id='"+id+"']", this.ele);
            ele.find(".task_control").removeClass("pause");
            var task = this.tasks[id];
            if(task){
                task.start();
            }
        },

        /**
         * 暂停任务
         * @param id
         */
        pauseTask: function(id){
            var ele = $(".task_item[data-id='"+id+"']", this.ele);
            ele.find(".task_control").addClass("pause");
            var task = this.tasks[id];
            if(task){
                task.pause();
                //this.storeLayerInfoByTask(id);
            }
        },

        /**
         * 添加任务
         * @param params
         */
        addTask: function(params){
            var scope = this;
            params.onUpdateProcess = function (ret) {
                scope.updateTaskProcess(this, ret);
            }
            var stu = new CT.ServiceTileUtil(params);
            this.tasks[params.id] = stu;
            var ele = $('<div class="task_item" data-id="'+params.id+'">' +
                '<div class="task_progress">'+
                    '<span class="ct_icon icon_server_tile"></span>' +
                    '<div class="task_progress_bar">' +
                    '<span class="task_name"> '+params.name+' </span>' +
                    '<span class="task_progress_innerbar"></span>' +
                    '</div>' +
                    '<span class="task_control pause"></span>' +
                    '<div class="task_progress_num">0%</div>' +
                '</div>'+
                '<div class="task_tools">' +
                    '<div class="task_tool_item"><span class="ct_icon ct_icon_middle task_delete" title="删除"></span></div>' +
                    '<div class="task_tool_item"><span class="ct_icon ct_icon_middle task_open" title="打开"></span></div>' +
                    '<div class="task_tool_item"><span class="ct_icon ct_icon_middle task_zip" title="打包"></span></div>' +
                '</div>'+
                '</div>');
            $(".tasklist", this.ele).prepend(ele);

            $(".task_control", ele).bind("click", function(){
                if($(this).hasClass("pause")){
                    scope.startTask(params.id);
                }else{
                    scope.pauseTask(params.id);
                }
            });
        },

        updateTaskProcess: function(task, ret){
            var ele = $(".task_item[data-id='"+task.id+"']");
            var percent = ret.finished / ret.total;
            var w = $(".task_progress_bar", ele).width();
            var left = (percent - 1)*100 + "%";
            $(".task_progress_innerbar", ele).css("left", left);
            $(".task_name", ele).html(task.name+"("+ret.finished+"/"+ret.total+")");
            $(".task_progress_num", ele).html(Math.round(percent*100*100)/100+"%");

            this.storeLayerInfoByTask(task.id);
            if(percent == 1){
                $(".task_control", ele).addClass("finished");
            }
        },

        /**
         *
         * @param ele
         */
        deleteTile: function(ele){
            var id = ele.data("id");
            var layer = this.tasks[id].getOptions();

            var tilepath = layer.dir+"/"+layer.name;
            var total = layer.total;
            var deletefilenum = 0;

            var w = $(".task_progress_bar", ele).width();

            var scope = this;
            if(fs.existsSync(tilepath)) {
                CT.removeFiles(tilepath, function () {
                    deletefilenum++;
                    var percent = (layer.finished - deletefilenum) / total;
                    var left = (percent - 1) * 100 + "%";
                    $(".task_progress_innerbar", ele).css("left", left);
                    $(".task_name", ele).html(layer.name + "(" + (layer.finished - deletefilenum) + "/" + total + ")");
                    $(".task_progress_num", ele).html(Math.round(percent * 100 * 100) / 100 + "%");
                }, function(){
                    $.messager.confirm("提示",layer.name+" 切片已经删除完成，是否保留图层配置?", function(t){
                        if(t){
                            layer.finished = 0;
                            scope.storeLayerInfo(layer);
                            $(".task_control", ele).removeClass("finished").addClass("pause");
                        }else{
                            ele.remove();
                            //完成后删除图层声明
                            scope.deleteLayerStore(layer);
                            delete scope.tasks[id];
                        }
                    });
                });
            }else{
                $.messager.confirm("提示",layer.name+" 切片已经被删除，是否继续删除图层配置?", function(t){
                    if(t){
                        ele.remove();
                        //完成后删除图层声明
                        scope.deleteLayerStore(layer);
                        delete scope.tasks[id];
                    }else{
                        layer.finished = 0;
                        scope.storeLayerInfo(layer);
                        $(".task_control", ele).removeClass("finished").addClass("pause");
                    }
                });
            }
        },

        /**
         * 设置进度
         * @param ele
         * @param layer
         * @param percent
         */
        setProgrees: function(ele, layer, percent){
            var left = (percent - 1) * 100 + "%";
            $(".task_progress_innerbar", ele).css("left", left);
            $(".task_name", ele).html(layer.name + "(" + layer.finished + "/" + layer.total + ")");
            $(".task_progress_num", ele).html(Math.round(percent * 100 * 100) / 100 + "%");
        },

        /**
         * 重置
         */
        reset: function(){
            $(".data_form", this.ele)[0].reset();
        },

        /**
         * 删除图层文件
         * @param layer
         */
        deleteLayerStore: function(layer){
            var filepath = path.dirname(process.execPath)+CT.LAYERSPATH+"/"+layer.name+".st";
            fs.unlink(filepath);
        },

        /**
         * 打开切片对应的文件夹
         * @param ele
         */
        openDir: function(ele){
            var id = ele.data("id");
            var layer = this.tasks[id].getOptions();

            var tilepath = layer.dir+"/"+layer.name;
            CT.openDir(tilepath);
        }
    }
})();