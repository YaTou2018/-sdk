/**
 * H5文档中间层处理类
 * @class H5DocumentIntermediateLayer
 * @description  提供H5文档中间层处理类
 * @author 邱广生
 * @date 2018-04-24
 */
'use strict';

class H5DocumentIntermediateLayer{
    constructor(){
        this.defaultProductionOptions = { //默认的h5文档生产配置选项
            synchronizationH5Document:true , //是否同步h5文档
            h5DocumentActionClick:true , //h5文档的点击权限
            maxForceReloadNumber:10 , //最多能强制重连的次数
            forceReloadInterval:60000 , //重新加载的间隔 ， ms
            languageType:'ch' , //语言类型，默认ch ,  languageType的值有 ch / tw / en  , ch:简体中文，tw:繁体中文 ， en:英文
        };
        this.h5DocumentInstanceIDPrefix = "h5Document_" ;
        this.h5DocumentInstanceDefaultID = "h5Document_"+'default' ;
        this.h5DocumentInstanceStore = {} ; //h5文档实例存储中心
        this.uniqueH5Document = false ; //唯一的h5文档
        this.specialH5DocumentInstanceIDPrefix = 'specialH5DocumentInstanceIDPrefix_' ;
    };

    /*初始化h5文档权限
     * @params
     h5DocumentElementId:h5文档元素id（string , required） thumbnailId:缩略图元素id（string ） ，
     options:配置项(object)
     */
    productionH5Document({h5DocumentElementId   , productionOptions = {} , handler = {} , id  } = {} ){
        if( !h5DocumentElementId ){L.Logger.error('h5DocumentElementId is required!'); return ;}
        let h5DocumentInstanceID =  this._getH5DocumentInstanceID(id)  ;
        let h5DocumentInstance = this.getH5DocumentInstanceByID(h5DocumentInstanceID);
        if(h5DocumentInstance){L.Logger.error( 'The production h5Document(h5DocumentInstanceID:'+h5DocumentInstanceID+') fails, the h5Document already exists!' ) ;return  h5DocumentInstance;}
        h5DocumentInstance = {} ;
        productionOptions = Object.deepAssign( {} , this.defaultProductionOptions , productionOptions  ) ;

        let h5DocumentElement = document.getElementById(h5DocumentElementId);
        if(!h5DocumentElement){L.Logger.error( 'H5Document elements do not exist , element id is:'+h5DocumentElementId+'!' ) ;return h5DocumentInstance;}

        let h5DocumentInstanceElement =  document.createElement('div');
        let h5DocumentInstanceElementId =  h5DocumentElementId+'_h5DocumentInstance' ;
        h5DocumentInstanceElement.className = 'h5Document-instance-element' ;
        h5DocumentInstanceElement.id =  h5DocumentInstanceElementId ;
        h5DocumentInstanceElement.style.width = '100%' ;
        h5DocumentInstanceElement.style.height = '100%' ;

        let h5DocumentIframeElement =  document.createElement('iframe');
        let h5DocumentIframeElementId =  h5DocumentElementId+'_h5DocumentIframe' ;
        h5DocumentIframeElement.className = 'h5Document-iframe-element' ;
        h5DocumentIframeElement.id =  h5DocumentIframeElementId ;
        h5DocumentIframeElement.name =  h5DocumentElementId+"_h5DocumentIframeName" ;
        h5DocumentIframeElement.allowFullScreen =  true ;
        h5DocumentIframeElement.allow = 'autoplay' ;
        h5DocumentIframeElement.frameborder =  0 ;
        h5DocumentIframeElement.scrolling =  'no' ;
        h5DocumentIframeElement.width =  '1px' ;
        h5DocumentIframeElement.height =  '1px' ;
        h5DocumentIframeElement.style.width = '1px' ;
        h5DocumentIframeElement.style.minWidth = '100%' ;
        h5DocumentIframeElement.style.height = '1px' ;
        h5DocumentIframeElement.style.minHeight = '100%' ;
        h5DocumentIframeElement.style.border = 'none' ;
        h5DocumentIframeElement.style.padding = '0' ;
        h5DocumentIframeElement.style.margin = '0' ;
        h5DocumentInstanceElement.appendChild(h5DocumentIframeElement);

        let h5DocumentLoadingElement =  document.createElement('div');
        let h5DocumentLoadingElementId =  h5DocumentElementId+'_h5DocumentLoading' ;
        h5DocumentLoadingElement.className = 'h5Document-loading-element roadofcloud-loading' ;
        h5DocumentLoadingElement.id =  h5DocumentLoadingElementId ;
        let h5DocumentReloadNumberElement =  document.createElement('span');
        h5DocumentReloadNumberElement.className = 'ys-loading-reload-number' ;
        h5DocumentReloadNumberElement.style.display = 'none' ;
        h5DocumentLoadingElement.appendChild(h5DocumentReloadNumberElement);
        h5DocumentInstanceElement.appendChild(h5DocumentLoadingElement);

        let h5DocumentActionElement =  document.createElement('div');
        let h5DocumentActionElementId =  h5DocumentElementId+'_h5DocumentAction' ;
        h5DocumentActionElement.className = 'h5Document-action-element roadofcloud-action' ;
        h5DocumentActionElement.style.width = '100%' ;
        h5DocumentActionElement.style.height = '100%' ;
        h5DocumentActionElement.style.zIndex = 98 ;
        h5DocumentActionElement.style.display = productionOptions.h5DocumentActionClick ? 'none' : 'block' ;
        h5DocumentActionElement.style.position = 'absolute' ;
        h5DocumentActionElement.style.top = '0' ;
        h5DocumentActionElement.style.left = '0' ;
        h5DocumentActionElement.id =  h5DocumentActionElementId ;
        h5DocumentInstanceElement.appendChild(h5DocumentActionElement);
        h5DocumentInstanceElement.appendChild(h5DocumentActionElement);

        h5DocumentElement.appendChild(h5DocumentInstanceElement);

        this.h5DocumentInstanceStore[h5DocumentInstanceID] = h5DocumentInstance ; //h5文档实例
        h5DocumentInstance.h5DocumentInstanceID = h5DocumentInstanceID ; //h5文档id
        h5DocumentInstance.handler = {} ; //处理函数集合
        h5DocumentInstance.handler.sendSignallingToServer = handler.sendSignallingToServer ;
        h5DocumentInstance.handler.delSignallingToServer = handler.delSignallingToServer ;
        h5DocumentInstance.handler.receiveActionCommandCallback = handler.receiveActionCommandCallback ;
        h5DocumentInstance.h5DocumentElementId = h5DocumentElementId ; //h5文档节点的id
        h5DocumentInstance.h5DocumentElement = h5DocumentElement ; //h5文档的节点元素
        h5DocumentInstance.h5DocumentInstanceElementId = h5DocumentInstanceElementId ; //h5文档实例节点的id
        h5DocumentInstance.h5DocumentInstanceElement = h5DocumentInstanceElement ; //h5文档实例节点元素
        h5DocumentInstance.h5DocumentIframeElementId = h5DocumentIframeElementId ; //h5文档的iframe节点的id
        h5DocumentInstance.h5DocumentIframeElement = h5DocumentIframeElement ; //h5文档的iframe节点元素
        h5DocumentInstance.h5DocumentLoadingElementId = h5DocumentLoadingElementId ; //h5文档的loading节点的id
        h5DocumentInstance.h5DocumentLoadingElement = h5DocumentLoadingElement ; //h5文档的loading节点元素
        h5DocumentInstance.h5DocumentReloadNumberElement = h5DocumentReloadNumberElement ; //h5文档的reload number节点元素
        h5DocumentInstance.h5DocumentActionElementId = h5DocumentActionElementId ; //h5文档的action节点的id
        h5DocumentInstance.h5DocumentActionElement = h5DocumentActionElement ; //h5文档的action节点元素

        h5DocumentInstance.id = id ; //实例id
        h5DocumentInstance.awitExecutePostMessageArray = [] ; //等待执行的postMessage消息数组
        h5DocumentInstance.h5DocumentActionJson = {} ; //h5文档点击动作列表
        h5DocumentInstance.associatedMsgID = productionOptions.associatedMsgID ;  //绑定的信令消息id
        h5DocumentInstance.associatedUserID = productionOptions.associatedUserID ;  //绑定的用户id
        h5DocumentInstance.synchronizationH5Document = productionOptions.synchronizationH5Document ; //是否同步H5文档
        h5DocumentInstance.h5DocumentActionClick = productionOptions.h5DocumentActionClick ; //h5文档的点击权限
        h5DocumentInstance.forceReloadNumber = 0 ; //强制重连的次数
        h5DocumentInstance.maxForceReloadNumber = productionOptions.maxForceReloadNumber ; //最多能强制重连的次数
        h5DocumentInstance.forceReloadInterval = productionOptions.forceReloadInterval ; //重新加载的间隔 , ms
        h5DocumentInstance.isShowReloadFileTip = productionOptions.isShowReloadFileTip ; //重新加载文档，是否显示重连次数
        h5DocumentInstance.languageType = productionOptions.languageType ; //语言类型

        h5DocumentInstance.h5DocumentIframeElement.onload = ( ) => {
            clearTimeout( h5DocumentInstance.forceReloadNumberTimer );
            h5DocumentInstance.forceReloadNumberTimer = null ;
            if( h5DocumentInstance.iframeSrc && !h5DocumentInstance.isLoadFinished && h5DocumentInstance.forceReloadNumber < h5DocumentInstance.maxForceReloadNumber ){
                this._iframeReloadMonitor( h5DocumentInstance , 'h5DocumentLoaded' );
            }
        };

        return h5DocumentInstance ;
    };
    
