/**
 * Created by cqb on 2014/9/18.
 */
(function(){

    function init(ele){
        var timer;
        $(ele).bind("keyup", function(e){
            if(timer){
                window.clearTimeout(timer);
            }
            timer = window.setTimeout(function(){
                filterData(ele);
            }, 300);
        });
        $(document).bind("click.autocomplate", function(e){
            if($(e.target).parent().hasClass("autocomplate_dropdown")){
                return false;
            }
            var dropdown = $.data(ele, "autocomplate").dropdown;
            if(dropdown){
                dropdown.hide();
            }
        });

        createDropdown(ele);
    }

    function createDropdown(ele){
        var options = $.data(ele, "autocomplate").options;
        var data = options.data;

        var dropdown = $("<div class='autocomplate_dropdown'></div>");
        $.data(ele, "autocomplate").dropdown = dropdown;
        var w = $(ele).width();
        var h = $(ele).outerHeight(true)-2;
        var pos = $(ele).position();
        var pl = parseFloat($(ele).offsetParent().css("padding-left"));
        dropdown.css({
            "position": "absolute",
            "top": h,
            "left": pos.left-pl,
            "width": w,
            "max-height": 200,
            "min-height": 20
        });
        $(ele).after(dropdown);
        $(ele).parent().css("position", "relative");

        data.forEach(function(item){
            var el = $('<div data-value="'+item+'">'+item+'</div>');
            dropdown.append(el);
        });

        dropdown.children("div").bind("click", function(){
            $(ele).focus();
            var theval = $(this).data("value");
            $(ele).val(theval);
            dropdown.hide();
        });
    }

    function filterData(ele){
        var val = $(ele).val();
        var options = $.data(ele, "autocomplate").options;

        showList(ele, val);
    }

    function showList(ele, val){
        var dropdown = $.data(ele, "autocomplate").dropdown;
        dropdown.show();

        dropdown.children("div").each(function(){
            var text = $(this).data("value");
            if(text.indexOf(val) == -1){
                $(this).hide();
            }else {
                $(this).show();
            }
        });
    }

    $.fn.autocomplate = function(options, param){
        if (typeof options == 'string'){
            return $.fn.autocomplate.methods[options](this, param);
        }

        options = options || {};

        return this.each(function(){
            var state = $.data(this, 'autocomplate');
            if (state){
                $.extend(state.options, options);
            } else {
                state = $.data(this, 'autocomplate', {
                    options: $.extend({}, $.fn.autocomplate.defaults, options)
                });
                init(this);
            }
        });
    }

    $.fn.autocomplate.methods = {

    }

    $.fn.autocomplate.defaults = {

    }
})();