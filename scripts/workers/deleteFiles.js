/**
 * Created by cqb on 2014/9/19.
 */

var fs = require("fs");
process.on('message', function(m) {
    var root = m.root;
    var cback = m.cback || function(){};
    var endcback = m.endcback || function(){};

    var dirs = [];
    try{
        iterator(root, dirs, cback);
        for(var i = 0, el ; el = dirs[i++];){
            fs.rmdirSync(el);
        }
        end ? end() : false;
    }catch(e){
        e.code === "ENOENT" ? cb() : cb(e);
    }
});
CT.removeFiles = (function(){

    function iterator(url,dirs, cback){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);
            inner(url,dirs, cback);
        }else if(stat.isFile()){
            fs.unlinkSync(url);
            cback();
        }
    }
    function inner(path,dirs, cback){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs, cback);
        }
    }
    return function(dir,cb, end){
        cb = cb || function(){};
        var dirs = [];
        try{
            iterator(dir,dirs, cb);
            for(var i = 0, el ; el = dirs[i++];){
                fs.rmdirSync(el);
            }
            end ? end() : false;
        }catch(e){
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})();