    /*销毁h5文档实例，通过id*/
    destroyH5DocumentInstance(id){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[destroy]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        this._destroyH5DocumentInstance(h5DocumentInstance);
    };

    /*接收h5文档的iframe消息*/
    receiveWindowMessageEvent(id , event){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[receiveWindowMessageEvent]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        //根据event.source判断消息来源是否是当前实例id对应的iframe
        if (event.source !== h5DocumentInstance.h5DocumentIframeElement.contentWindow) {return}
        this._receiveWindowMessageEvent(id, h5DocumentInstance , event);
    }
    
    /*是否有h5文档实例*/
    hasH5DocumentById(id){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        return (h5DocumentInstance !== undefined &&  h5DocumentInstance !== null) ;
    }

    /*设置h5文档的iframe的src*/
    setH5DocumentIframeSrc(id , src , parameters = {} , filedata = {} , options = {}){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[setH5DocumentIframeSrc]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        let srcStr = '';
        h5DocumentInstance.isLoadFinished = false ;
        h5DocumentInstance.isReceivePagenum = false ;
        clearTimeout(h5DocumentInstance.h5DocumentActionTimer);
        // h5DocumentInstance.awitExecutePostMessageArray.length = 0 ;
        clearTimeout( h5DocumentInstance.forceReloadNumberTimer );
        h5DocumentInstance.forceReloadNumberTimer = null ;
        h5DocumentInstance.forceReloadNumber = options.forceReloadNumber ||  0 ;
        let { fileid } = filedata ;
        h5DocumentInstance.fileid = fileid;
        if(src){
            srcStr = src ;
            let first = false ;
            for(let [key,value] of Object.entries(parameters) ){
                if(!first){
                    first = true ;
                    srcStr += ( ( /\?/g.test(srcStr) ? '&' : '?' ) + key+'='+value )
                }else{
                    srcStr += ( '&'+ key+'='+value )
                }
            }
            h5DocumentInstance.iframeSrc = srcStr ;
            this._showLoading(h5DocumentInstance);
            this._iframeReloadMonitor( h5DocumentInstance , 'setH5DocumentIframeSrc' );
        }else{
            h5DocumentInstance.iframeSrc = srcStr ;
            this._hideLoading(h5DocumentInstance);
        }
        h5DocumentInstance.h5DocumentIframeElement.src = srcStr ;
        L.Logger.debug('set h5 document src:' , srcStr);
    }

