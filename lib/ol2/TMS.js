OpenLayers.Layer.TMS = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    /**
     * APIProperty: isBaseLayer 是否为基础图层，默认为false.
     */
    isBaseLayer : true,

    /**
     * 切片的文件格式
     */
    imgFormat : 'png',

    zoomLevels: 1,

    islefttop: false,

    /**
     * Method: getURL
     *
     * 图层切片大小修改为从地图对象获取 初始化按照实际层数 级别限制减小一个级别
     */
    getURL : function(bounds) {
        bounds = this.adjustBounds(bounds);
        var res = this.getServerResolution();
        var z = this.getServerZoom();

        var extent = this.map.getMaxExtent();

        var x = Math.round((bounds.left - extent.left) /
            (res * this.tileSize.w));
        var y;
        if(this.islefttop){
            y = Math.round((extent.top - bounds.top) /
                (res * this.tileSize.h));
        }else{
            y = Math.round((bounds.bottom - extent.bottom) /
                (res * this.tileSize.h));
        }

        if (z <= this.zoomLevels - 1) {
            return this.url + "/" + this.name + "/" + z + "/" + y + "/" + y
                + "_" + x + "." + this.imgFormat;
        } else {
            return OpenLayers.Util.getImagesLocation() + "blank.gif";
        }
    },
    CLASS_NAME : "OpenLayers.Layer.TMS"
});