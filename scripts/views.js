/**
 * Created by cqb on 2014/9/2.
 * 视图
 */
(function(){
    CT.Views = {
        _lastview: null,

        _views: {
            'gridset' : {
                classname : CT.GridSet,
                active : true,
                index: 'GridSetView',
                tabIndex: 0
            },
            'servicetile': {
                classname : CT.ServiceTile,
                active : false,
                index: 'ServiceTileView',
                tabIndex: 1
            },
            'imgtile': {
                classname : CT.ImgTile,
                active : false,
                index: 'ImgTileView',
                tabIndex: 2
            },
            'multiimgtile': {
                classname : CT.MultiImgTile,
                active : false,
                index: 'MultiImgTileView',
                tabIndex: 3
            },
            'tilepreview': {
                classname : CT.TilePreview,
                active : false,
                index: 'TilePreview',
                tabIndex: 4
            },
            'imagecompress': {
                classname : CT.ImageCompress,
                active : false,
                index: 'ImageCompress',
                tabIndex: 5
            },
            'downloadtiles': {
                classname : CT.DownloadTiles,
                active : false,
                index: 'DownloadTiles',
                tabIndex: 6
            }
        },

        switchView : function(name) {
            var newView = null;
            var scope = this;
            jQuery.each(this._views, function(viewName, view) {
                if (viewName === name) {
                    newView = view;
                }
                if(scope._lastview && scope._lastview.instance){
                    scope._lastview.instance.stopRender();
                    scope._lastview.active = false;
                    scope._lastview = null;
                }
            });

            if (newView !== null) {
                if (typeof newView.instance === 'undefined') {
                    if (typeof newView.init === 'undefined') {
                        newView.init = true;
                    }
                    if (newView.init) {
                        newView.instance = new newView.classname();
                        newView.instance.init();
                    }
                    if (typeof newView.instance !== 'undefined' && typeof newView.instance.postInit === 'function') {
                        newView.instance.postInit();
                    }
                }
                if (typeof newView.instance !== 'undefined') {
                    newView.active = true;
                    jQuery(".ct_view").hide();
                    jQuery('#'+newView.tabIndex).show();
                    newView.instance.startRender();
                    this._lastview = newView;
                }
            }
        },

        stopView : function(name) {
            var view = null;
            jQuery.each(this._views, function(_view, _options) {
                if (_options.active) {
                    view = _options;
                }
            });
            if (view !== null) {
                if (typeof view.instance !== 'undefined') {
                    view.instance.stopRender();
                }
            }
        }
    }
})();