    /*获取iframe的src地址*/
    getIframeSrc( id ){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[getIframeSrc]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        return h5DocumentInstance.iframeSrc ;
    }

    /*跳转到ppt的指定页和帧*/
    jumpToPage( id , page  ){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[jumpToPage]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        this._jumpToPage(h5DocumentInstance , page );
    }

    /*下一页*/
    nextPage(id){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[nextPage]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        if(!h5DocumentInstance.isLoadFinished){
            L.Logger.info('[nextPage]h5 document is not load finished  , cannot execute nextPage method');
            return ;
        }
        let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
        if( filedata && filedata.currpage >= filedata.pagenum ){
            L.Logger.warning('[nextPage]h5 document is on the last page , cannot execute nextPage method.');
            return ;
        }
        // this._postMessage(h5DocumentInstance , { method:"onPagedown" } );
        let updateFileData = {
            currpage:filedata.currpage+1
        };
        this._postMessage(h5DocumentInstance , {method:"onJumpPage" , toPage:updateFileData.currpage} );
        this._saveFiledataAndLoadCurrpageWhiteboardData(h5DocumentInstance , updateFileData);
        this._sendSignalling_ShowPage(h5DocumentInstance);
    }

    /*上一页*/
    prevPage(id){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[nextPage]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        if(!h5DocumentInstance.isLoadFinished){
            L.Logger.info('[prevPage]h5 document is not load finished  , cannot execute prevPage method');
            return ;
        }
        let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
        if( filedata && filedata.currpage <= 1 ){
            L.Logger.warning('[nextPage]h5 document is on page 1, cannot execute prevPage method.');
            return ;
        }
        // this._postMessage(h5DocumentInstance , { method:"onPageup" } );
        let updateFileData = {
            currpage:filedata.currpage-1
        };
        this._postMessage(h5DocumentInstance , {method:"onJumpPage" , toPage:updateFileData.currpage,} );
        this._saveFiledataAndLoadCurrpageWhiteboardData(h5DocumentInstance , updateFileData);
        this._sendSignalling_ShowPage(h5DocumentInstance);
    }

