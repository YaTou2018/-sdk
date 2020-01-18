/*伪装socket.io类*/
var TK = TK || {};
var JsSocket = {} ;

TK.fakeScoketIO = function (room) {
    var that = {};
    var _callbackList = {} , _allbackSeq = 0 , _awitSocketBindEventList = {};

    /*绑定socket事件列表中的等待绑定的事件*/
    that.bindAwitSocketListEvent = function () {
        for(var type in _awitSocketBindEventList){
            var callback =  _awitSocketBindEventList[type] ;
            delete _awitSocketBindEventList[type] ;
            that.on(type , callback);
        }
    }

    /*绑定socket事件
     * @params type:事件的类型 ， String
     * @params callback:事件的回调函数 ,Function
     * */
    that.on = function (type , callback) {
        if(!type){
            L.Logger.error('[tk-fake-sdk]socket bind event name is must exist!');
            return;
        }
        if(!callback){
            L.Logger.error('[tk-fake-sdk]socket bind event callback is must exist!');
            return;
        }
        var _callback = function () {
            var args = [];
            var argumentsJson = {} ;
            for (var i = 0; i < arguments.length; i++) {
                args[i] = typeof  arguments[i] === 'string' ? L.Utils.toJsonParse( arguments[i] ) :  arguments[i] ;
                argumentsJson[i] =  args[i] ;
            }
            L.Logger.debug("[tk-fake-sdk]logMessage info: receive event("+type+") callback arguments json is "+L.Utils.toJsonStringify(argumentsJson) );
            if(TK.global.fakeJsSdkInitInfo.mobileInfo.isSendLogMessageToProtogenesis && TK.SDKNATIVENAME === 'MobileNativeRoom'){
                if(type !== 'printLogMessage' && type !== 'JsSocketCallback'){
                    that.emit('printLogMessage' , L.Utils.toJsonStringify({eventType:type , receiveData:args}) )
                }
            }
            callback.apply(callback ,args );
        }

        switch (TK.SDKNATIVENAME){
            case 'QtNativeClientRoom':
                if(window.qtContentTkClient){
                    try{
                        L.Logger.debug('[tk-fake-sdk]Bind qt event , event name is '+ type);
                        window.qtContentTkClient[type].connect( _callback ) ;
                    }catch (e){
                        L.Logger.error('[tk-fake-sdk]Bind qt event fail , event name is '+ type  , e);
                    }
                }else{
                    L.Logger.warning('[tk-fake-sdk]window.qtContentTkClient is not exist , save event to list awit socket bind , event name is '+ type +' !')
                    _awitSocketBindEventList[type] = _callback ;
                }
                break;
            case 'MobileNativeRoom':
                L.Logger.debug('[tk-fake-sdk]Bind mobile event , event name is '+ type);
                JsSocket[type] = _callback ;
                break;
            default:
                L.Logger.error("[tk-fake-sdk]socket.on:room is not init , sdkNativeName is "+TK.SDKNATIVENAME+"!");
                break ;
        }
    };

    /*触发socket事件
    * @params type:事件的类型 ， String
    * @params params:事件的参数  , Json
    * @params callback:回调函数 ,Function
    * */
    that.emit = function (type , params , callback) {
        if(type === 'printLogMessage' &&  TK.SDKNATIVENAME !== 'MobileNativeRoom' ){
            L.Logger.warning('[tk-fake-sdk]socket.emit event name is printLogMessage , not emit event , because event triggering must be in the mobile app environment.');
            return ;
        }
        var _params = {} ;
        L.Logger.debug("[tk-fake-sdk]socket.emit event name is "+type);
        if( callback && typeof callback === 'function' ){
            var seq = _getCallbackSeq() ;
            _callbackList[seq] = callback ;
            _params.callbackID = seq ;
        }
        if(typeof params === 'object'){
            for(var key in params){
                if(key !== 'callbackID'){
                    _params[key] = params[key] ;
                }
            }
        }else{
            if(typeof params === 'string'){
                var paramsCopy = L.Utils.toJsonParse(params);
                if(typeof paramsCopy === 'object'){
                    for(var key in paramsCopy){
                        if(key !== 'callbackID'){
                            _params[key] = paramsCopy[key] ;
                        }
                    }
                }else{
                   if(_params.callbackID !== undefined){
                       _params['params'] = params ;
                   }else{
                       _params = params ;
                   }
                }
            }else{
                if(_params.callbackID !== undefined){
                    _params['params'] = params ;
                }else{
                    _params = params ;
                }
            }
        }
        switch (TK.SDKNATIVENAME){
            case 'QtNativeClientRoom':
                if(window.qtContentTkClient){
                    if(window.qtContentTkClient['onWeb_'+type]){
                        L.Logger.debug("[tk-fake-sdk]socket.emit:window.qtContentTkClient."+'onWeb_'+type+" has been performed!");
                        if( _params === undefined ){
                            window.qtContentTkClient['onWeb_'+type]("");
                        }else{
                            if(typeof _params === 'object'){
                                _params = L.Utils.toJsonStringify(_params);
                            }
                            window.qtContentTkClient['onWeb_'+type](_params);
                        }
                    }else{
                        L.Logger.error("[tk-fake-sdk]socket.emit:window.qtContentTkClient."+'onWeb_'+type+" is not exist!");
                    }
                }else{
                    L.Logger.error('[tk-fake-sdk]window.qtContentTkClient is not exist!')
                }
                break;
            case 'MobileNativeRoom':
                var clientType = TK.global.fakeJsSdkInitInfo.mobileInfo.clientType ;
                if(clientType === undefined || clientType === null){
                    if(window.JSWhitePadInterface || window.JSVideoWhitePadInterface){
                        clientType =  L.Constant.clientType.android ;
                    }else if(window.webkit && window.webkit.messageHandlers){
                        clientType =  L.Constant.clientType.ios ;
                    }
                }
                switch (clientType){
                    case L.Constant.clientType.ios://ios
                        if(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[type] ){
                            L.Logger.debug("[tk-fake-sdk]socket.emit:window.webkit.messageHandlers."+type+".postMessage has been performed!");
                            if( _params === undefined){
                                window.webkit.messageHandlers[type].postMessage({"data":""});
                            }else{
                                //_params = _params || "";
                                if(typeof _params === 'object'){
                                    _params = L.Utils.toJsonStringify(_params);
                                }
                                window.webkit.messageHandlers[type].postMessage({"data":_params});
                            }
                        }else{
                            L.Logger.error("[tk-fake-sdk]socket.emit:window.webkit.messageHandlers."+type+".postMessage is not exist!");
                        }
                        break ;
                    case L.Constant.clientType.android://android
                        if(TK.extendSendInterfaceName === '_videoWhiteboardPage'){
                            if(window.JSVideoWhitePadInterface && window.JSVideoWhitePadInterface[type]){
                                L.Logger.debug("[tk-fake-sdk]socket.emit:window.JSVideoWhitePadInterface."+type+" has been performed!");
                                if( _params === undefined ){
                                    window.JSVideoWhitePadInterface[type]("");
                                }else {
                                    if(typeof _params === 'object'){
                                        _params = L.Utils.toJsonStringify(_params);
                                    }
                                    window.JSVideoWhitePadInterface[type]( _params );
                                }
                            }else{
                                L.Logger.error("[tk-fake-sdk]socket.emit:window.JSVideoWhitePadInterface."+type+" is not exist!");
                            }
                        }else{
                            if(window.JSWhitePadInterface && window.JSWhitePadInterface[type]){
                                L.Logger.debug("[tk-fake-sdk]socket.emit:window.JSWhitePadInterface."+type+" has been performed!");
                                if( _params === undefined ){
                                    window.JSWhitePadInterface[type]("");
                                }else{
                                    if(typeof _params === 'object'){
                                        _params = L.Utils.toJsonStringify(_params);
                                    }
                                    window.JSWhitePadInterface[type]( _params );
                                }
                            }else{
                                L.Logger.error("[tk-fake-sdk]socket.emit:window.JSWhitePadInterface."+type+" is not exist!");
                            }
                        }
                        break;
                    default:
                        L.Logger.error('[tk-fake-sdk]clientType is undefinable , will not be able to execute method '+type+' , clientType is '+clientType);
                        break;
                }
                break;
            default:
                L.Logger.error("[tk-fake-sdk]socket.emit:room is not init , sdkNativeName is "+TK.SDKNATIVENAME+"!");
                break ;
        }
    };

    /*接收回调消息，执行回调函数
    * @params callbackID:回调函数的id , Int
    * @params params:回调函数的参数 ， AllType */
    that.on('JsSocketCallback' , function (callbackID , params) {
        if( _callbackList[callbackID] ){
            if( typeof _callbackList[callbackID] === 'function'){
                _callbackList[callbackID](params);
            }
            delete _callbackList[callbackID] ;
        }
    });

    /*获取回调函数使用的seq*/
    function _getCallbackSeq() {
        return ++_allbackSeq;
    };

    return that ;
};