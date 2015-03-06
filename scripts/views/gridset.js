/**
 * Created by lenovo on 2014/9/2.
 */
(function(){
    var fs = require("fs"),
        path = require('path');

    CT.GridSet = function(){

    }

    CT.GridSet.prototype = {
        id: "GridSetView",
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

        _create: function(){
            this._createLayout();
            this._initGrid();
            this._listGridSets();
        },

        /**
         * 布局
         * @private
         */
        _createLayout: function(){
            this.ele.append('<div class="gridSet_from client" style="bottom: 250px;"></div>' +
                '<div class="client" style="height: 250px; top:auto; left: -1px;">' +
                '<div id="gridSet_list"></div>'+
                '</div>');

            this.ele.children(".gridSet_from").append('<form class="client" style="padding: 10px; right: 350px;">' +
                '<input type="hidden" id="gs_id">' +
                '<div class="form_row">' +
                    '<lable>名称:</lable><input id="gs_name">(必填)' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>协议:</lable><select id="gs_protocal"><option>选择切片协议</option>' +
                    '<option value="TMS">TMS</option>' +
                    '<option value="WMTS">WMTS</option>' +
                    '</select>(TMS/WMTS)' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>坐标系统:</lable><input id="gs_projection">(EPSG:4326)<span style="margin-left: 50px;"></span>' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>四至:</lable><input id="gs_bounds">(-180,-90,180,90)' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>原点:</lable><select id="gs_lefttop"><option>选择切片原始点</option>' +
                    '<option value="true">左上角</option>'+
                    '<option value="false">左下角</option>'+
                    '</select>' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>切片宽度:</lable><input id="gs_width" value="256">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>切片高度:</lable><input id="gs_height" value="256">' +
                '</div>'+
                '<div class="form_row">' +
                    '<lable>模式:</lable><select id="gs_mode">' +
                    '<option value="1">分辨率</option>'+
                    '<option value="2">比例尺</option>'+
                    '</select>' +
                '</div>'+
                '<div class="form_row">' +
                    '<div><a href="javascript:void(0)" class="save_bt">保存</a>' +
                    '<a href="javascript:void(0)" class="cancle_bt" style="display: none;">取消</a>'+
                    '</div>'+
                '</div>' +
                '</form>' +
                '<div class="client scale_resolution" style="padding: 10px; left: auto; width:350px; overflow-y: auto;">' +
                    '<div class="scale_resolution_head"><a href="javascript:void(0)" class="addLevel_bt">添加层级</a>' +
                    '<a href="javascript:void(0)" class="removeLevel_bt">删除层级</a>' +
                    '</div>' +
                    '<table style="width: 100%;" class="scale_resolution_grid">' +
                        '<thead><tr>' +
                            '<th>层级</th><th>分辨率</th><th>比例尺</th>'+
                        '</tr></thead>'+
                        '<tbody></tbody>'+
                    '</table>'+
                '</div>');


            var scope = this;
            $("#gs_name", this.ele).blur(function(){
                scope.validateName();
            });
            $("#gs_protocal, #gs_lefttop", this.ele).combobox({
                width: 300
            });

            var keys = Object.keys(CT.Projections);
            keys = keys.map(function(key){
                return "EPSG:"+key;
            });
            $("#gs_projection").autocomplate({
                data: keys
            });

            $("#gs_mode", this.ele).combobox({
                width: 300,
                onChange: function(v){
                    if(v == "1"){
                        $(".scale_resolution_grid .resolution", scope.ele).removeAttr("readonly");
                        $(".scale_resolution_grid .scale", scope.ele).attr("readonly", true);
                    }
                    if(v == "2"){
                        $(".scale_resolution_grid .resolution", scope.ele).attr("readonly", true);
                        $(".scale_resolution_grid .scale", scope.ele).removeAttr("readonly");
                    }
                }
            });

            $("#gs_projection", this.ele).change(function(){
                var pro = $(this).val();
                var num = pro.toLowerCase().replace('epsg:','');

                if(CT.Projections[num]){
                    var str = CT.Projections[num].split(",")[0];
                    str = str.replace(/\w+\[/g,"");
                    $(this).siblings("span").html(" "+str);
                }else{
                    $(this).siblings("span").html("");
                }
            });

            $(".addLevel_bt", this.ele).click(function(){
                scope.calculateScaleAndResolution();
            });
            $(".removeLevel_bt", this.ele).click(function(){
                scope.removeScaleAndResolution();
            });

            $(".save_bt", this.ele).bind("click", function(){
                scope.saveGridSet();
            });
            $(".cancle_bt", this.ele).bind("click", function(){
                scope.reset();
            });
        },

        validateName: function(){
            var ele = $("#gs_name", this.ele);
            var val = ele.val();
            var hasspetialchar = /[^0-9a-zA-Z_\-]/.test(val);
            if(hasspetialchar) {
                $.messager.alert("提示", "网格名称不能包含特殊字符,请重新填写");
                ele.val("").focus();
            }
        },

        /**
         * 初始化表格
         * @private
         */
        _initGrid: function(){
            var scope = this;
            jQuery('#gridSet_list', this.ele).datagrid({
                rownumbers:true,
                autoRowHeight:false,
                pagination: false,
                fitColumns: true,
                fit:true,
                singleSelect: true,
                selectOnCheck: false,
                checkOnSelect: false,
                idField: "id",
                columns:[[
                    {field:'name',title:'名称',width:100},
                    {field:'protocal',title:'切片协议',width:100},
                    {field:'mode',title:'切片模式',width:100},
                    {field:'bounds',title:'四至',width:200},
                    {field:'levels',title:'层级',width:100},
                    {field:'lefttop',title:'原始点',width:100},
                    {field:'ops',title:'操作',width:150}
                ]]
            });
        },

        /**
         *
         * @private
         */
        _listGridSets: function(){
            this._getGridSets(function(gridSets){
                var rows = [];
                for(var filename in gridSets){
                    var gridSet = gridSets[filename];
                    this.appendRow(gridSet);
                }
            }, this);
        },

        /**
         * 添加表格的一行
         * @param data
         */
        appendRow: function(data){
            var mode = "",levels = 0;
            if(data.resolutions){
                mode = "分辨率";
                levels = data.resolutions.length;
            }
            if(data.scales){
                mode = "比例尺";
                levels = data.scales.length;
            }
            var lefttop = "左上角";
            if(data.lefttop){
                lefttop = "左上角";
            }else{
                lefttop = "左下角";
            }
            var row = {
                id: data.id,
                name: data.name,
                protocal: data.protocal,
                mode: mode,
                bounds: data.bounds,
                levels: levels,
                lefttop: lefttop,
                ops: '<a class="linkbutton deleterow_bt" data-id="'+data.id+'">删除</a>' +
                    '<a class="linkbutton detailrow_bt" data-id="'+data.id+'">详细信息</a>'
            }
            $("#gridSet_list", this.ele).datagrid("appendRow", row);

            this.bindGridButtons();
        },

        /**
         * 表格中的按钮绑定事件
         */
        bindGridButtons: function(){
            var gridele = jQuery('#gridSet_list', this.ele).datagrid("getPanel");
            var deleterowbts = $(".deleterow_bt:not(.listened)", gridele);
            var detailrowbts = $(".detailrow_bt:not(.listened)", gridele);
            deleterowbts.addClass("listened");
            detailrowbts.addClass("listened");
            var scope = this;
            deleterowbts.bind("click", function(){
                var $this= $(this);
                $.messager.confirm("提示","确认要删除该网格?", function(t){
                    if(t){
                        var id = $this.data("id");
                        var rows = jQuery('#gridSet_list', scope.ele).datagrid("getRows");
                        rows.forEach(function(row, index){
                            if(row.id == id){
                                scope.deleteGridSet(row, index);
                            }
                        })
                    }
                })
            });
            detailrowbts.bind("click", function(){
                var id = $(this).data("id");
                var rows = jQuery('#gridSet_list', scope.ele).datagrid("getRows");
                for(var i in rows){
                    var row = rows[i];
                    if(row.id == id) {
                        scope.showGridSet(row);
                    }
                }
            });
        },

        /**
         * 结束
         */
        stopRender: function(){
            this.ele.hide();
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
                    var ret = [];
                    files.forEach(function(file){
                        var ext = path.extname(file);
                        if(ext == ".json") {
                            var stats = fs.statSync(dirpath + "/" + file);
                            ret.push({
                                file: file,
                                mt: stats.mtime
                            });
                        }
                    });
                    ret.sort(function(a, b){
                        return b.mt - a.mt;
                    });
                    ret.forEach(function(item){
                        var data = fs.readFileSync(dirpath + "/" + item.file, "UTF-8");
                        data = JSON.parse(data);
                        gridsets[data.name] = data;
                    });
                    cback ? cback.call(scope, gridsets) : false;
                });
            }
        },

        /**
         * 添加比例尺和分辨率
         */
        calculateScaleAndResolution: function(){
            var bounds = $("#gs_bounds").val().split(",");
            if(bounds.length == 4){
                var levels = $(".scale_resolution_grid tbody tr", this.ele).length;
                var scale_res;
                if(levels == 0){
                    scale_res = this.getZeroLevelScaleAndResolution(bounds);
                }else{
                    scale_res = this.getNextScaleAndResolution();
                }

                this.appendNewScaleAndResolution(levels, scale_res);
            }
        },

        /**
         * 计算零级分辨率和比例尺
         * @param bounds
         * @returns {*[]}
         */
        getZeroLevelScaleAndResolution: function(bounds){
            var tilew = $("#gs_width", this.ele).val();
            var tileh = $("#gs_height", this.ele).val();

            var xw = parseFloat(bounds[2]) - parseFloat(bounds[0]);
            var yw = parseFloat(bounds[3]) - parseFloat(bounds[1]);

            var res = 0;
            if(xw >= yw){
                res = yw / tilew;
            }else{
                res = xw / tileh;
            }

            var scale = this.getScaleFromResolution(res);

            return [scale, res];
        },

        /**
         * 获取下一个比例尺和分辨率
         * @returns {*[]}
         */
        getNextScaleAndResolution: function(){
            var tr = $(".scale_resolution_grid tbody tr:last", this.ele);
            var res = tr.find(".resolution").val();
            var scale = tr.find(".scale").val();

            return [scale/2, res/2];
        },

        /**
         * 根据分辨率获取比例尺
         * @param res
         * @returns {number}
         */
        getScaleFromResolution: function(res){
            var srs = $("#gs_projection", this.ele).val();
            var unit = 0;
            if(srs.indexOf("4326") != -1){
                unit = CT.DEGREE_PER_INCHE;
            }else{
                unit = CT.METERS_PER_INCHE;
            }
            return res * unit * CT.DOTS_PER_INCHE;
        },

        /**
         * 根据比例尺获取分辨率
         * @param scale
         * @returns {number}
         */
        getResolutionFromScale: function(scale){
            var srs = $("#gs_projection", this.ele).val();
            var unit = 0;
            if(srs.indexOf("4326") != -1){
                unit = CT.DEGREE_PER_INCHE;
            }else{
                unit = CT.METERS_PER_INCHE;
            }

            return scale / unit / CT.DOTS_PER_INCHE;
        },

        /**
         * 添加新的比例尺和分辨率
         * @param levels
         * @param scale_res
         */
        appendNewScaleAndResolution: function(levels, scale_res){
            var mode = $("#gs_mode", this.ele).combobox("getValue");
            var tr = "";
            if(mode == 1){
                tr = $('<tr><td>'+levels+'</td>' +
                    '<td><input class="resolution" value="'+scale_res[1]+'"></td>' +
                    '<td>1:<input class="scale" readonly value="'+scale_res[0]+'"></td>'+
                    '</tr>');
            }
            if(mode == 2){
                tr = $('<tr><td>'+levels+'</td>' +
                    '<td><input class="resolution" readonly value="'+scale_res[1]+'"></td>' +
                    '<td>1:<input class="scale" value="'+scale_res[0]+'"></td>'+
                    '</tr>');
            }
            $(".scale_resolution_grid tbody", this.ele).append(tr);

            var scope = this;
            $(".resolution", tr).change(function(){
                var res = $(this).val();
                var scale = scope.getScaleFromResolution(res);
                $(".scale", tr).val(scale);
            });
            $(".scale", tr).change(function(){
                var scale = $(this).val();
                var res = scope.getResolutionFromScale(scale);
                $(".resolution", tr).val(res);
            });
        },

        /**
         * 删除最后一个分辨率和比例尺
         */
        removeScaleAndResolution: function(){
            var tr = $(".scale_resolution_grid tbody tr:last", this.ele);
            tr.remove();
        },

        /**
         * 保存网格
         */
        saveGridSet: function(){
            var id = $("#gs_id", this.ele).val();
            var params = {
                id: id || CT.UUID(),
                bounds: $("#gs_bounds", this.ele).val(),
                name: $("#gs_name", this.ele).val(),
                protocal: $("#gs_protocal", this.ele).combobox("getValue"),
                srs: $("#gs_projection", this.ele).val(),
                lefttop: ($("#gs_lefttop", this.ele).combobox("getValue") == "true"),
                width: parseInt($("#gs_width", this.ele).val()),
                height: parseInt($("#gs_height", this.ele).val()),
                mode: $("#gs_mode", this.ele).combobox("getValue")
            }

            if(params.mode == "1"){
                var res = [];
                if(!$(".scale_resolution_grid .resolution", this.ele).length){
                    $.messager.alert("提示","请添加切片层级分辨率");
                    return;
                }
                $(".scale_resolution_grid .resolution", this.ele).each(function(){
                    res.push(parseFloat($(this).val()));
                });
                params.resolutions = res;
            }
            if(params.mode == "2"){
                if(!$(".scale_resolution_grid .scale", this.ele).length){
                    $.messager.alert("提示","请添加切片层级比例尺");
                    return;
                }
                var scales = [];
                $(".scale_resolution_grid .scale", this.ele).each(function(){
                    scales.push(parseFloat($(this).val()));
                });
                params.scales = scales;
            }

            var dirpath = path.dirname(process.execPath)+CT.GRIDSETSPATH;
            if(!fs.existsSync(dirpath)){
                CT.mkdirSync(dirpath);
            }
            var filepath = dirpath + "/" + params.name + ".json";
            var file = fs.createWriteStream(filepath);
            var jsonString = JSON.stringify(params);
            file.end(jsonString);

            $.messager.alert("提示","网格"+params.name+"保存成功");

            if(!id) {
                this.appendRow(params);
            }else{
                $("#gs_id", this.ele).val("");
                $(".cancle_bt", this.ele).hide();
                this.updateRow(params);
            }

            this.reset();
        },

        /**
         * 更新表格数据
         * @param data
         */
        updateRow: function(data){
            var index = $("#gridSet_list", this.ele).datagrid("getRowIndex", data.id);
            var rows = $("#gridSet_list", this.ele).datagrid("getRows");
            var row = rows[index];
            if(row){
                var mode = "",levels = 0;
                if(data.resolutions){
                    mode = "分辨率";
                    levels = data.resolutions.length;
                }
                if(data.scales){
                    mode = "比例尺";
                    levels = data.scales.length;
                }
                var lefttop = "左上角";
                if(data.lefttop){
                    lefttop = "左上角";
                }else{
                    lefttop = "左下角";
                }

                row.name = data.name;
                row.protocal = data.protocal;
                row.mode = mode;
                row.bounds = data.bounds;
                row.levels = levels;
                row.lefttop = lefttop;

                $("#gridSet_list", this.ele).datagrid("updateRow", {
                    index: index,
                    row: row
                });

                this.bindGridButtons();
            }
        },

        /**
         * 删除网格
         * @param row
         * @param index
         */
        deleteGridSet: function(row, index){
            var filepath = path.dirname(process.execPath)+CT.GRIDSETSPATH+"/"+row.name+".json";
            if(fs.existsSync(filepath)){
                var scope = this;
                fs.unlink(filepath, function(err){
                    if(err){
                        $.messager.alert("提示","文件正在被其他程序占用，不能删除");
                        return;
                    }
                    $.messager.alert("提示","网格删除成功");
                    jQuery('#gridSet_list', scope.ele).datagrid("deleteRow", index);
                });
            }else{
                jQuery('#gridSet_list', this.ele).datagrid("deleteRow", index);
            }
        },

        /**
         * 显示网格详细信息
         * @param row
         */
        showGridSet: function(row){
            this.getGridSet(row, function(gridSet){
                $(".cancle_bt", this.ele).show();
                $("#gs_id", this.ele).val(gridSet.id);
                $("#gs_bounds", this.ele).val(gridSet.bounds);
                $("#gs_name", this.ele).val(gridSet.name);
                $("#gs_protocal", this.ele).combobox("setValue", gridSet.protocal);
                $("#gs_projection", this.ele).val(gridSet.srs);
                $("#gs_lefttop", this.ele).combobox("setValue", gridSet.lefttop+"");
                $("#gs_width", this.ele).val(gridSet.width);
                $("#gs_height", this.ele).val(gridSet.height);
                $("#gs_mode", this.ele).combobox("setValue", gridSet.mode);

                $(".scale_resolution_grid tbody", this.ele).empty();
                var scales_res;
                if(gridSet.mode == "1"){
                    scales_res = gridSet.resolutions.map(function(resolution){
                        var scale = this.getScaleFromResolution(resolution);
                        return [scale, resolution];
                    }, this);
                }
                if(gridSet.mode == "2"){
                    scales_res = gridSet.scales.map(function(scale){
                        var resolution = this.getResolutionFromScale(scale);
                        return [scale, resolution];
                    }, this);
                }

                if(scales_res && scales_res.length){
                    scales_res.forEach(function(scale_res, index){
                        this.appendNewScaleAndResolution(index, scale_res);
                    }, this);
                }

            }, this);
        },

        /**
         * 获取网格详细信息
         * @param row
         * @param cback
         * @param scope
         */
        getGridSet: function(row, cback, scope){
            var filepath = path.dirname(process.execPath)+CT.GRIDSETSPATH+"/"+row.name+".json";
            if(fs.existsSync(filepath)){
                fs.readFile(filepath, function(err, data){
                    if(err){
                        console.log(err);
                        return;
                    }
                    var gridSet = JSON.parse(data);
                    cback.call(scope, gridSet);
                });
            }
        },

        /**
         * 重置
         */
        reset: function(){
            $(".cancle_bt", this.ele).hide();
            $("#gs_id", this.ele).val("");
            $("#gs_bounds", this.ele).val("");
            $("#gs_name", this.ele).val("");
            $("#gs_protocal", this.ele).combobox("setValue", "选择切片协议");
            $("#gs_projection", this.ele).val("");
            $("#gs_lefttop", this.ele).combobox("setValue", "选择切片原始点");
            $("#gs_width", this.ele).val(256);
            $("#gs_height", this.ele).val(256);
            $("#gs_mode", this.ele).combobox("setValue", "1");

            $(".scale_resolution_grid tbody", this.ele).empty();
        }
    }
})();