    skipPage( id , toPage ){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[skipPage]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        if(!h5DocumentInstance.isLoadFinished){
            L.Logger.info('[skipPage]h5 document is not load finished  , cannot execute skipPage method');
            return ;
        }
        let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
        if( filedata && toPage > filedata.pagenum ){
            L.Logger.info('[skipPage]h5 document skip to page exceeds the maximum number of pages , change skip page  to 5(max page number).');
            toPage = filedata.pagenum ;
        }
        if( toPage < 1 ){
            L.Logger.info('[skipPage]h5 document skip to page less than the minimum page , change skip page  to 1(min page number).');
            toPage = 1 ;
        }
        this._saveFiledataAndLoadCurrpageWhiteboardData(h5DocumentInstance , {
            currpage:toPage
        });
        this._jumpToPage( h5DocumentInstance , toPage );
        this._sendSignalling_ShowPage(h5DocumentInstance);
    }

    /*更新h5文档实例属性*/
    updateH5DocumentProperty(id , updateProperty){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[updateH5DocumentProperty]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        if( updateProperty.associatedMsgID !== undefined ){
            h5DocumentInstance.associatedMsgID =  updateProperty.associatedMsgID ;
        }
        if( updateProperty.associatedUserID !== undefined ){
            h5DocumentInstance.associatedUserID =  updateProperty.associatedUserID ;
        }
        if(updateProperty.synchronizationH5Document !== undefined){
            h5DocumentInstance.synchronizationH5Document = updateProperty.synchronizationH5Document ;
        }
        if(updateProperty.h5DocumentActionClick !== undefined){
            h5DocumentInstance.h5DocumentActionClick = updateProperty.h5DocumentActionClick ;
            h5DocumentInstance.h5DocumentActionElement.style.display = h5DocumentInstance.h5DocumentActionClick ? 'none' : 'block' ;
        }
        if(updateProperty.isShowReloadFileTip !== undefined){
            h5DocumentInstance.isShowReloadFileTip = updateProperty.isShowReloadFileTip ;
        }
        if(updateProperty.languageType !== undefined){
            h5DocumentInstance.languageType = updateProperty.languageType ;
            this._isShowReloadFileShowReloadNumber(h5DocumentInstance);
        }
    }

    /*发送h5文档的点击action给iframe*/
    postMessageH5DocumentTriggerAction(id , postMessageData){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[postMessageH5DocumentTriggerAction]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
        if( postMessageData && postMessageData.fileid != undefined && postMessageData.currpage !== undefined &&  !( filedata.fileid == postMessageData.fileid  && filedata.currpage === postMessageData.currpage ) ){
            h5DocumentInstance.h5DocumentActionJson[postMessageData.currpage] = h5DocumentInstance.h5DocumentActionJson[postMessageData.currpage] || [];
            h5DocumentInstance.h5DocumentActionJson[postMessageData.currpage].push(postMessageData);
        }else{
            this._postMessage(h5DocumentInstance , postMessageData);
        }
    }

    /*提供postMessage*/
    postMessage(id , postMessageData){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[postMessage]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        this._postMessage( h5DocumentInstance , postMessageData ) ;
    }

    /*是否加载完成h5文档*/
    isLoadFinished(id){
        let h5DocumentInstance = this.getH5DocumentInstanceByID(id);
        if(!h5DocumentInstance){L.Logger.error( '[isLoadFinished]There are no h5 document Numbers that belong to id '+id ) ;return ;};
        return h5DocumentInstance.isLoadFinished ;
    }

    /*获取h5文档实例,根据id获取*/
    getH5DocumentInstanceByID(id){
        let h5DocumentInstanceID =  this._getH5DocumentInstanceID(id)  ;
        let h5DocumentInstance = this.h5DocumentInstanceStore[h5DocumentInstanceID] ;
        return h5DocumentInstance ;
    }

