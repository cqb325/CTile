/**
 * Created by cqb on 2014/9/3.
 * 下载数据
 */
var fs = require('fs');
var http = require("http");

process.on('message', function(m) {
    var fileurl = m.fileurl, url=m.url;

    if(url){
        http.get(url, function(res) {
            var file = fs.createWriteStream(fileurl);
            res.on('data', function(data) {
                file.write(data);
            }).on('end', function() {
                file.end();
                endcb({
                    filepath: fileurl,
                    msg: "success"
                });
            });
        }).on('error', function(e) {
            endcb({
                filepath: fileurl,
                msg: "error"
            });
        });
    }else{
        endcb({
            filepath: fileurl,
            msg: null
        });
    }
});

function endcb(data){
    process.send(data);
}