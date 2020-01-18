/*global L, document*/
'use strict';
/*
 * Class Stream represents a local or a remote Stream in the Room. It will handle the WebRTC stream
 * and identify the stream and where it should be drawn.
 */
var TK = TK || {};

TK.PUBLISH_STATE_NONE = 0; //下台
TK.PUBLISH_STATE_AUDIOONLY = 1; //只发布音频
TK.PUBLISH_STATE_VIDEOONLY = 2; //只发布视频
TK.PUBLISH_STATE_BOTH = 3; //音视频都发布
TK.PUBLISH_STATE_MUTEALL = 4; //音视频都关闭
TK.RoomUser = function (userinfo) {
    if (userinfo == undefined || userinfo.properties === undefined) {
        L.Logger.warning('[tk-fake-sdk]Invalidate user info', id, properties);
        return undefined;
    }

    var id = userinfo.id;
    if(typeof userinfo.properties === 'string'){
        userinfo.properties = L.Utils.toJsonParse(userinfo.properties);
    }
    var properties = userinfo.properties;
    L.Logger.debug('[tk-fake-sdk]RoomUser', id, properties);

    var that={};
    that.id = id;
    that.watchStatus = 0;//0 idel 1 sdp 2 ice 3 streaming 4 canceling  

    for (var key in properties) {
        if (key != 'id' && key != 'watchStatus')
            that[key]=properties[key];
    }

    that.publishstate = that.publishstate || TK.PUBLISH_STATE_NONE;
    return that;
};
