var TK = TK || {};
TK.SDKTYPE = undefined ;
TK.isOnlyAudioRoom = false ; //是否是纯音频教室
TK.extendSendInterfaceName = "" ;   //""（默认） , _videoWhiteboardPage(视频标注)
TK.SDKNATIVENAME = undefined ;
TK.global = {
    fakeJsSdkInitInfo:{
        debugLog:false, //客户端控制是否打印debug日志
        playback:false , //是否是回放
        deviceType:undefined ,  //phone , pad  , windowClient , macClient
        mobileInfo:{
            isSendLogMessageToProtogenesis:false, //是否发送日志信息给原生移动端
            clientType:undefined , //android , ios
        }
    },
};

TK.QtNativeClientRoom = function (roomOptions) {
    TK.SDKNATIVENAME = 'QtNativeClientRoom' ;
    TK.SDKTYPE = 'pc' ;
    return TK.Room(roomOptions);
};
TK.MobileNativeRoom = function (roomOptions) {
    TK.SDKNATIVENAME = 'MobileNativeRoom' ;
    TK.SDKTYPE = 'mobile' ;
    return TK.Room(roomOptions);
};
TK.Room = function (roomOptions) {
    'use strict';
    if(!TK.SDKNATIVENAME){
        L.Logger.error('[tk-fake-sdk]Room is not init!');
        return ;
    }
    roomOptions = roomOptions || {} ;

    // TK.SDKVERSIONS =  window.__SDKVERSIONS__  || "2.1.8";
    TK.SDKVERSIONS =  "2.2.1";
    // TK.SDKVERSIONSTIME =  window.__SDKVERSIONSTIME__  || "2018032915";
    TK.SDKVERSIONSTIME =  "2018082114";

    L.Logger.info('[tk-sdk-version]sdk-version:'+ TK.SDKVERSIONS +' , sdk-time: '+ TK.SDKVERSIONSTIME) ;

    var spec={};
    var that = TK.EventDispatcher(spec);

    var ERR_HTTP_REQUEST_FAILED = 3;

    var _myself = {}  , _users = {}   , _room_properties = {} , _isPlayback = false  ,
        _rolelist = {} , _fistSetLog = false , _room_name = undefined , _room_type = undefined ,
        _is_room_live = false , _room_max_videocount = undefined  , _room_id = undefined  ,
        _web_protocol = undefined, _web_host = undefined , _web_port = undefined ,
        _doc_protocol = undefined ,_doc_host = undefined ,  _doc_port = undefined   ,
        _backup_doc_protocol = undefined ,_backup_doc_host = undefined ,  _backup_doc_port = undefined   ,
        _whiteboardManagerInstance = undefined ,socketBindListMap ={},_backup_doc_host_list=[];
    var _roomMode = window.TK.ROOM_MODE.NORMAL_ROOM ; //房间模式，默认window.TK.ROOM_MODE.NORMAL_ROOM

    that.socket = TK.fakeScoketIO(that);

    /*设置日志是否是debug级别
     * @params isDebug:是否是debug日志 ， 默认false , Boolean
     * @params logLevel:指定日志级别【
         0, //debug 级别日志
         1, //trace 级别日志
         2, //info 级别日志
         3, //warning 级别日志
         4, //error 级别日志
         5 //不打印日志
     】， 默认跟着isDebug(如果是debug则logLevel=0 , 否则logLevel=2) , Number*/
    that.setLogIsDebug = function (isDebug , logLevel) {
        isDebug = isDebug || false ;
        if(logLevel !== undefined ){
            if(logLevel === 0){
                isDebug = true ;
            }else{
                isDebug = false ;
            }
        }
        var socketLogConfig = {
            debug:isDebug ,
        } , loggerConfig = {
            development:isDebug ,
            logLevel:logLevel !== undefined && typeof logLevel === 'number' ? logLevel :(isDebug ? L.Constant.LOGLEVEL.DEBUG :  L.Constant.LOGLEVEL.INFO) ,
        }, adpConfig = {
            webrtcLogDebug:isDebug
        };
        TK.tkLogPrintConfig( socketLogConfig , loggerConfig , adpConfig );
    };

    /*获取房间属性信息*/
    that.getRoomProperties = function() {
        return _room_properties;
    };

    /*获取所有的用户信息*/
    that.getUsers = function () {
        return _users ;
    };

    /*获取用户
     * @params id:用户id , String */
    that.getUser=function(id) {
        if(id === undefined)
            return undefined;

        return _users[id];
    };

    /*获取我自己的用户信息*/
    that.getMySelf=function() {
        return _myself;
    };

    /*改变接口的扩展名字
    * @params extendSendInterfaceName:扩展名字*/
    that.changeExtendSendInterfaceName = function (extendSendInterfaceName) {
        TK.extendSendInterfaceName = extendSendInterfaceName ;
    };

    /*开始共享媒体文件
    * @params url:共享的地址 ， String
    * @params isVideo:是否有video ， 默认false ， Boolean
    * @params toID:发送给谁 , 缺省发给所有人 ， String
    * @params attrs:流携带的attributes数据， Json
    * */
    that.startShareMedia = function (url , isVideo , toID ,attrs) {
        if(!url){
            L.Logger.error('[tk-fake-sdk]startShareMedia url can not be empty!');
            return;
        }
        var attributes = {type:'media'};
        isVideo = isVideo !==undefined ? isVideo : false ;
        if(toID !== undefined){
            attributes.toID = toID ;
        }
        if(attrs && typeof attrs === 'object'){
            for(var key in attrs){
                if(key !== 'toID' && key !== 'type'){
                    attributes[key] = attrs[key] ;
                }
            }
        }
        var startShareMediaJson = {audio:true , video:isVideo , url:url , attributes:attributes };
        _sendMessageSocket('publishNetworkMedia' , startShareMediaJson);
    };

    /*停止共享媒体文件 */
    that.stopShareMedia = function () {
        _sendMessageSocket('unpublishNetworkMedia');
    };

    /*页面加载完毕，给伪代理服务器通知页面加载完毕*/
    that.onPageFinished = function () {
        _sendMessageSocket('onPageFinished');
    };

    /*通知ios播放MP3*/
    that.isPlayAudio = function (url , isPlay , attrs) {
        var audioJson = {audio:true , isPlay:isPlay , url:url , type:attrs.type , other: attrs.other};
        _sendMessageSocket('isPlayAudio' , audioJson);
    };

    /*发送PubMsg信令功能函数
     * @allParams params:pubMsg需要的所有参数承接对象
     * @params name:信令名字 , String
     * @params id:信令ID , String
     * @params toID:发送给谁(默认发给所有人) , String
                 __all（所有人，包括自己） ,
                 __allExceptSender （除了自己以外的所有人）,
                 userid（指定id发给某人） ,
                 __none （谁也不发，只有服务器会收到）,
                 __allSuperUsers（只发给助教和老师）,
                 __group:groupA:groupB(发送给指定组，组id不能包含冒号),
                 __groupExceptSender:groupA（发给指定组，不包括自己）
     * @params data:信令携带的数据 , Json/JsonString
     * @params save:信令是否保存 , Boolean
     * @params associatedMsgID:绑定的父级信令id , String
     * @params associatedUserID:绑定的用户id , String
     * @params expiresabs:暂时不用
     * @params expires:暂时无效
     * @params type:扩展类型，目前只有count一种扩展类型，之后如需扩展可在此处进行相应变动 , String (目前直播才有用)
     * @params write2DB:暂时无效, Boolean (目前直播才有用)
     * @params actions:执行的动作操作列表，目前只有0，1 (0-不操作，1-代表增加操作), Array (目前直播才有用)
     * @params do_not_replace:老师和助教不能同时操作，后操作的服务器直接丢弃, Boolean (目前直播才有用)
     * */
    that.pubMsg=function(params) {
        if(typeof params !== 'object'){
            L.Logger.error('[tk-sdk]pubMsg params must is json!');
            return ;
        }
        var _params = {};
        _params.name =  params['name'] ||  params['msgName'] ;
        _params.id = params['id'] || params['msgId'] || _params.name;
        _params.toID = params['toID'] || params['toId'] || '__all'; //  toID=> __all , __allExceptSender , userid , __none ,__allSuperUsers
        _params.data= params['data'] ;
        if(!params['save']){
            _params.do_not_save="";
        }
        if(params['associatedMsgID'] !== undefined){
            _params.associatedMsgID = params['associatedMsgID'] ;
        }
        if(params['associatedUserID'] !== undefined){
            _params.associatedUserID = params['associatedUserID'] ;
        }
        var expandParams = {};
        /*
         * @params expiresabs:暂时不用
         * @params expires:暂时无效
         * @params type:扩展类型，目前只有count一种扩展类型，之后如需扩展可在此处进行相应变动 , String (目前直播才有用)
         * @params write2DB:暂时无效, Boolean (目前直播才有用)
         * @params actions:执行的动作操作列表，目前只有0，1 (0-不操作，1-代表增加操作), Array (目前直播才有用)
         * @params do_not_replace:老师和助教不能同时操作，后操作的服务器直接丢弃, Boolean (目前直播才有用)
         * */
        for(var key in params){
            if(_params[key] === undefined && params[key] !== undefined && key !== 'save' && key !== 'name' && key !== 'msgName' && key !== 'id' && key !== 'msgId'
                && key !== 'toID' && key !== 'toId' && key !== 'data' && key !== 'associatedMsgID' && key !== 'associatedUserID'){
                expandParams[key] =  params[key];
                // _params[key] = params[key];
            }
        }
        _params.expandParams = expandParams;
        _sendMessageSocket('pubMsg',_params);
    };

    /*发送DelMsg信令功能函数,删除之前发送的信令
     * @allParams params:delMsg需要的所有参数承接对象
     * @params name:信令名字 , String
     * @params id:信令ID , String
     * @params toID:发送给谁(默认发给所有人) , String
             __all（所有人，包括自己） ,
             __allExceptSender （除了自己以外的所有人）,
             userid（指定id发给某人） ,
             __none （谁也不发，只有服务器会收到）,
             __allSuperUsers（只发给助教和老师）,
             __group:groupA:groupB(发送给指定组，组id不能包含冒号),
             __groupExceptSender:groupA（发给指定组，不包括自己）
     * @params data:信令携带的数据 , Json/JsonString
     * */
    that.delMsg=function(params) {
        var name, id, toID, data ;
        if(arguments.length === 1 && params && typeof params === 'object'){
            name =  params['name'] || params['msgName'];
            id = params['id'] || params['msgId'];
            toID =   params['toID'] || params['toId'];
            data =  params['data'];
        }else{
            name =  arguments[0];
            id = arguments[1];
            toID =  arguments[2];
            data =  arguments[3];
        }
        var _params = {};
        _params.name=name;
        _params.id=id || _params.name;
        _params.toID=toID || '__all';
        _params.data=data;
        if(_params.name === undefined || _params.name  === null){
            L.Logger.error('[tk-fake-sdk]delMsg name is must exist!');
            return ;
        }
        if(_params.id === undefined || _params.id  === null){
            L.Logger.error('[tk-fake-sdk]delMsg id is must exist!');
            return ;
        }
        _sendMessageSocket('delMsg',_params);
    };

    /*改变用户属性
     * @params id:用户id , String
     * @params tellWhom:发送给谁( __all , __allExceptSender , userid , __none ,__allSuperUsers) , String
     * @params properties:需要改变的用户属性 , Json*/
    that.changeUserProperty=function(id, tellWhom, properties) {
        if ( TK.isOnlyAudioRoom && properties.publishstate !== undefined && (properties.publishstate === TK.PUBLISH_STATE_VIDEOONLY || properties.publishstate === TK.PUBLISH_STATE_BOTH) ) {
            L.Logger.warning('[tk-fake-sdk]The publishstate of a pure audio room cannot be ' + properties.publishstate + '!');
            return;
        }

        if (properties === undefined || id === undefined){
            L.Logger.error('[tk-fake-sdk]changeUserProperty properties or id is not exist!');
            return  ;
        }
        var params = {};
        params.id = id;
        params.toID = tellWhom || '__all';
        var user = _users[id] ;
        if(!user){L.Logger.error('[tk-fake-sdk]user is not exist , user id: '+id+'!'); return ;} ;
        if( !(properties && typeof properties === 'object') ){L.Logger.error('[tk-fake-sdk]properties must be json , user id: '+id+'!'); return ;} ;
        params.properties = properties;
        _sendMessageSocket('setProperty',params);
    };

    /*通知伪代理服务器改变窗口的全屏状态*/
    that.changeWebPageFullScreen = function (isFullScreen) {
        _sendMessageSocket('changeWebPageFullScreen',{fullScreen:isFullScreen});
    };

    /*离开房间
    * @params force:是否强制离开*/
    that.leaveroom = function (force) {
        force = force || false ;
        _sendMessageSocket('leaveroom',{force:force});
    };

    /*发送聊天信息功能函数
     * @params textMessage:发送的聊天消息文本 ,String
     * @params toID:发送给谁 , String
     * @params extendJson:扩展的发送的聊天消息数据 , Json
     * */
    that.sendMessage=function(textMessage, toID , extendJson) {
        var params={};
        toID =  toID || "__all" ;
        params.toID = toID;
        var message = {};
        if(typeof textMessage === 'string'){
            var textMessageCopy = L.Utils.toJsonParse(textMessage);
            if(typeof textMessageCopy !== 'object'){
                textMessageCopy = textMessage;
            }
            textMessage = textMessageCopy;
        }
        if(typeof textMessage === 'object'){ //这里兼容以前的处理，如果textMessage是json则拷贝到message里面
            for(var key in textMessage){
                message[key] = textMessage[key] ;
            }
        }else{
            message.msg = textMessage ;
        }
        if(typeof extendJson === 'string'){
            extendJson = L.Utils.toJsonParse(extendJson);
        }
        if( extendJson && typeof extendJson === 'object'){
            for(var key in extendJson){
                message[key] = extendJson[key] ;
            }
        }
        params.message =  L.Utils.toJsonStringify(message); //这里必须转为json字符串
        _sendMessageSocket('sendMessage',params);
    };

    /*发送给伪服务器的action相关的cmd指令
     * @params action:执行的动作 , String
     * @params cmd:执行动作的cmd描述 ， Json */
    that.sendActionCommand = function (action , cmd) {
        if(!action){
            L.Logger.warning('[tk-fake-sdk]sendActionCommand method action can not be empty!');
            return;
        }
        _sendMessageSocket('sendActionCommand',{ action:action , cmd:cmd });
    };

    that.setLocalStorageItem = function( key , value ){
        _sendMessageSocket('saveValueByKey',{ key:''+key , value:''+value });
    };

    that.getLocalStorageItem = function ( key , callback ) {
        var _callback = undefined ;
        if( typeof callback === 'function' ){
            _callback = function ( value ) {
				if(value === null || value === undefined || value === 'null' || value === 'undefined'){
					value = '';
				}
                callback( ''+value );
            };
        }
        _sendMessageSocket('getValueByKey',{ key:''+key  } , _callback );
    };

    /*退出视频标注
     * @params state:"media"：表示共享的是服务器的媒体文件 ，  "file"：表示共享的是本地的媒体文件，String
     * */
    that.exitAnnotation = function(state){
        if(typeof state !== "string"){
            L.Logger.error('[tk-fake-sdk]state is not a string');
            return ;
        }
        _sendMessageSocket('exitAnnotation' , state);
    };

    /*注册白板管理器的托管服务
     * @params <WhiteboardManagerInstance>whiteboardManagerInstance 白板管理器
     * */
    that.registerRoomWhiteBoardDelegate = function(  whiteboardManagerInstance ){
        if( whiteboardManagerInstance && whiteboardManagerInstance.className === 'TKWhiteBoardManager' && typeof whiteboardManagerInstance.registerRoomDelegate === 'function' ){
            _whiteboardManagerInstance = whiteboardManagerInstance ;
            if( _whiteboardManagerInstance ){
                if(  _whiteboardManagerInstance.registerRoomDelegate ){
                    var _receiveActionCommand = function( action , cmd ){
                        //action:whiteboardSdkNotice_ShowPage(翻页消息通知给sdk)
                        L.Logger.debug( '[tk-sdk]receive whiteboard sdk action command（action,cmd）:' , action , cmd );
                        that.sendActionCommand(action , cmd);
                    };
                    _whiteboardManagerInstance.registerRoomDelegate( that , _receiveActionCommand );
                    // _whiteboardManagerInstance.registerRoomDelegate( that );
                }
                if( _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                    var updateeCommonWhiteBoardConfigration = {};
                    if( _web_protocol && _web_host && _web_port !== undefined ){
                        updateeCommonWhiteBoardConfigration.webAddress = {
                            protocol:_web_protocol,
                            hostname:_web_host,
                            port: _web_port,
                        }; //php服务器地址
                    }
                    if( _doc_protocol && _doc_host && _doc_port !== undefined ){
                        updateeCommonWhiteBoardConfigration.webAddress = {
                            protocol:_doc_protocol,
                            hostname:_doc_host,
                            port: _doc_port,
                        }; //文档服务器地址
                    }
                    if(_backup_doc_host_list.length){
                        var backupDocAddressList = [];
                        for(var i=0,length=_backup_doc_host_list.length;i<length;i++){
                            backupDocAddressList.push({
                                protocol:_backup_doc_protocol,
                                hostname:_backup_doc_host_list[i],
                                port: _backup_doc_port,
                            });
                        }
                        updateeCommonWhiteBoardConfigration.backupDocAddressList = backupDocAddressList;
                    }
                    if( _myself.id !== undefined ){
                        updateeCommonWhiteBoardConfigration.myUserId =  _myself.id  ; //我的userID
                    }
                    if( _myself.nickname !== undefined ){
                        updateeCommonWhiteBoardConfigration.myName =  _myself.nickname  ; //我的名字
                    }
                    if( _myself.role !== undefined ){
                        updateeCommonWhiteBoardConfigration.myRole =  _myself.role  ; //我的角色
                    }
                    updateeCommonWhiteBoardConfigration.isPlayback = _isPlayback  ; //是否是回放
                    updateeCommonWhiteBoardConfigration.deviceType = TK.global.fakeJsSdkInitInfo.deviceType; //phone , pad  , windowClient , macClient
                    updateeCommonWhiteBoardConfigration.clientType = TK.global.fakeJsSdkInitInfo.mobileInfo.clientType; //android , ios
                    _whiteboardManagerInstance.changeCommonWhiteBoardConfigration(updateeCommonWhiteBoardConfigration);
                }
            }
        }else{
            L.Logger.warning('[tk-sdk]register whiteboardManagerInstance not is a TKWhiteBoardManager instance class , cannot execute registerRoomWhiteBoardDelegate method.');
        }
    };

    /*事件绑定以及处理函数Map映射关系*/
    socketBindListMap = {
        'setProperty':function (messages) {
            L.Logger.debug('[tk-fake-sdk]setProperty info:' , L.Utils.toJsonStringify(messages) );
            var param = messages;
            var userid = param.id;
            if(param.hasOwnProperty("properties")){
                var properties =  param.properties;
                var user = _users[userid];
                if (_myself.id === userid ) {
                    user = _myself;
                }
                if (user === undefined){
                    L.Logger.error( '[tk-fake-sdk]setProperty user is not exist , userid is '+userid+'!'  );
                    return;
                }
                for (var key in properties) {
                    if (key !== 'id' && key !== 'watchStatus'){
                        user[key]=properties[key];
                    }
                }
                var roomEvt = TK.RoomEvent({type: 'room-userproperty-changed', user:user, message:properties} , { fromID:param.fromID} );
                that.dispatchEvent(roomEvt);
                if( _roomMode === window.TK.ROOM_MODE.BIG_ROOM ){
                    if(userid !== _myself.id && _users[userid].role !== window.TK.ROOM_ROLE.TEACHER && _users[userid].role !== window.TK.ROOM_ROLE.ASSISTANT){ //角色不是老师和助教且下台用户，则从列表中删除
                        if(_users[userid].publishstate === TK.PUBLISH_STATE_NONE){
                            delete  _users[userid] ;
                        }
                    }
                }
            }
        } ,
        'participantLeft':function (userid , leaveTs) {
            L.Logger.debug('[tk-fake-sdk]participantLeft userid:' + userid);
            var user = _users[userid];
            if (user === undefined){
                L.Logger.error( '[tk-fake-sdk]participantLeft user is not exist , userid is '+userid+'!'  );
                return;
            }
            L.Logger.info('[tk-fake-sdk]user leave room  , user info: '+L.Utils.toJsonStringify(user) );
            if( _isPlayback && leaveTs !== undefined){
                user.leaveTs = leaveTs ;
            }
            if(!_rolelist[user.role]) { _rolelist[user.role] = {} };
            if(!_isPlayback){
                delete _rolelist[user.role][userid] ;
                delete _users[userid];
            }else{
                if(_users[userid]){
                    _users[userid].playbackLeaved = true ;
                }
            }
            if( _isPlayback && typeof userid === 'object' ){
                var userinfo = userid ;
                user.leaveTs = userinfo.ts ;
            }
            var roomEvt = TK.RoomEvent({type: 'room-participant_leave', user: user});
            that.dispatchEvent(roomEvt);
        } ,
        'participantJoined':function (userinfo) {
            L.Logger.debug('[tk-fake-sdk]participantJoined userinfo:'+ L.Utils.toJsonStringify(userinfo) );
            var user = TK.RoomUser(userinfo);
            L.Logger.info('[tk-fake-sdk]user join room  , user info: '+L.Utils.toJsonStringify(user) );
            /*if (user === undefined) {
                return;
             }*/
            if(!_rolelist[user.role]) { _rolelist[user.role] = {} };
            _rolelist[user.role][user.id] = user ;
            _users[user.id]=user;
            if(_isPlayback && _users[user.id]){
                delete _users[user.id].playbackLeaved ;
            }
            if( _isPlayback && typeof userinfo === 'object'  ){
                user.joinTs = userinfo.ts ;
            }
            var roomEvt = TK.RoomEvent({type: 'room-participant_join', user: user});
            that.dispatchEvent(roomEvt);
        },
        'participantEvicted':function (messages) {
            messages = messages || {} ;
            L.Logger.info('[tk-fake-sdk]user evicted room  , user info: '+L.Utils.toJsonStringify(_myself) + ' , participantEvicted  messages:'+ L.Utils.toJsonStringify(messages) );
            // that.leaveroom(true);
            var roomEvt = TK.RoomEvent({type: 'room-participant_evicted' , message:messages , user:_myself});
            that.dispatchEvent(roomEvt);
        },
        'pubMsg':function (messages) {
            L.Logger.debug( '[tk-fake-sdk]pubMsg info:' ,  L.Utils.toJsonStringify(messages) );
            if(messages && typeof messages === 'string'){
                messages = L.Utils.toJsonParse(messages);
            }
            if(messages.data && typeof messages.data === 'string'){
                messages.data = L.Utils.toJsonParse(messages.data);
            }
            if (messages.name === 'OnlyAudioRoom') {
                _handleSwitchOnlyAudioRoom(true , messages.fromID);
            }
            if(messages.name === 'BigRoom'){
                _roomMode = window.TK.ROOM_MODE.BIG_ROOM ;
                _removeBigRoomUsers();
                var roomEvt = TK.RoomEvent({type: 'room-mode-changed', message:{
                    roomMode:_roomMode
                }});
                that.dispatchEvent(roomEvt);
            }
            var roomEvt = TK.RoomEvent({type: 'room-pubmsg', message:messages});
            that.dispatchEvent(roomEvt);
        },
        'delMsg':function (messages) {
            L.Logger.debug( '[tk-fake-sdk]delMsg info:' ,  L.Utils.toJsonStringify(messages) );
            if(messages && typeof messages === 'string'){
                messages = L.Utils.toJsonParse(messages);
            }
            if(messages.data && typeof messages.data === 'string'){
                messages.data = L.Utils.toJsonParse(messages.data);
            }
            if (messages.name === 'OnlyAudioRoom') {
                _handleSwitchOnlyAudioRoom(false , messages.fromID);
            }
            if(messages.name === 'BigRoom'){
                _roomMode = window.TK.ROOM_MODE.NORMAL_ROOM ;
                _removeBigRoomUsers();
                var roomEvt = TK.RoomEvent({type: 'room-mode-changed', message:{
                    roomMode:_roomMode
                }});
                that.dispatchEvent(roomEvt);
            }
            var roomEvt = TK.RoomEvent({type: 'room-delmsg', message:messages});
            that.dispatchEvent(roomEvt);
        } ,
        'sendMessage':function (messages) {
            L.Logger.debug('[tk-fake-sdk]room-text-message info:' + (messages && typeof messages === 'object' ? L.Utils.toJsonStringify(messages) : messages )) ;
            if (!( messages && messages.hasOwnProperty('message') ) ){  L.Logger.error('[tk-fake-sdk]room-text-message messages or messages.message is not exist!'); return;};
            var from = messages.fromID;
            var user = _myself;

            if(_room_properties.roomtype === 10){  //2017-11-13 xgd 是否是直播，是直播user为undefined
                user = undefined;
            } else {
                if (from !== undefined)
                    user = _users[messages.fromID];
                if(!user){L.Logger.error('[tk-fake-sdk]user is not exist , user id:'+messages.fromID+', message from room-text-message!');return ;};
            }
            if( _isPlayback){
                var isString = false ;
                if(messages && messages.message && typeof  messages.message  === 'string' ){
                    messages.message = L.Utils.toJsonParse(messages.message);
                    isString = true ;
                }
                messages.message.ts = messages.ts ; //ms
                if(isString && typeof messages.message === 'object'){
                    messages.message = L.Utils.toJsonStringify( messages.message );
                }
            }
            if(messages && messages.message && typeof  messages.message  === 'string' ){
                messages.message = L.Utils.toJsonParse(messages.message);
            }
            var roomEvt = TK.RoomEvent({type: 'room-text-message', user:user, message:messages.message});
            that.dispatchEvent(roomEvt);
        },
        'roomConnected':function (code, response) {
            L.Logger.debug('[tk-fake-sdk]room-connected code is '+ code +' , response is :'+ L.Utils.toJsonStringify(response) );
            if(code !== 0){
                L.Logger.error('[tk-fake-sdk]connectSocket failure , code is '+ code + ' , response is '+ response) ;
                return ;
            }
            var roominfo = response.roominfo;//房间信息
            var msglist = response.msglist; //各种消息列表，对应pugmsg所有信息
            var userlist = response.userlist;//用户列表，我进入教室后，服务器发送此房间列表给我

            var   roomId, arg;
            that.p2p = roominfo.p2p;
            roomId = roominfo.id;

            _users = {} ;
            _rolelist = {} ;
            if(response.myself && typeof response.myself === 'object'){
                _myself = TK.RoomUser(response.myself);
            }
            if(!_rolelist[_myself.role]) { _rolelist[_myself.role] = {} };
            _rolelist[_myself.role][_myself.id] = _myself ;
            _users[_myself.id]=_myself;

            for (var index in userlist) {
                if (userlist.hasOwnProperty(index)) {
                    var userproperties = userlist[index];
                    var user = TK.RoomUser(userproperties);
                    if (user !== undefined) {
                        if(!_rolelist[user.role]) { _rolelist[user.role] = {} };
                        _rolelist[user.role][user.id] = user ;
                        _users[user.id]=user;
                        if(_isPlayback && _users[user.id]){
                            delete _users[user.id].playbackLeaved ;
                        }
                        L.Logger.info('[tk-fake-sdk]room-connected --> user info: '+L.Utils.toJsonStringify(user) );
                    }
                }
            }
            L.Logger.info('[tk-fake-sdk]room-connected --> myself info: '+L.Utils.toJsonStringify(_myself) );
            var msgs = new Array();
            if(msglist && typeof msglist == "string") {
                msglist = L.Utils.toJsonParse(msglist);
            }
            if (msglist.hasOwnProperty('OnlyAudioRoom')) {
                var messages = msglist['OnlyAudioRoom'];
                _handleSwitchOnlyAudioRoom(true ,  messages.fromID);
            }
            if(  msglist.hasOwnProperty('BigRoom') ){
                _roomMode = window.TK.ROOM_MODE.BIG_ROOM ;
                _removeBigRoomUsers();
            }else{
                _roomMode = window.TK.ROOM_MODE.NORMAL_ROOM ;
            }
            var roomEvt = TK.RoomEvent({type: 'room-mode-changed', message:{
                roomMode:_roomMode
            }});
            that.dispatchEvent(roomEvt);
            for (index in msglist) {
                if (msglist.hasOwnProperty(index)) {
                    msgs.push(msglist[index]);
                }
            }
            msgs.sort(function(obj1, obj2){
                if (obj1 === undefined || !obj1.hasOwnProperty('seq') || obj2 === undefined || !obj2.hasOwnProperty('seq'))
                    return 0;
                return obj1.seq - obj2.seq;
            });

            // 3 - Update RoomID
            that.roomID = roomId;
            L.Logger.debug('[tk-fake-sdk]Connected to room ' + that.roomID);
            L.Logger.debug('[tk-fake-sdk]connected response:' , L.Utils.toJsonStringify(response));
            L.Logger.info('[tk-fake-sdk]room-connected  signalling list length '+ msgs.length);
            if( _whiteboardManagerInstance){
                if( _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                    var backupDocAddressList = [];
                    for(var i=0,length=_backup_doc_host_list.length;i<length;i++){
                        backupDocAddressList.push({
                            protocol:_backup_doc_protocol,
                            hostname:_backup_doc_host_list[i],
                            port: _backup_doc_port,
                        });
                    }
                    _whiteboardManagerInstance.changeCommonWhiteBoardConfigration({
                        webAddress:{
                            protocol:_web_protocol,
                            hostname:_web_host,
                            port: _web_port,
                        }  , //php服务器地址
                        docAddress:{
                            protocol:_doc_protocol,
                            hostname:_doc_host,
                            port: _doc_port,
                        }, //文档服务器地址
                        backupDocAddressList:backupDocAddressList , //备份文档服务器地址列表
                        myUserId: _myself.id , //我的userID
                        myName: _myself.nickname ,  //我的名字
                        myRole: _myself.role ,  //我的角色
                        isConnectedRoom:true , //是否已经连接房间
                        isPlayback:_isPlayback , //是否是回放
                        deviceType:TK.global.fakeJsSdkInitInfo.deviceType, //phone , pad  , windowClient , macClient
                        clientType:TK.global.fakeJsSdkInitInfo.mobileInfo.clientType, //android , ios
                    });
                }
            }
            var connectEvt = TK.RoomEvent({type: 'room-connected', streams: [], message:msgs});
            that.dispatchEvent(connectEvt);
            return true ;
        },
        'disconnect':function (messages) {
            L.Logger.debug('[tk-fake-sdk]room-disconnected' );
            _resetRoomState();
            if( _whiteboardManagerInstance ){
                if( _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                    _whiteboardManagerInstance.changeCommonWhiteBoardConfigration({
                        isConnectedRoom:false , //是否已经连接房间
                    });
                }
            }
            var disconnectEvt = TK.RoomEvent({type: 'room-disconnected' , message: messages || 'unexpected-disconnection' });
            that.dispatchEvent(disconnectEvt);
        },
        'reconnecting':function (reconnectingNum) {
            L.Logger.debug('[tk-fake-sdk]reconnecting info:' , reconnectingNum) ;
            var disconnectEvt = TK.RoomEvent({type: 'room-reconnecting',
                message: {number:reconnectingNum , info:'room-reconnecting number:'+ reconnectingNum }});
            that.dispatchEvent(disconnectEvt);
        },
        'reconnected':function (message) {
            var roomEvt = TK.RoomEvent({type: 'room-reconnected', message:message});
            that.dispatchEvent(roomEvt);
        },
        'leaveroom':function (message) {
            if( _whiteboardManagerInstance ){
                if( _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                    _whiteboardManagerInstance.changeCommonWhiteBoardConfigration({
                        isConnectedRoom:false , //是否已经连接房间
                    });
                }
            }
            var roomEvt = TK.RoomEvent({type: 'room-leaveroom', message:message});
            that.dispatchEvent(roomEvt);
        },
        'checkroom':function (response) {
            var userinfo = {};
            var nRet = response.result;
            var room;
            var pullInfo  ;
            if (nRet == 0) {
                room = response.room;
                pullInfo = response.pullinfo ;

                room.roomtype =  Number( room.roomtype ) ;
                room.maxvideo =  parseInt( room.maxvideo ) ;
                response.roomrole =  Number( response.roomrole ) ;
                var  pullConfigureJson = {};
                var pushConfigureJson = {} ;
                if(pullInfo && pullInfo.data && pullInfo.data.pullConfigureList){
                    var pullConfigureList = pullInfo.data.pullConfigureList ;
                    for(var i in pullConfigureList){
                        var pullConfigure = pullConfigureList[i] ;
                        pullConfigureJson[ pullConfigure.pullProtocol ] =  pullConfigure.pullUrlList ;
                    }
                }
                if(pullInfo && pullInfo.data && pullInfo.data.pushConfigureInfo){
                    var pushConfigureInfo = pullInfo.data.pushConfigureInfo ;
                    for(var i in pushConfigureInfo){
                        var pushConfigure = pushConfigureInfo[i] ;
                        pushConfigureJson[ pushConfigure.pushProtocol ] =  pushConfigure ;
                    }
                }
                room.pullConfigure = pullConfigureJson ;
                room.pushConfigure = pushConfigureJson ;

                _room_properties = room;

                _room_name = room.roomname;
                _room_type = room.roomtype ;
                _is_room_live = (_room_type === 10) ;
                _room_max_videocount = room.maxvideo;

                userinfo.properties = {};
                userinfo.properties.role =response.roomrole  ;
                userinfo.properties.nickname = response.nickname;
                var id = response.thirdid;

                if(id !== undefined && id != "0" && id != ''){
                    userinfo.id = id;
                }
                _myself = TK.RoomUser(userinfo);
                if(_isPlayback){
                    _room_id = room.serial+"_"+_myself.id;
                    if( _room_id && _room_id.indexOf(':playback') === -1 ){
                        _room_id +=":playback" ;
                    }
                }else{
                    _room_id = room.serial;
                }
                L.Logger.info('[tk-fake-sdk]'+(_isPlayback?'initPlaybackInfo to checkroom finshed-->':'')+'_room_max_videocount:'+_room_max_videocount  , 'my id:'+_myself.id , 'room id:'+_room_id  , 'room properties chairmancontrol is:'+ (_room_properties.chairmancontrol ? (window.__TkSdkBuild__ ? L.Utils.encrypt(_room_properties.chairmancontrol):_room_properties.chairmancontrol)  : undefined ) );
            }else{
                L.Logger.warning('[tk-fake-sdk]checkroom failure code is '+ nRet);
            }
            var roomEvt = TK.RoomEvent({type: _isPlayback?'room-checkroom-playback':'room-checkroom', message:{
                ret:nRet ,
                userinfo:userinfo ,
                roominfo:response ,
            }});
            that.dispatchEvent(roomEvt);
        },
        'updateWebAddressInfo':function ( updateWebAddress ) {
            _web_protocol = updateWebAddress.web_protocol || _web_protocol;
            _web_host = updateWebAddress.web_host || _web_host ;
            _web_port = updateWebAddress.web_port || _web_port ;
            _doc_protocol = updateWebAddress.doc_protocol || _doc_protocol;
            _doc_host = updateWebAddress.doc_host || _doc_host ;
            _doc_port = updateWebAddress.doc_port || _doc_port ;
            _backup_doc_protocol = updateWebAddress.backup_doc_protocol || _backup_doc_protocol;
            _backup_doc_host = updateWebAddress.backup_doc_host || _backup_doc_host ;
            _backup_doc_port = updateWebAddress.backup_doc_port || _backup_doc_port ;
            _backup_doc_host_list = updateWebAddress.backup_doc_host_list || _backup_doc_host_list ;
            if(_doc_host === undefined){
                _doc_host = _web_host ;
            }
            if(_doc_port === undefined){
                _doc_port = _web_port ;
            }
            if(_backup_doc_host === undefined){
                _backup_doc_host = _web_host ;
            }
            if(_backup_doc_port === undefined){
                _backup_doc_port = _web_port ;
            }
            if(!_backup_doc_host_list.length){
                _backup_doc_host_list = [_backup_doc_host];
            }
            if( _whiteboardManagerInstance && _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                var backupDocAddressList = [];
                for(var i=0,length=_backup_doc_host_list.length;i<length;i++){
                    backupDocAddressList.push({
                        protocol:_backup_doc_protocol,
                        hostname:_backup_doc_host_list[i],
                        port: _backup_doc_port,
                    });
                }
                _whiteboardManagerInstance.changeCommonWhiteBoardConfigration({
                    webAddress:{
                        protocol:_web_protocol,
                        hostname:_web_host,
                        port: _web_port,
                    } , //php服务器地址
                    docAddress:{
                        protocol:_doc_protocol,
                        hostname:_doc_host,
                        port: _doc_port,
                    }, //文档服务器地址
                    backupDocAddressList:backupDocAddressList , //备份文档服务器地址列表
                });
            }
            var Evt = TK.RoomEvent( {type: 'room-serveraddress-update', message:{
                web_protocol:_web_protocol  , web_host:_web_host , web_port:_web_port ,
                doc_protocol:_doc_protocol , doc_host:_doc_host ,doc_port:_doc_port ,
                backup_doc_protocol:_backup_doc_protocol , backup_doc_host:_backup_doc_host ,backup_doc_port:_backup_doc_port ,
                backup_doc_host_list:_backup_doc_host_list
            } } );
            that.dispatchEvent(Evt);
        },
        'updateFakeJsSdkInitInfo':function (updateData) {
            for(var key in updateData){
                var value = updateData[key];
                if(value && typeof value === 'object'){
                    TK.global.fakeJsSdkInitInfo[key] = TK.global.fakeJsSdkInitInfo[key] || {} ;
                    for(var innerKey in value){
                        TK.global.fakeJsSdkInitInfo[key][innerKey] = value[innerKey] ;
                    }
                }else{
                    TK.global.fakeJsSdkInitInfo[key] = value ;
                }
            }
            if(updateData.debugLog){
                that.setLogIsDebug(TK.global.fakeJsSdkInitInfo.debugLog);
            }
            _isPlayback = TK.global.fakeJsSdkInitInfo.playback ;
            if( _whiteboardManagerInstance && _whiteboardManagerInstance.changeCommonWhiteBoardConfigration ){
                _whiteboardManagerInstance.changeCommonWhiteBoardConfigration({
                    isPlayback:_isPlayback,  //是否是回放
                    deviceType:TK.global.fakeJsSdkInitInfo.deviceType, //phone , pad  , windowClient , macClient
                    clientType:TK.global.fakeJsSdkInitInfo.mobileInfo.clientType, //android , ios
                });
            }
            var Evt = TK.RoomEvent({type: 'room-updateFakeJsSdkInitInfo', message:updateData });
            that.dispatchEvent(Evt);
        },
        'receiveActionCommand':function (action , cmd) {
            /*目前需要接收的指令有：
             1）更新加载组件的名字（action:'updateLoadComponentName' , cmd:{loadComponentName:loadComponentName} ）， qt客户端加载视频标注用得到
             2) 改变动态ppt的大小（action:'changeDynamicPptSize' , cmd:{width:width , height:height} )  , ios移动端需要用
             3）关闭动态PPT界面里的视频播放（action:'closeDynamicPptWebPlay' , cmd:{} ), 移动端需要
             4）接收全屏的状态通知（action:'fullScreenChangeCallback' , cmd:{isFullScreen:isFullScreen} ) , 移动端需要
             5）回放控制器播放和暂停通知（action:'playbackPlayAndPauseController' , cmd:{play:isPlay} )  , 移动端需要
             6）窗口改变通知：（action:'transmitWindowSize' , cmd:{width:width , height:height} ), 移动端需要
             */
            var Evt = TK.RoomEvent({type: 'room-receiveActionCommand', message:{action:action  , cmd :cmd} });
            that.dispatchEvent(Evt);
        },
        'playback_clearAll':function () {
            if(!_isPlayback){L.Logger.warning('[tk-sdk]No playback environment!');return ;} ;
            //TODO 回放清除所有的数据是否重置房间模式，有待商讨，这里先重置
            _roomMode = window.TK.ROOM_MODE.NORMAL_ROOM ;
            var roomModeEvt = TK.RoomEvent({type: 'room-mode-changed', message:{
                roomMode:_roomMode
            }});
            that.dispatchEvent(roomModeEvt);
            var roomEvt = TK.RoomEvent({type: 'room-playback-clear_all'});
            that.dispatchEvent(roomEvt);
            _playbackClearAll();
        },
        'duration':function (message) {
            if(!_isPlayback){L.Logger.warning('[tk-sdk]No playback environment!');return ;} ;
            var roomEvt = TK.RoomEvent({type: 'room-playback-duration' , message:message });
            that.dispatchEvent(roomEvt);
        },
        'playbackEnd':function () {
            if(!_isPlayback){L.Logger.warning('[tk-sdk]No playback environment!');return ;} ;
            var roomEvt = TK.RoomEvent({type: 'room-playback-playbackEnd'});
            that.dispatchEvent(roomEvt);
        },
        'playback_updatetime':function (message) {
            if(!_isPlayback){L.Logger.warning('[tk-sdk]No playback environment!');return ;} ;
            var roomEvt = TK.RoomEvent({type: 'room-playback-playback_updatetime' , message:message });
            that.dispatchEvent(roomEvt);
        },
        'msgList':function (messages) {
            L.Logger.debug('[tk-sdk]msgList info:' , L.Utils.toJsonStringify(messages) );
            var roomEvt = TK.RoomEvent({type: 'room-msglist', message:messages});
            that.dispatchEvent(roomEvt);
        } ,
        'participantPublished':function (userinfo) {
            if(typeof userinfo === 'string'){
                userinfo =  L.Utils.toJsonParse(userinfo);
            }
            L.Logger.debug('[tk-sdk]participantPublished userinfo:'+ L.Utils.toJsonStringify(userinfo) );
            if( _roomMode === window.TK.ROOM_MODE.BIG_ROOM ){
                var userCopy = TK.RoomUser(userinfo);
                var user =  _users[userCopy.id] ;
                if( user ){
                    for(var key in userCopy ){
                        user[key] = userCopy [key] ;
                    }
                }else{
                    user = userCopy ;
                }
                _users[user.id]=user;
                if(_isPlayback && _users[user.id]){
                 delete _users[user.id].playbackLeaved ;
                 }
                if( _isPlayback && typeof userinfo === 'object'  ){
                    user.joinTs = userinfo.ts ;
                }
            }
        },
    };

   /*发送消息给中间伪代理服务器*/
    function _sendMessageSocket(type, msg, callback ) {
        L.Logger.debug('[tk-fake-sdk]sendMessageSocket', type, msg);
        /*that.socket.emit(type+TK.extendSendInterfaceName, msg, function (respType, respmsg) {
            if (respType === 'success') {
                L.Logger.debug('[tk-fake-sdk]sendMessageSocket success', msg, respmsg);
                if (callback && typeof callback === 'function'){
                    callback(respmsg)
                };
            } else if (respType === 'error'){
                L.Logger.debug('[tk-fake-sdk]sendMessageSocket error', msg, respmsg);
                if (error && typeof error === 'function'){
                    error(respmsg);
                }
            } else {
                L.Logger.debug('[tk-fake-sdk]sendMessageSocket [respType ， msg ， respmsg ] is  ',respType ,  msg, respmsg);
                if (callback && typeof callback === 'function'){
                    callback(respmsg)
                };
            }

        });*/
        that.socket.emit(type, msg , callback);
    };

    /*重置房间状态*/
    function _resetRoomState() {
        if (_users != undefined) {
            _clearRoleList(_rolelist);
            _clearUsers(_users);
        }
        if(_myself){
            _myself.publishstate = TK.PUBLISH_STATE_NONE;
        }
    };

    /*清空所有用户*/
    function _clearUsers(obj) {
        if(!_isPlayback){ //回放则不清空用户列表
            for(var key in obj){
                delete obj[key];
            }
        }else{
            for(var key in obj){
                obj[key].playbackLeaved = true;
            }
        }
    };

    /*清空所有角色列表*/
    function _clearRoleList(obj) {
        if(!_isPlayback){//回放则不清空角色列表
            for(var key in obj){
                delete obj[key];
            }
        }
    };

    /*回放清除所有sdk相关数据*/
    function _playbackClearAll() {
        if(!_isPlayback){L.Logger.error('[tk-fake-sdk]No playback environment, no execution playbackClearAll!');return ;} ;
        if (_users != undefined) {
            _clearRoleList(_rolelist);
            _clearUsers(_users);
        }
        if(_myself != null){
            _myself.publishstate = TK.PUBLISH_STATE_NONE;
        }
    };

    /*处理纯音频教室的切换
     * @params isOnlyAudioRoom:是否是纯音频*/
    function _handleSwitchOnlyAudioRoom(isOnlyAudioRoom, fromID) {
        if (TK.isOnlyAudioRoom === isOnlyAudioRoom) {
            return;
        }
        TK.isOnlyAudioRoom = isOnlyAudioRoom;
        var connectEvt = TK.RoomEvent({type: 'room-audiovideostate-switched',  message:{fromId:fromID ,  onlyAudio:TK.isOnlyAudioRoom }});
        that.dispatchEvent(connectEvt);
    }

    function _removeBigRoomUsers() {
        if(_roomMode === window.TK.ROOM_MODE.BIG_ROOM ){
            for(var userid in _users){
                if(userid !== _myself.id && _users[userid].role !== window.TK.ROOM_ROLE.TEACHER && _users[userid].role !== window.TK.ROOM_ROLE.ASSISTANT){ //角色不是老师和助教且下台用户，则从列表中删除
                    if(_users[userid].publishstate === TK.PUBLISH_STATE_NONE){
                        delete  _users[userid] ;
                    }
                }
            }
        }
    }

    that.setLogIsDebug(TK.global.fakeJsSdkInitInfo.debugLog);
    if(TK.SDKNATIVENAME === 'QtNativeClientRoom'){ //初始化QT客户端变量
        try{
            if(qt && qt.webChannelTransport){
                new QWebChannel(qt.webChannelTransport, function(channel) {
                    window.qtContentTkClient = channel.objects.bridge;
                    for(var type in socketBindListMap){ //绑定socket相关的事件
                        that.socket.on(type , socketBindListMap[type]);
                    }
                    that.socket.bindAwitSocketListEvent();
                    L.Logger.debug('[tk-sdk]qtWebChannel init finshed!');
                    var roomEvt = TK.RoomEvent({type: 'room-qtWebChannel-finshed'});
                    that.dispatchEvent(roomEvt);
                });
            }
        }catch (e){
            L.Logger.error('[tk-fake-sdk]qt or qt.webChannelTransport is not exist  ' );
        }
    }else{
        for(var type in socketBindListMap){ //绑定socket相关的事件
            that.socket.on(type , socketBindListMap[type]);
        }
    }
    return that;
};

;(function () {
    var DEV = false ;
    var _getUrlParams = function(key){
        // var urlAdd = decodeURI(window.location.href);
        var urlAdd = decodeURIComponent(window.location.href);
        var urlIndex = urlAdd.indexOf("?");
        var urlSearch = urlAdd.substring(urlIndex + 1);
        var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");   //reg表示匹配出:$+url传参数名字=值+$,并且$可以不存在，这样会返回一个数组
        var arr = urlSearch.match(reg);
        if(arr != null) {
            return arr[2];
        } else {
            return "";
        }
    };
    if(window.__SDKDEV__ !== undefined && window.__SDKDEV__!== null && typeof window.__SDKDEV__ === 'boolean'){
        try{
            DEV = window.__SDKDEV__ ;
        }catch (e){
            DEV = false ;
        }
    }
    var debug = (DEV || _getUrlParams('debug') );
    window.__TkSdkBuild__ = !debug ;
    if(window.localStorage){
        var debugStr =  debug ? '*' : 'none';
        window.localStorage.setItem('debug' ,debugStr );
    }
})();