    /*跳转到ppt的指定页和帧*/
    _jumpToPage( h5DocumentInstance , page ){
        if(h5DocumentInstance.isLoadFinished){
            let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
            let needChangeCurrpage = false , currpage = page ;
            if(filedata){
                if(filedata.currpage >  filedata.pagenum){
                    filedata.currpage = filedata.pagenum ;
                    needChangeCurrpage = true ;
                    page = filedata.currpage ;
                }
                if(filedata.currpage < 1 ){
                    filedata.currpage = 1 ;
                    needChangeCurrpage = true ;
                    page = filedata.currpage ;
                }
                currpage = filedata.currpage ;
            }
            if(needChangeCurrpage){
                let updateFileData = {};
                if( needChangeCurrpage ){
                    updateFileData.currpage = currpage ;
                }
                this._saveFiledataAndLoadCurrpageWhiteboardData(h5DocumentInstance , updateFileData );
            }
            if(page !== undefined && page !== null && !isNaN(page) ){
                let data = {
                    method:"onJumpPage" ,
                    toPage:page ,
                } ;
                this._postMessage(h5DocumentInstance , data) ;
            }
        }
    }

    /*发送消息给h5文档的iframe框架*/
    _postMessage(h5DocumentInstance , data){
        if(h5DocumentInstance.isLoadFinished){
            try{
                if(h5DocumentInstance.h5DocumentIframeElement && h5DocumentInstance.h5DocumentIframeElement.src ){
                    // let source =  "ys_h5Document" ;
                    let sendData = data ;
                    sendData = JSON.stringify(sendData);
                    if(h5DocumentInstance.h5DocumentIframeElement && h5DocumentInstance.h5DocumentIframeElement.contentWindow && h5DocumentInstance.h5DocumentIframeElement.contentWindow.postMessage){
                        L.Logger.debug('[_postMessage]h5 document postMessage instanceId is '+h5DocumentInstance.id+',sendData:'+sendData);
                        h5DocumentInstance.h5DocumentIframeElement.contentWindow.postMessage(sendData ,"*" );
                    }
                }
            }catch (err){
                L.Logger.error( '[_postMessage] h5 document postMessage error:' , err );
            }
        }else{
            h5DocumentInstance.awitExecutePostMessageArray.push(data);
        }
    }

    /*显示loading*/
    _showLoading(h5DocumentInstance){
        h5DocumentInstance.h5DocumentLoadingElement.style.display = 'block' ;
        this._isShowReloadFileShowReloadNumber( h5DocumentInstance );
    }

    /*隐藏loading*/
    _hideLoading(h5DocumentInstance){
        h5DocumentInstance.h5DocumentLoadingElement.style.display = 'none' ;
        this._isShowReloadFileShowReloadNumber( h5DocumentInstance );
    }

    /*获取h5文档实例id,根据id获取*/
    _getH5DocumentInstanceID(id){
        let h5DocumentInstanceID = !this.uniqueH5Document && id !== undefined && id !== null  ? (this.h5DocumentInstanceIDPrefix+id) :  this.h5DocumentInstanceDefaultID ;
        if(id && typeof id === 'string'){
            let rq = new RegExp(this.specialH5DocumentInstanceIDPrefix , 'g') ;
            if( rq .test(id) ){
                h5DocumentInstanceID = id ;
            }
        }
        return h5DocumentInstanceID ;
    };

    /*销毁h5文档实例，通过实例h5DocumentInstance*/
    _destroyH5DocumentInstance(h5DocumentInstance){
        let h5DocumentInstanceID = h5DocumentInstance.h5DocumentInstanceID ;
        let h5DocumentElement = h5DocumentInstance.h5DocumentElement;
        if(!h5DocumentElement){
            L.Logger.warning( '[destroy] h5Document elements do not exist , element id is:'+h5DocumentInstance.h5DocumentElementId+'!' ) ;
        }else{
            h5DocumentElement.innerHTML = '' ;
        }
        for(let key of Object.keys(h5DocumentInstance) ){
            h5DocumentInstance[key] = null ;
            delete h5DocumentInstance[key] ;
        }
        this.h5DocumentInstanceStore[h5DocumentInstanceID] = null ; //h5文档实例
        delete  this.h5DocumentInstanceStore[h5DocumentInstanceID]  ;
    };

