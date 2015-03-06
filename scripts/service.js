/**
 * Created by cqb on 2014/9/22.
 */
(function(){
    var http = require("http");
    var url = require("url");
    var path = require("path");
    var querystring = require("querystring");
    CT.Service = function(options){
        this._init(options);
    }

    CT.Service.prototype = {
        port: "8415",

        root: null,

        layer: null,

        _init: function(options){
            CT.extend(this, options);

            this.createService();
        },

        createService: function(){
            var scope = this;
            var server = http.createServer(function(req, res){
                var pathname = url.parse(req.url).pathname;

                if(pathname == "/wmts"){
                    var params = querystring.parse(url.parse(req.url).query);
                    var layer = params["LAYER"];
                    var matrixset = params["TILEMATRIXSET"];
                    var tilematrixset = params["TILEMATRIX"];
                    var level = parseInt(tilematrixset.split(":")[1]);
                    var tilerow = params["TILEROW"];
                    var tilecol = params["TILECOL"];
                    var format = params["FORMAT"];
                    var tilepath = scope.getTilePath(tilecol, tilerow, level, layer, format, matrixset);
                    if (fs.existsSync(tilepath)) {
                        fs.readFile(tilepath, function (err, data) {
                            if (data) {
                                res.end(data);
                            }
                        });
                    }else {
                        fs.readFile("./lib/ol2/theme/default/img/blank.gif", function (err, data) {
                            if (data) {
                                res.end(data);
                            }
                        });
                    }
                }else {
                    var tilepath = path.join(scope.getRoot() + "", pathname);
                    if (fs.existsSync(tilepath)) {
                        fs.readFile(tilepath, function (err, data) {
                            if (data) {
                                res.end(data);
                            }
                        });
                    } else {
                        fs.readFile("./lib/ol2/theme/default/img/blank.gif", function (err, data) {
                            if (data) {
                                res.end(data);
                            }
                        });
                    }
                }
            });
            server.listen(this.port, function(){
                console.log("inner server listen to port "+scope.port);
            });

            server.on('error', function (e) {
                if (e.code == 'EADDRINUSE') {
                    console.log('Address or Port '+scope.port+' in use retrying ...');
                    setTimeout(function () {
                        server.close();
                        server.listen(scope.port);
                    }, 100);
                }
            });
        },

        setRoot: function(root){
            this.root = root;
        },

        getRoot: function(){
            return this.root;
        },

        setLayer: function(layer){
            this.layer = layer;
            this.setRoot(layer.dir);
        },

        /**
         * 存放地址
         * @param x
         * @param y
         * @param z
         */
        getTilePath: function(x, y, z, layername, format, maxtrixset){
            var ext = CT.FROMATEXTS[format];
            var despath = "";
            var level = z < 10 ? maxtrixset + "_0" + z : maxtrixset+"_"+z;
            var shift = z / 2;
            var half = 2 << shift;
            var digits = 1;
            if (half > 10){
                digits = parseInt(Math.log(half)/Math.log(10)) + 1;
            }
            var halfx = this.zeroPadder(digits, parseInt(x / half));
            var halfy = this.zeroPadder(digits, parseInt(y / half));

            x = this.zeroPadder(2*digits, x);
            y = this.zeroPadder(2*digits, y);
            despath = this.root + "/" + layername + "/" + level + "/" + halfx+"_"+halfy + "/" + x+"_"+y+ext;
            return despath;
        },

        /**
         * 行列前面加0
         * @param order
         * @param number
         */
        zeroPadder: function(order, number) {
            var numberOrder = 1;
            var prefix = "";
            if (number > 9) {
                if (number > 11) {
                    numberOrder = parseInt(Math.ceil(Math.log(number)/Math.log(10) - 0.001));
                } else {
                    numberOrder = 2;
                }
            }

            var diffOrder = order - numberOrder;

            if (diffOrder > 0) {
                while (diffOrder > 0) {
                    prefix += '0';
                    diffOrder--;
                }
                prefix += number;
            } else {
                prefix += number;
            }

            return prefix;
        }
    }
})();