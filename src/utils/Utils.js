/*sdk白板工具类
 * @module Utils
 * @description  提供sdk白板所需的工具
 * @author 邱广生
 * @date 2018-04-18
 */
'use strict';
const _isJson = function(obj){
    let isjson = typeof obj === "object" && Object.prototype.toString.call(obj).toLowerCase() === "[object object]" && !obj.length;
    return isjson;
};

if( !( Object && Object.shallowAssign ) || !( Object && Object.customAssign ) ){
    /*浅合并对象*/
    const shallowAssign = function(source) {
        try{
            return Object.assign.apply(Object.assign ,arguments );
        }catch (err){
            let copySource = source;
            for(let i=1 ; i<arguments.length;i++){
                let assignObj = arguments[i];
                if(assignObj && typeof assignObj === 'object'){
                    for(let key in assignObj){
                        copySource[key] = assignObj[key] ;
                    }
                }
            }
           /* if(typeof copySource === 'object'){
                for(let key in copySource){
                    source[key] = copySource[key];
                }
            }*/
            return source ;
        }
    };
    if( !( Object && Object.shallowAssign ) ){
        Object.shallowAssign = shallowAssign ;
    }
    if( !( Object && Object.customAssign ) ){
        Object.customAssign = shallowAssign ;
    }
}

if( !( Object && Object.deepAssign ) ){
    /*深合并对象*/
    Object.deepAssign = function(source) {
        let copySource = source;
        for(let i=1 ; i<arguments.length;i++){
            let assignObj = arguments[i];
            if(assignObj && typeof assignObj === 'object'){
                for(let key in assignObj){
                    if( copySource[key] === undefined ){
                        if( typeof assignObj[key] === 'object' && ( Array.isArray( assignObj[key] )  ||   _isJson( assignObj[key] ) ) ){
                            copySource[key] = Object.deepAssign( Array.isArray( assignObj[key] )? [] : {} , assignObj[key] );
                        }else{
                            copySource[key] = assignObj[key] ;
                        }
                    }else{
                        if(typeof assignObj[key] === 'object' && (  Array.isArray( assignObj[key] )  ||   _isJson( assignObj[key] ) ) ){
                            copySource[key] = Object.deepAssign( Array.isArray( assignObj[key] )? [] : {} , typeof copySource[key] === 'object' ? copySource[key] : ( Array.isArray( assignObj[key] )? [] : {} ) , assignObj[key]);
                        }else{
                            copySource[key] = assignObj[key] ;
                        }
                    }
                }
            }
        }
        /*if(typeof copySource === 'object'){
            for(let key in copySource){
                source[key] = copySource[key];
            }
        }*/
        return source ;
    };
}

// scroll passive events
let passiveEvents = false;
try {
    let opts = Object.defineProperty({}, 'passive', {
        get: function () {
            passiveEvents = { passive: true }
        }
    })
    window.addEventListener('test', null, opts)
} catch (err) {
    console.error('[whiteboarrd-sdk]passiveEvents err:',err);
}

class Utils{
    constructor(){
    }

    /**绑定事件
     @method addEvent
     @param   {element} element 添加事件元素
             {string} eType 事件类型
             {Function} handle 事件处理器
             {Bollean} bol false 表示在事件第三阶段（冒泡）触发，true表示在事件第一阶段（捕获）触发。
     */
    addEvent(element, eType, handle, bol = false){
        try{
            if(element.addEventListener){           //如果支持addEventListener
                element.addEventListener(eType, handle, bol);
            }else if(element.attachEvent){          //如果支持attachEvent
                element.attachEvent("on"+eType, handle);
            }else{                                  //否则使用兼容的onclick绑定
                element["on"+eType] = handle;
            }
        }catch (e){
            L.Logger.error('add dom event fail , event type is '+eType + ' , element:' , element );
        }
    };

    /**事件解绑
     @method removeEvent
     @param   {element} element 删除事件元素
         {string} eType 事件类型
         {Function} handle 事件处理器
         {Bollean} bol false 表示在事件第三阶段（冒泡）触发，true表示在事件第一阶段（捕获）触发。
     */
    removeEvent(element, eType, handle, bol){
        try{
            if(element.addEventListener){
                element.removeEventListener(eType, handle, bol);
            }else if(element.attachEvent){
                element.detachEvent("on"+eType, handle);
            }else{
                element["on"+eType] = null;
            }
        }catch (e){
            L.Logger.error('remove dom event fail , event type is '+eType + ' , element:' , element );
        }
    };

    /*是否是空的json*/
    isEmptyJson(json){
        let keys = Object.keys(json) ;
        return keys.length === 0;
    };