    /*接收h5文档的iframe消息*/
    _receiveWindowMessageEvent(instanceId, h5DocumentInstance , event){
        // 通过origin属性判断消息来源地址
        if( event.data){
            let recvData = undefined ;
            try{
                recvData =  JSON.parse(event.data) ;
            }catch (e){
                L.Logger.warning(  "h5 document receive iframe message data can't be converted to JSON , iframe data:" , event.data ) ;
                return ;
            }
            if( recvData.method ||  recvData.source === "ys_h5Document") {
                L.Logger.debug("[h5Document]receive remote iframe data form "+ event.origin +":",  event );
                const ONLOADCOMPLETE = "onLoadComplete";//收到iframe加载完成时
                const ONPAGENUM = "onPagenum";  //收到总页数
                const ONFILEMESSAGE = "onFileMessage"; //操作h5课件时
                const ONJUMPPAGE = "onJumpPage"; //跳到某页
                const CLINETAUDIOPLAYER = "clinetAudioPlayer";
                switch ( recvData.method ) {
                    case ONLOADCOMPLETE :
                        this._handleIframeMessage_onLoadComplete(h5DocumentInstance , recvData);
                        break;
                    case ONPAGENUM :
                        this._handleIframeMessage_onPagenum(h5DocumentInstance , recvData );
                        break;
                    case ONFILEMESSAGE:
                        this._handleIframeMessage_onFileMessage(instanceId, h5DocumentInstance , recvData);
                        break;
                    case ONJUMPPAGE:
                        if (!recvData.toPage || typeof recvData.toPage !== "number") {
                            L.Logger.warning("h5 document toPage is not a number , toPage:",recvData.toPage);
                            return;
                        }
                        h5DocumentInstance.handler.receiveActionCommandCallback('h5DocumentOnJumpPage' , {
                            id:h5DocumentInstance.id ,
                            toPage:recvData.toPage,
                        });
                        break;
                    case CLINETAUDIOPLAYER:
                        this._handleIframeMessage_autoPlayAudioInNative(h5DocumentInstance , recvData.data);
                        break;
                };
            }
        }
    }
    _handleIframeMessage_autoPlayAudioInNative(h5DocumentInstance, data) {
        if( h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback ){
            let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
            let { isPlay , url , fileid , ...other} = data ;
            let action = 'publishH5DocumentNetworkAudio';
            let cmd = {
                id:h5DocumentInstance.id ,
                url:url ,
                isPlay:isPlay ,
                audio:true ,
                attributes:{
                    source:'h5Document' ,
                    filename:'' ,
                    fileid:fileid ,
                    type:'audio' ,
                    other:other ,
                    currentPage:filedata.currpage,
                },
            };
            h5DocumentInstance.handler.receiveActionCommandCallback( action , cmd );
        }
    }

    /*处理iframe的onLoadComplete消息*/
    _handleIframeMessage_onLoadComplete(h5DocumentInstance , data){
        clearTimeout( h5DocumentInstance.forceReloadNumberTimer );
        h5DocumentInstance.forceReloadNumberTimer = null ;
        if(h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback){
            h5DocumentInstance.handler.receiveActionCommandCallback('updateWhiteboardWatermarkImageScale' , {
                id:h5DocumentInstance.id ,
                scale:data.coursewareRatio || 16/9 ,
            });
            h5DocumentInstance.handler.receiveActionCommandCallback('h5DocumentLoadEnd' , {
                id:h5DocumentInstance.id ,
                scale:data.coursewareRatio || 16/9 ,
                reloadNumber: h5DocumentInstance.forceReloadNumber,
                success: true,
            });
        }
        if(!h5DocumentInstance.isLoadFinished){
            h5DocumentInstance.isLoadFinished = true ;
            if(h5DocumentInstance.isReceivePagenum){
                let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
                if( filedata ){
                    this._jumpToPage(h5DocumentInstance , filedata.currpage );
                    clearTimeout(h5DocumentInstance.h5DocumentActionTimer);
                    h5DocumentInstance.h5DocumentActionTimer = setTimeout( () => {
                        if(h5DocumentInstance.isLoadFinished){
                            filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
                            if ( Object.keys(h5DocumentInstance.h5DocumentActionJson).length > 0  && h5DocumentInstance.h5DocumentActionJson[filedata.currpage]) {
                                if (h5DocumentInstance.h5DocumentActionJson[filedata.currpage].length !== 0) {
                                    for(let h5DocumentAction of h5DocumentInstance.h5DocumentActionJson[filedata.currpage] ) {
                                        this._postMessage( h5DocumentInstance , h5DocumentAction);
                                    }
                                    h5DocumentInstance.h5DocumentActionJson[filedata.currpage].length = 0 ;
                                    delete h5DocumentInstance.h5DocumentActionJson[filedata.currpage] ;
                                }
                            }
                        }
                    } , 100) ;
                }
            }
        };

        if(h5DocumentInstance.awitExecutePostMessageArray && h5DocumentInstance.awitExecutePostMessageArray.length>0){
            for(let postMessageData of h5DocumentInstance.awitExecutePostMessageArray){
                this._postMessage(h5DocumentInstance , postMessageData);
            }
        }
        h5DocumentInstance.awitExecutePostMessageArray.length = 0 ;
        this._hideLoading(h5DocumentInstance);
    };

