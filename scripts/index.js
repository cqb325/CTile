/**
 * Created by cqb on 2014/9/2.
 * 主页
 */

var gui = require('nw.gui');
var win = gui.Window.get();

/**
 * 获取配置信息
 */
function getConfigs(){
    var conpath = require('path').dirname(process.execPath)+"/ctile";
    var config = require(conpath);
    CT.extend(CT, config);
}

$(function(){
    closewindow();
    minlizewindow();
    reloadwindow();
    debugwindow();
    keyMap();

    $(".nav_item").click(function(){
        if(!$(this).hasClass("active")){
            $(".nav_item.active").removeClass("active");
            $(this).addClass("active");

            var viewname = $(this).data("view");
            CT.Views.switchView(viewname);
        }
    }).eq(0).click();

//    var test = edge.func(function () {/*
//     using System;
//     using System.Threading.Tasks;
//
//     public class Startup
//     {
//         public async Task<object> Invoke(dynamic input)
//         {
//            var log = (Func<object, Task<object>>)input.log;
//            log("1111");
//            log("1111");
//            log("1111");
//
//            return null;
//         }
//     }
//     */});
//
//    test({
//        log: function(str){
//            console.log(str);
//        }
//    }, function(err, ret){
//        console.log("end....");
//    })
});

/**
 * 退出系统
 */
function closewindow(){
    $("#closebt").bind("click", function(){
        $.messager.confirm('提示', '确定要退出系统?', function(r){
            if (r){
                win.close(true);
            }
        });
    });
}

/**
 * 最小化
 */
function minlizewindow(){
    $("#minbt").bind("click", function(){
        win.minimize();
    });
}

/**
 * 重新加载
 */
function reloadwindow(){
    $("#winreload").bind("click", function(){
        win.reload();
    });
}

/**
 * 调试工具
 */
function debugwindow(){
    $("#debugtool").bind("click", function(){
        win.showDevTools("devtools");
    });
}

/**
 * 快捷键
 * */

function keyMap(){
    $(window).keydown(function(event){
        switch (event.keyCode){
            case 116://F5
                win.reload();
                break;
            case 123://F12
                win.showDevTools('devtools');
                break;
        }
    });
}