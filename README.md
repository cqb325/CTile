# CTile
Spatial data slicing tool,support for WMS services, local raster data and Download online service
空间数据切片工具，支持wms请求切片本地栅格数据切片，切片支持TMS和WMTS，切片数据可以进行压缩处理，支持下载在线切片服务：BingMap、GoogleMap、天地图

## 系统说明
该系统基于：
    Node.js 0.10.x版本
    Node-webkit 0.8.6版本
    GDAL GDAL 2.0.0dev, released 2014/04/16
    
## 部署
    1、将代码解压到Node-webkit运行环境下
    2、GDAL ： C:/GDAL
    3、将项目bin目录下的DLL文件拷贝到C:/GDAL/bin下
    4、运行nw.exe即可