    /*处理iframe的onPagenum消息*/
    _handleIframeMessage_onPagenum(h5DocumentInstance , data ){
        let h5Pagenum = data.totalPages;
        let needChangeCurrpage = false , currpage = 1 ;
        let filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
        if( filedata ){
            filedata.pagenum = h5Pagenum ;
            if(filedata.currpage >  filedata.pagenum){
                filedata.currpage = filedata.pagenum ;
                needChangeCurrpage = true ;
            }
            if(filedata.currpage < 1 ){
                filedata.currpage = 1 ;
                needChangeCurrpage = true ;
            }
            currpage = filedata.currpage ;
        }
        let updateFileData = {
            pagenum:h5Pagenum
        };
        if( needChangeCurrpage ){
            updateFileData.currpage = currpage ;
        }
        if(needChangeCurrpage){
            this._saveFiledataAndLoadCurrpageWhiteboardData( h5DocumentInstance , updateFileData );
        }else{
            this._updateWhiteboardFiledata(h5DocumentInstance , updateFileData );
        }
        if(h5DocumentInstance.isLoadFinished && !h5DocumentInstance.isReceivePagenum){
            filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
            if( filedata ){
                this._jumpToPage(h5DocumentInstance , filedata.currpage );
                clearTimeout(h5DocumentInstance.h5DocumentActionTimer);
                h5DocumentInstance.h5DocumentActionTimer = setTimeout( () => {
                    if(h5DocumentInstance.isLoadFinished){
                        filedata = this._getWhiteboardFiledata(h5DocumentInstance) ;
                        if ( Object.keys(h5DocumentInstance.h5DocumentActionJson).length > 0 && h5DocumentInstance.h5DocumentActionJson[filedata.currpage]) {
                            if (h5DocumentInstance.h5DocumentActionJson[filedata.currpage].length !== 0) {
                                for(let h5DocumentAction of h5DocumentInstance.h5DocumentActionJson[filedata.currpage] ) {
                                    this._postMessage( h5DocumentInstance , h5DocumentAction);
                                }
                                h5DocumentInstance.h5DocumentActionJson[filedata.currpage].length = 0 ;
                                delete h5DocumentInstance.h5DocumentActionJson[filedata.currpage] ;
                            }
                        }
                    }
                } , 100) ;
            }
        };
        h5DocumentInstance.isReceivePagenum = true;
    };

    /*处理iframe的onFileMessage消息*/
    _handleIframeMessage_onFileMessage(instanceId, h5DocumentInstance , data){
        data.sourceInstanceId = instanceId;
        this._sendSignallingToServer(h5DocumentInstance , {
            name:instanceId === 'default'?'H5DocumentAction':'ExtendH5DocumentAction' ,
            id:instanceId === 'default'?'H5DocumentAction':`H5DocumentAction_${instanceId}`,
            toID:'__allExceptSender' ,
            data:data ,
        });
        if( h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback){
            h5DocumentInstance.handler.receiveActionCommandCallback('closeAllSelectBox' , {
                id:h5DocumentInstance.id ,
            });
        }
    }

    /*发送信令*/
    _sendSignallingToServer(h5DocumentInstance , {name ,id , toID = '__all' ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID} = {} ){
        if(h5DocumentInstance.handler && h5DocumentInstance.handler.sendSignallingToServer) {
            associatedMsgID = associatedMsgID || h5DocumentInstance.associatedMsgID  ;
            associatedUserID = associatedUserID || h5DocumentInstance.associatedUserID ;
            h5DocumentInstance.handler.sendSignallingToServer(name ,id , toID ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID);
        }
    }

    /*获取whiteboard filedata*/
    _getWhiteboardFiledata(h5DocumentInstance){
        let filedata = undefined ;
        if(h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback){
            h5DocumentInstance.handler.receiveActionCommandCallback('getWhiteboardFiledata', {
                id:h5DocumentInstance.id ,
                callback:( filedataResult ) => {
                    filedata = filedataResult ;
                }
            });
        }
        return filedata ;
    }