    /*是否处于全屏状态
     @return 返回是否全屏状态
     * */
    isFullScreenStatus(){
        return document.fullscreen ||
            document.mozFullScreen ||
            document.webkitIsFullScreen ||
            document.webkitFullScreen ||
            document.msFullScreen ||
            false;
    };

    /**启动全屏
     @param {element} element 全屏元素
     */
    launchFullscreen(element){
        if(element){
            if(element.requestFullscreen) {
                element.requestFullscreen();
            } else if(element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if(element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if(element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }
    };

    /**退出全屏*/
    exitFullscreen(){
        if(document.exitFullScreen) {
            document.exitFullScreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if(element.msExitFullscreen) {
            element.msExitFullscreen();
        }
    };

    /**返回正处于全屏状态的Element节点，如果当前没有节点处于全屏状态，则返回null。*/
    getFullscreenElement(){
        let fullscreenElement =
            document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement;
        return fullscreenElement;
    };

    /**为全屏添加全屏事件fullscreenchange
     @param {Function} handle 事件处理器
     */
    addFullscreenchange(handle){
        this.addEvent(document,"fullscreenchange",handle,false);
        this.addEvent(document,"webkitfullscreenchange",handle,false);
        this.addEvent(document,"mozfullscreenchange",handle,false);
        this.addEvent(document,"MSFullscreenChange",handle,false);
        this.addEvent(document,"msfullscreenchange",handle,false);
        this.addEvent(document,"fullscreeneventchange",handle,false);
    };

    /**移除全屏添加全屏事件fullscreenchange
     @param   {Function} handle 事件处理器
     */
    removeFullscreenchange(handle){
        this.removeEvent(document,"fullscreenchange",handle,false);
        this.removeEvent(document,"webkitfullscreenchange",handle,false);
        this.removeEvent(document,"mozfullscreenchange",handle,false);
        this.removeEvent(document,"MSFullscreenChange",handle,false);
        this.removeEvent(document,"msfullscreenchange",handle,false);
        this.removeEvent(document,"fullscreeneventchange",handle,false);
    };

    /*浅比较对象
    * @params json1:比较第一个对象，Json
    * @params json2:比较第二个对象，Json
    * */
    shallowCompareJson(json1 , json2){
        return json1 === json2 ;
    }

    /*深比较对象
     * @params json1:比较第一个对象，Json
     * @params json2:比较第二个对象，Json
     * */
    deepCompareJson(json1 , json2){
        if( ( typeof json1 === 'object' && !Array.isArray(json1) ) &&  ( typeof json1 === 'object' && !Array.isArray(json1) ) ){
            let json2Copy = Object.deepAssign({} , json2) ;
            let isEqual = true ;
            for( let [key , value] of Object.entries(json1) ){
               if( json2Copy.hasOwnProperty(key) ){
                    if( value !== json2Copy[key] ){
                        isEqual = false;
                        delete json2Copy[key] ;
                        break ;
                    }else{
                        delete json2Copy[key] ;
                    }
               }else{
                   isEqual = false;
                   break ;
               }
            }
            return isEqual && !Object.keys(json2Copy).length ;
        }else{
            L.Logger.warning('deepCompareJson arguments must is json!');
            return json1 === json2 ;
        }
    }

    /*判断是否是一个方法*/
    isFunction(func){
        return typeof func === 'function' ;
    }

    /*是否是一个json*/
    isJson( obj ){
        return  typeof obj === "object" && Object.prototype.toString.call(obj).toLowerCase() === "[object object]" && !obj.length ;
    }

    /*设置本地存储*/
    setLocalStorageItem( key,value ){
        try{
            if(window.localStorage){
                if(window.localStorage.setItem){
                    window.localStorage.setItem(key , value);
                }else{
                    L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage.setItem , key is '+key+' , value is '+value+'!');
                }
            }else{
                if(!this.isPrintNotSupportLocalStorage){
                    this.isPrintNotSupportLocalStorage = true ;
                    L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage!');
                }
            }
        }catch (err){
            if(!this.isPrintNotSupportLocalStorage){
                this.isPrintNotSupportLocalStorage = true ;
                L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage , error info:' ,err );
            }
        }
    }

    /*获取本地存储*/
    getLocalStorageItem( key ){
        try{
            if(window.localStorage){
                if(window.localStorage.getItem){
                    return window.localStorage.getItem(key);
                }else{
                    L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage.getItem , key is '+key+' !');
                    return "" ;
                }
            }else{
                if(!this.isPrintNotSupportLocalStorage){
                    this.isPrintNotSupportLocalStorage = true ;
                    L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage!');
                }
                return "" ;
            }
        }catch (err){
            if(!this.isPrintNotSupportLocalStorage){
                this.isPrintNotSupportLocalStorage = true ;
                L.Logger.warning('[whiteboard-sdk]Browser does not support localStorage , error info:' ,err );
            }
            return "" ;
        }
    }

    /*转为json字符串*/
    toJsonStringify( json ){
        if(!json){
            return json ;
        }
        try{
            if( !_isJson( json ) ){
                return json ;
            }
            var jsonString = JSON.stringify(json);
            if(jsonString){
                json = jsonString ;
            }
        }catch (e){
        }
        return json ;
    }

    /*json字符串转json*/
    toJsonParse( jsonStr ){
        if(!jsonStr){
            return jsonStr ;
        }
        try{
            if( typeof  jsonStr !== 'string'){
                return jsonStr ;
            }
            var json =  JSON.parse(jsonStr);
            if(json){
                jsonStr = json;
            }
        }catch (e){
        }
        return jsonStr ;
    }

    /*获取PC的sdk版本*/
    getPcSDKVersion(){
        if( YS && YS.getSdkVersion && YS.getSdkVersion() ){
            return Number( YS.getSdkVersion().replace(/./g,'').replace(/v/g,'') ) ;
        }else{
            return 0 ;
        }
    }

    /*拼接CDN地址*/
    getItem(curArray,keyStr,add){
        let item ;
        let indexNum;
        let cdnConnect = (a,b,c) => {return a  + '://'  + b + ':' + c ;};
        if(Array.isArray(curArray)){
            item = curArray.find((item,index) => {
                if (index + 1 === curArray.length) {
                        indexNum = -1;
                    } else {
                        indexNum = index;
                    }
                    return item.hostname === keyStr
                }
            );
            if(add){
                if( indexNum && !isNaN(indexNum) ){
                    if(curArray[indexNum+1]){
                        return curArray[indexNum+1].hostname
                    }else{
                        return '';
                    }
                }else{
                    return '';
                }
            }else{
                if(item && item.protocol && item.hostname && item.port){
                    return cdnConnect(item.protocol,item.hostname,item.port);
                }else{
                    return '';
                }
            }
        }
    };

    /*元素大小改变的监听*/
    onElementResize(el, handler) {
        try{
            if (!(el instanceof HTMLElement)) {
                throw new TypeError("Parameter 1 is not instance of 'HTMLElement'.")
            }
            // https://www.w3.org/TR/html/syntax.html#writing-html-documents-elements
            if (/^(area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style|textarea|title)$/i.test(el.tagName)) {
                throw new TypeError('Unsupported tag type. Change the tag or wrap it in a supported tag(e.g. div).')
            }
            if (typeof handler !== 'function') { throw new TypeError("Parameter 2 is not of type 'function'.") }

            let lastWidth = el.offsetWidth || 1;
            let lastHeight = el.offsetHeight || 1;
            let maxWidth = 10000 * (lastWidth);
            let maxHeight = 10000 * (lastHeight);

            let expand = document.createElement('div');
            expand.style.cssText = 'position:absolute;top:0;bottom:0;left:0;right:0;z-index=-10000;overflow:hidden;visibility:hidden;';
            let shrink = expand.cloneNode(false);

            let expandChild = document.createElement('div');
            expandChild.style.cssText = 'transition:0s;animation:none;';
            let shrinkChild = expandChild.cloneNode(false);

            expandChild.style.width = maxWidth + 'px';
            expandChild.style.height = maxHeight + 'px';
            shrinkChild.style.width = '250%';
            shrinkChild.style.height = '250%';

            expand.appendChild(expandChild)
            shrink.appendChild(shrinkChild)
            el.appendChild(expand);
            el.appendChild(shrink);

            if (expand.offsetParent !== el) {
                el.style.position = 'relative';
            }

            expand.scrollTop = shrink.scrollTop = maxHeight;
            expand.scrollLeft = shrink.scrollLeft = maxWidth;

            let newWidth = 0;
            let newHeight = 0;
            const onResize =  () => {
                if (newWidth !== lastWidth || newHeight !== lastHeight) {
                    lastWidth = newWidth;
                    lastHeight = newHeight;
                    handler();
                }
            }

            const onScroll =  () => {
                newWidth = el.offsetWidth || 1;
                newHeight = el.offsetHeight || 1;
                if (newWidth !== lastWidth || newHeight !== lastHeight) {
                    requestAnimationFrame(onResize);
                }
                expand.scrollTop = shrink.scrollTop = maxHeight;
                expand.scrollLeft = shrink.scrollLeft = maxWidth;
            }

            expand.addEventListener('scroll', onScroll, passiveEvents);
            shrink.addEventListener('scroll', onScroll, passiveEvents);
        }catch (err) {
            L.Logger.error('[whiteboarrd-sdk]onElementResize err:',err);
        }
    }
};
export default new Utils();