    /*保存白板数据且加载当前页的白板数据*/
    _saveFiledataAndLoadCurrpageWhiteboardData(h5DocumentInstance , updateFiledata = {} ){
        if(h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback){
            h5DocumentInstance.handler.receiveActionCommandCallback('saveFiledataAndLoadCurrpageWhiteboardData', {
                id:h5DocumentInstance.id ,
                updateFileData:updateFiledata
            });
        }
    }

    /*更新whiteboard filedata*/
    _updateWhiteboardFiledata(h5DocumentInstance , updateFileData = {}){
        if(h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback){
            h5DocumentInstance.handler.receiveActionCommandCallback('updateWhiteboardFiledata', {
                id:h5DocumentInstance.id ,
                updateFileData:updateFileData
            });
        }
    }

    /*监测iframe进行重新加载*/
    _iframeReloadMonitor(h5DocumentInstance , source ){
        clearTimeout( h5DocumentInstance.forceReloadNumberTimer );
        h5DocumentInstance.forceReloadNumberTimer = null ;
        if( h5DocumentInstance.iframeSrc && !h5DocumentInstance.isLoadFinished && h5DocumentInstance.forceReloadNumber < h5DocumentInstance.maxForceReloadNumber ){
            h5DocumentInstance.forceReloadNumberTimer = setTimeout( () => {
                if( h5DocumentInstance.iframeSrc && !h5DocumentInstance.isLoadFinished && h5DocumentInstance.forceReloadNumber < h5DocumentInstance.maxForceReloadNumber ){
                    h5DocumentInstance.forceReloadNumber++ ;
                    this._isShowReloadFileShowReloadNumber( h5DocumentInstance );
                    if( h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback ){
                        h5DocumentInstance.handler.receiveActionCommandCallback('reloadH5DocumentIframeSrc' ,{
                            id:h5DocumentInstance.id ,
                            iframeSrc:h5DocumentInstance.iframeSrc ,
                            source:source ,
                            fileid:h5DocumentInstance.fileid ,
                            forceReloadNumber:h5DocumentInstance.forceReloadNumber
                        })
                    }
                }
            } , h5DocumentInstance.forceReloadInterval ) ;
        }
        if(h5DocumentInstance.iframeSrc && !h5DocumentInstance.isLoadFinished && h5DocumentInstance.forceReloadNumber === 1){
            if( h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback ){
                h5DocumentInstance.handler.receiveActionCommandCallback('h5DocumentReloadFail' ,{
                    id: h5DocumentInstance.id ,
                    reloadNumber: 0,
                    success: false,
                })
            }
        }
    }

    /*发送ShowPage信令*/
    _sendSignalling_ShowPage(h5DocumentInstance , updatePubmsgData = {} ){
        if( h5DocumentInstance.handler && h5DocumentInstance.handler.receiveActionCommandCallback ){
            h5DocumentInstance.handler.receiveActionCommandCallback('sendSignalling_ShowPage' ,{
                id:h5DocumentInstance.id ,
                updatePubmsgData:updatePubmsgData
            })
        }
    };


    /*是否显示文件重新加载提示*/
    _isShowReloadFileShowReloadNumber( h5DocumentInstance ){
        h5DocumentInstance.h5DocumentReloadNumberElement.style.display = h5DocumentInstance.isShowReloadFileTip &&  h5DocumentInstance.forceReloadNumber ? 'inline-table' : 'none' ;
        let forceReloadNumberTip = '当前网络不稳定，正在尝试重新打开课件……第'+h5DocumentInstance.forceReloadNumber+'次' ;
        switch ( h5DocumentInstance.languageType  ){
            case 'tw':
                forceReloadNumberTip = '當前網絡不穩定，正在嘗試重新打開課件……第'+h5DocumentInstance.forceReloadNumber+'次' ;
                break;
            case 'en':
                forceReloadNumberTip = 'The network is unstable , Trying to reopen the courseware ...'+h5DocumentInstance.forceReloadNumber+'' ;
                break;
            case 'en':
                forceReloadNumberTip = 'ネットが不安定です、教材を開きなおしています'+h5DocumentInstance.forceReloadNumber+'次' ;
                break;
        }
        h5DocumentInstance.h5DocumentReloadNumberElement.innerHTML = forceReloadNumberTip || '' ;
    };

};
const  H5DocumentIntermediateLayerInstance = new H5DocumentIntermediateLayer();
export default H5DocumentIntermediateLayerInstance ;
