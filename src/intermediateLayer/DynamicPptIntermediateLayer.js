import Global from '../utils/Global';
/**
 * 动态PPT中间层处理类
 * @class DynamicPptIntermediateLayer
 * @description  提供动态PPT中间层处理类
 * @author 邱广生
 * @date 2018-04-22
 */
'use strict';

class DynamicPptIntermediateLayer{
    constructor(){
        this.defaultProductionOptions = { //默认的动态PPT生产配置选项
            synchronizationDynamicPpt:true , //是否同步动态PPT
            dynamicPptActionClick:true , //动态PPT的点击权限
            maxForceReloadNumber:10 , //最多能强制重连的次数
            forceReloadInterval:60000 , //重新加载的间隔 ， ms
            languageType:'ch' , //语言类型，默认ch ,  languageType的值有 ch / tw / en  , ch:简体中文，tw:繁体中文 ， en:英文
        };
        this.dynamicPptInstanceIDPrefix = "dynamicPpt_" ;
        this.dynamicPptInstanceDefaultID = "dynamicPpt_"+'default' ;
        this.dynamicPptInstanceStore = {} ; //动态PPT实例存储中心
        this.uniqueDynamicPpt = false ; //唯一的动态PPT
        this.specialDynamicPptInstanceIDPrefix = 'specialDynamicPptInstanceIDPrefix_' ;
        this.slideLoadFile = {
            timer: null,
            pptslide: -1,
            fileid: -1,
        }; // 用于存储PPT翻页超时的计时器变量
    };

    /*初始化动态PPT权限
     * @params
     dynamicPptElementId:动态PPT元素id（string , required） thumbnailId:缩略图元素id（string ） ，
     options:配置项(object)
     */
    productionDynamicPpt({dynamicPptElementId   , productionOptions = {} , handler = {} , id  } = {} ){
        if( !dynamicPptElementId ){L.Logger.error('dynamicPptElementId is required!'); return ;}
        let dynamicPptInstanceID =  this._getDynamicPptInstanceID(id)  ;
        let dynamicPptInstance = this.getDynamicPptInstanceByID(dynamicPptInstanceID);
        if(dynamicPptInstance){L.Logger.error( 'The production dynamicPpt(dynamicPptInstanceID:'+dynamicPptInstanceID+') fails, the dynamicPpt already exists!' ) ;return  dynamicPptInstance;}
        dynamicPptInstance = {} ;
        productionOptions = Object.deepAssign( {} , this.defaultProductionOptions , productionOptions  ) ;

        let dynamicPptElement = document.getElementById(dynamicPptElementId);
        if(!dynamicPptElement){L.Logger.error( 'DynamicPpt elements do not exist , element id is:'+dynamicPptElementId+'!' ) ;return dynamicPptInstance;}

        let dynamicPptInstanceElement =  document.createElement('div');
        let dynamicPptInstanceElementId =  dynamicPptElementId+'_dynamicPptInstance' ;
        dynamicPptInstanceElement.className = 'dynamicPpt-instance-element' ;
        dynamicPptInstanceElement.id =  dynamicPptInstanceElementId ;
        dynamicPptInstanceElement.style.width = '100%' ;
        dynamicPptInstanceElement.style.height = '100%' ;

        let dynamicPptIframeElement =  document.createElement('iframe');
        let dynamicPptIframeElementId =  dynamicPptElementId+'_dynamicPptIframe' ;
        dynamicPptIframeElement.className = 'dynamicPpt-iframe-element' ;
        dynamicPptIframeElement.id =  dynamicPptIframeElementId ;
        dynamicPptIframeElement.name =  dynamicPptElementId+"_dynamicPptIframeName" ;
        dynamicPptIframeElement.allowFullScreen =  true ;
        dynamicPptIframeElement.frameborder =  0 ;
        dynamicPptIframeElement.scrolling =  'no' ;
        dynamicPptIframeElement.allow =  'autoplay' ;
        dynamicPptIframeElement.width =  '100%' ;
        dynamicPptIframeElement.height =  '100%' ;
        dynamicPptIframeElement.style.width = '100%' ;
        dynamicPptIframeElement.style.height = '100%' ;
        dynamicPptIframeElement.style.border = 'none' ;
        dynamicPptIframeElement.style.padding = '0' ;
        dynamicPptIframeElement.style.margin = '0' ;
        dynamicPptInstanceElement.appendChild(dynamicPptIframeElement);

        let dynamicPptLoadingElement =  document.createElement('div');
        let dynamicPptLoadingElementId =  dynamicPptElementId+'_dynamicPptLoading' ;
        dynamicPptLoadingElement.className = 'dynamicPpt-loading-element roadofcloud-loading' ;
        dynamicPptLoadingElement.id =  dynamicPptLoadingElementId ;
        let dynamicPptReloadNumberElement =  document.createElement('span');
        dynamicPptReloadNumberElement.className = 'ys-loading-reload-number' ;
        dynamicPptReloadNumberElement.style.display = 'none' ;
        dynamicPptLoadingElement.appendChild(dynamicPptReloadNumberElement);
        dynamicPptInstanceElement.appendChild(dynamicPptLoadingElement);

        let dynamicPptActionElement =  document.createElement('div');
        let dynamicPptActionElementId =  dynamicPptElementId+'_dynamicPptAction' ;
        dynamicPptActionElement.className = 'dynamicPpt-action-element roadofcloud-action' ;
        dynamicPptActionElement.style.width = '100%' ;
        dynamicPptActionElement.style.height = '100%' ;
        dynamicPptActionElement.style.zIndex = 98 ;
        dynamicPptActionElement.style.display = productionOptions.dynamicPptActionClick ? 'none' : 'block' ;
        dynamicPptActionElement.style.position = 'absolute' ;
        dynamicPptActionElement.style.top = '0' ;
        dynamicPptActionElement.style.left = '0' ;
        dynamicPptActionElement.id =  dynamicPptActionElementId ;
        dynamicPptInstanceElement.appendChild(dynamicPptActionElement);
        dynamicPptInstanceElement.appendChild(dynamicPptActionElement);

        dynamicPptElement.appendChild(dynamicPptInstanceElement);

        this.dynamicPptInstanceStore[dynamicPptInstanceID] = dynamicPptInstance ; //动态PPT实例
        dynamicPptInstance.dynamicPptInstanceID = dynamicPptInstanceID ; //动态PPTid
        dynamicPptInstance.handler = {} ; //处理函数集合
        dynamicPptInstance.handler.sendSignallingToServer = handler.sendSignallingToServer ;
        dynamicPptInstance.handler.delSignallingToServer = handler.delSignallingToServer ;
        dynamicPptInstance.handler.receiveActionCommandCallback = handler.receiveActionCommandCallback ;
        dynamicPptInstance.dynamicPptElementId = dynamicPptElementId ; //动态PPT节点的id
        dynamicPptInstance.dynamicPptElement = dynamicPptElement ; //动态PPT的节点元素
        dynamicPptInstance.dynamicPptInstanceElementId = dynamicPptInstanceElementId ; //动态PPT实例节点的id
        dynamicPptInstance.dynamicPptInstanceElement = dynamicPptInstanceElement ; //动态PPT实例节点元素
        dynamicPptInstance.dynamicPptIframeElementId = dynamicPptIframeElementId ; //动态PPT的iframe节点的id
        dynamicPptInstance.dynamicPptIframeElement = dynamicPptIframeElement ; //动态PPT的iframe节点元素
        dynamicPptInstance.dynamicPptLoadingElementId = dynamicPptLoadingElementId ; //动态PPT的loading节点的id
        dynamicPptInstance.dynamicPptLoadingElement = dynamicPptLoadingElement ; //动态PPT的loading节点元素
        dynamicPptInstance.dynamicPptReloadNumberElement = dynamicPptReloadNumberElement ; //h5文档的reload number节点元素
        dynamicPptInstance.dynamicPptActionElementId = dynamicPptActionElementId ; //动态PPT的action节点的id
        dynamicPptInstance.dynamicPptActionElement = dynamicPptActionElement ; //动态PPT的action节点元素

        dynamicPptInstance.id = id ; //实例id
        dynamicPptInstance.remoteData = {} ; //动态ppt收到的远程数据
        dynamicPptInstance.awitExecutePostMessageArray = [] ; //等待执行的postMessage消息数组
        dynamicPptInstance.dynamicPptActionJson = {} ; //动态ppt点击动作列表
        dynamicPptInstance.associatedMsgID = productionOptions.associatedMsgID ;  //绑定的信令消息id
        dynamicPptInstance.associatedUserID = productionOptions.associatedUserID ;  //绑定的用户id
        dynamicPptInstance.synchronizationDynamicPpt = productionOptions.synchronizationDynamicPpt ; //是否同步动态ppt
        dynamicPptInstance.dynamicPptActionClick = productionOptions.dynamicPptActionClick ; //动态PPT的点击权限
        dynamicPptInstance.forceReloadNumber = 0 ; //强制重连的次数
        dynamicPptInstance.maxForceReloadNumber = productionOptions.maxForceReloadNumber ; //最多能强制重连的次数
        dynamicPptInstance.forceReloadInterval = productionOptions.forceReloadInterval ; //重新加载的间隔 , ms
        dynamicPptInstance.isShowReloadFileTip = productionOptions.isShowReloadFileTip ; //重新加载文档，是否显示重连次数
        dynamicPptInstance.languageType = productionOptions.languageType ; //语言类型
        dynamicPptInstance.againreconnectNum = 0; //动态PPT内部发送的重连消息的次数
        if(productionOptions.againreconnectElementParentNode){
            dynamicPptInstance.againreconnectElementParentNode = productionOptions.againreconnectElementParentNode ;
        }

        dynamicPptInstance.dynamicPptIframeElement.onload = ( ) => {
            clearTimeout( dynamicPptInstance.forceReloadNumberTimer );
            dynamicPptInstance.forceReloadNumberTimer = null ;
            if( dynamicPptInstance.iframeSrc && !dynamicPptInstance.isLoadFinished && dynamicPptInstance.forceReloadNumber < dynamicPptInstance.maxForceReloadNumber ){
                this._iframeReloadMonitor( dynamicPptInstance , 'dynamicPptLoaded' );
            }
        };
        return dynamicPptInstance ;
    };

    /*销毁动态PPT实例，通过id*/
    destroyDynamicPptInstance(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[destroy]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        this._destroyDynamicPptInstance(dynamicPptInstance);
    };

    /*接收动态PPT的iframe消息*/
    receiveWindowMessageEvent(id , event){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[receiveWindowMessageEvent]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        //根据event.source判断消息来源是否是当前实例id对应的iframe
        if (event.source !== dynamicPptInstance.dynamicPptIframeElement.contentWindow) {return}
        this._receiveWindowMessageEvent(id, dynamicPptInstance , event);
    }

    changeDynamicPptSize(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[changeDynamicPptSize]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        let postMessageData = {
            action:"resizeHandler" ,
            width:dynamicPptInstance.dynamicPptElement.clientWidth ,
            height:dynamicPptInstance.dynamicPptElement.clientHeight ,
        };
        this._postMessage(dynamicPptInstance,postMessageData);
        setTimeout(()=>{
            var postMessageData = {
              action: "resizeHandler",
              width: dynamicPptInstance.dynamicPptElement.clientWidth,
              height: dynamicPptInstance.dynamicPptElement.clientHeight
            };
          this._postMessage(dynamicPptInstance, postMessageData);
        },250)
    }
    /*是否有动态PPT实例*/
    hasDynamicPptById(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        return (dynamicPptInstance !== undefined &&  dynamicPptInstance !== null) ;
    }

    /*设置动态ppt的iframe的src*/
    setDynamicPptIframeSrc(id , src , parameters = {} , filedata = {} , options = {} ){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[setDynamicPptIframeSrc]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        let srcStr = '';
        dynamicPptInstance.isLoadFinished = false ;
        dynamicPptInstance.awitExecutePostMessageArray.length = 0 ;
        clearTimeout( dynamicPptInstance.forceReloadNumberTimer );
        dynamicPptInstance.forceReloadNumberTimer = null ;
        dynamicPptInstance.forceReloadNumber = options.forceReloadNumber ||  0 ;
        let { fileid , pptslide ,pptstep  } = filedata ;
        dynamicPptInstance.playback = options.playback;
        if(dynamicPptInstance.againreconnectElement){
            if(dynamicPptInstance.againreconnectElement.parentNode){
                dynamicPptInstance.againreconnectElement.parentNode.removeChild(dynamicPptInstance.againreconnectElement);
            }
            dynamicPptInstance.againreconnectElement = undefined;
        }
        if( fileid != dynamicPptInstance.fileid || !src || !options.isAgainreconnect){
            dynamicPptInstance.againreconnectNum = 0;
        }
        dynamicPptInstance.fileid =  fileid  ;
        dynamicPptInstance.awitJumpToAnimPptslide = pptslide ;
        dynamicPptInstance.awitJumpToAnimPptstep = pptstep ;
        if(src){
            srcStr = src ;
            let first = false ;
            for(let [key,value] of Object.entries(parameters) ){
                if(value === undefined || value === null){
                    continue;
                }
                if(!first){
                    first = true ;
                    srcStr += ( ( /\?/g.test(srcStr) ? '&' : '?' ) + key+'='+value )
                }else{
                    srcStr += ( '&'+ key+'='+value )
                }
            }
            dynamicPptInstance.iframeSrc = srcStr ;
            this._showLoading(dynamicPptInstance);
            this._iframeReloadMonitor( dynamicPptInstance , 'setDynamicPptIframeSrc' );
        }else{
            dynamicPptInstance.iframeSrc = srcStr ;
        }
        if(options.isAgainreconnect){
            dynamicPptInstance.dynamicPptIframeElement.src = '';
        }
        dynamicPptInstance.dynamicPptIframeElement.src = srcStr ;
        L.Logger.debug('set dynamic ppt src:' , srcStr);
    }

    /*获取iframe的src地址*/
    getIframeSrc( id ){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[getIframeSrc]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        return  dynamicPptInstance.iframeSrc ;
    }

    /*跳转到ppt的指定页和帧*/
    jumpToAnimation( id , slide,step , initiative , timeOffset , autoStart ){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[jumpToAnimation]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        this._jumpToAnimation(dynamicPptInstance , slide,step , initiative , timeOffset , autoStart);
    }

    /*下一页*/
    nextSlide(id , autoStart){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[nextPage]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        if(!dynamicPptInstance.isLoadFinished){
            L.Logger.info('[nextPage]dynamic ppt is not load finished  , cannot execute nextPage method');
            return ;
        }
        if( dynamicPptInstance.remoteData && dynamicPptInstance.remoteData.pptslide >= dynamicPptInstance.remoteData.pptslidesCount ){
            L.Logger.warning('[nextPage]dynamic ppt is on the last page , cannot execute nextPage method.');
            return ;
        }
        this._postMessage( dynamicPptInstance , {
            action:"gotoNextSlide" ,
            autoStart:autoStart
        } );
    }

    /*上一页*/
    prevSlide(id , autoStart){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[prevPage]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        if(!dynamicPptInstance.isLoadFinished){
            L.Logger.info('[prevPage]dynamic ppt is not load finished  , cannot execute prevPage method');
            return ;
        }
        if( dynamicPptInstance.remoteData && dynamicPptInstance.remoteData.pptslide <= 1 ){
            L.Logger.warning('[prevPage]dynamic ppt is  on page 1 , cannot execute prevPage method.');
            return ;
        }
        this._postMessage( dynamicPptInstance , {
            action:"gotoPreviousSlide" ,
            autoStart:autoStart
        } );
    }

    /*下一帧*/
    nextStep(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[nextStep]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        if(!dynamicPptInstance.isLoadFinished){
            L.Logger.info('[nextStep]dynamic ppt is not load finished  , cannot execute nextStep method');
            return ;
        }
        this._postMessage( dynamicPptInstance , {
            action:"gotoNextStep" ,
        } );
    }


    /*上一帧*/
    prevStep(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[prevStep]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        if(!dynamicPptInstance.isLoadFinished){
            L.Logger.info('[prevStep]dynamic ppt is not load finished  , cannot execute prevStep method');
            return ;
        }
        this._postMessage( dynamicPptInstance , {
            action:"gotoPreviousStep" ,
        } );
    }


    /*更新动态PPT实例属性*/
    updateDynamicPptProperty(id , updateProperty){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[updateDynamicPptProperty]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        if( updateProperty.associatedMsgID !== undefined ){
            dynamicPptInstance.associatedMsgID =  updateProperty.associatedMsgID ;
        }
        if( updateProperty.associatedUserID !== undefined ){
            dynamicPptInstance.associatedUserID =  updateProperty.associatedUserID ;
        }
        if(updateProperty.synchronizationDynamicPpt !== undefined){
            dynamicPptInstance.synchronizationDynamicPpt = updateProperty.synchronizationDynamicPpt ;
            /*this._postMessage(dynamicPptInstance , {
                action:"changeClassBegin" ,
                classbegin:dynamicPptInstance.synchronizationDynamicPpt
            });*/
            this._postMessage(dynamicPptInstance ,  {
                action:"changePublishDynamicPptMediaPermission_video" ,
                publishDynamicPptMediaPermission_video:dynamicPptInstance.synchronizationDynamicPpt
            });
        }
        if(updateProperty.dynamicPptActionClick !== undefined){
            dynamicPptInstance.dynamicPptActionClick = updateProperty.dynamicPptActionClick ;
            dynamicPptInstance.dynamicPptActionElement.style.display = dynamicPptInstance.dynamicPptActionClick ? 'none' : 'block' ;
            this._postMessage(dynamicPptInstance ,  {
                action:"changeDynamicPptActionClick" ,
                dynamicPptActionClick:dynamicPptInstance.dynamicPptActionClick
            });
        }
        if(updateProperty.canPage !== undefined){
            this._postMessage(dynamicPptInstance ,  {
                action:"changeNewpptPagingPage" ,
                newpptPagingPage:updateProperty.canPage
            });
        }
        if(updateProperty.isShowReloadFileTip !== undefined){
            dynamicPptInstance.isShowReloadFileTip = updateProperty.isShowReloadFileTip ;
        }
        if(updateProperty.languageType !== undefined){
            dynamicPptInstance.languageType = updateProperty.languageType ;
            this._isShowReloadFileShowReloadNumber(dynamicPptInstance);
            if(dynamicPptInstance.againreconnectElement){
                this._setAgainreconnectInfo(dynamicPptInstance);
            }
        }
    }

    /*发送动态PPT的点击action给iframe*/
    postMessageDynamicPptTriggerAction(id , postMessageData){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[postMessageDynamicPptTriggerAction]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        let {slide , fileid} = postMessageData ;
        if( !( dynamicPptInstance.fileid == fileid && dynamicPptInstance.remoteData.pptslide === (slide+1) ) ){
            dynamicPptInstance.dynamicPptActionJson[slide+1] = dynamicPptInstance.dynamicPptActionJson[slide+1] || [];
            dynamicPptInstance.dynamicPptActionJson[slide+1].push(postMessageData);
        }else{
            this._postMessage(dynamicPptInstance , postMessageData);
        }
    }

    /*提供postMessage*/
    postMessage(id , postMessageData){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[postMessage]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        this._postMessage( dynamicPptInstance , postMessageData ) ;
    }

    /*是否加载完成h5文档*/
    isLoadFinished(id){
        let dynamicPptInstance = this.getDynamicPptInstanceByID(id);
        if(!dynamicPptInstance){L.Logger.error( '[isLoadFinished]There are no dynamic ppt Numbers that belong to id '+id ) ;return ;};
        return dynamicPptInstance.isLoadFinished ;
    }

    /*获取动态PPT实例,根据id获取*/
    getDynamicPptInstanceByID(id){
        let dynamicPptInstanceID =  this._getDynamicPptInstanceID(id)  ;
        let dynamicPptInstance = this.dynamicPptInstanceStore[dynamicPptInstanceID] ;
        return dynamicPptInstance ;
    }

    /*跳转到ppt的指定页和帧*/
    _jumpToAnimation( dynamicPptInstance , slide , step , initiative , timeOffset , autoStart ){
        if(dynamicPptInstance.isLoadFinished){
            clearTimeout(this.slideLoadFile.timer);
            this.slideLoadFile = {
                timer: null,
                pptslide: slide,
                fileid: dynamicPptInstance.fileid,
            }
            // console.error('===> dynamicPptInstance: ', dynamicPptInstance);
            this.slideLoadFile.timer = setTimeout(() => {
                dynamicPptInstance.handler.receiveActionCommandCallback('slideLoadTimeout' , {
                    id: dynamicPptInstance.id ,
                    loadTimeoutFile: {
                        pptslide: slide ,
                        pptstep: step ,
                        currpage: slide ,
                        steptotal: dynamicPptInstance.remoteData.pptstepTotal ,
                        fileid: dynamicPptInstance.fileid ,
                        pagenum: dynamicPptInstance.remoteData.pptslidesCount,
                        cdn: Global.nowUseDocAddress,
                    },
                    fileType: 'PPT',
                });
            }, 60000);
            if( dynamicPptInstance.remoteData.pptslide > dynamicPptInstance.remoteData.pptslidesCount || dynamicPptInstance.remoteData.pptslide < 1 ){
                if( dynamicPptInstance.remoteData.pptslide > dynamicPptInstance.remoteData.pptslidesCount ){
                    slide = dynamicPptInstance.remoteData.pptslidesCount ;
                    dynamicPptInstance.remoteData.pptslide = dynamicPptInstance.remoteData.pptslidesCount ;
                }
                if( dynamicPptInstance.remoteData.pptslide < 1 ){
                    slide = 1 ;
                    dynamicPptInstance.remoteData.pptslide = 1 ;
                }
                if(dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback){
                    dynamicPptInstance.handler.receiveActionCommandCallback('dynamicPptSlideChange' , {
                        id:dynamicPptInstance.id ,
                        updateFileData:{
                            pptslide:dynamicPptInstance.remoteData.pptslide ,
                            pptstep:dynamicPptInstance.remoteData.pptstep ,
                            currpage:dynamicPptInstance.remoteData.pptslide ,
                            steptotal:dynamicPptInstance.remoteData.pptstepTotal ,
                            fileid:dynamicPptInstance.fileid ,
                            pagenum:dynamicPptInstance.remoteData.pptslidesCount
                        }
                    });
                }
            }
        }
        let data = {
            action:"jumpToAnim" ,
            data:{
                slide:slide  ,
                step:step ,
                timeOffset:timeOffset ,
                autoStart:autoStart ,
                initiative:initiative
            }
        } ;
        this._postMessage(dynamicPptInstance , data) ;
    }

    /*发送消息给动态ppt的iframe框架*/
    _postMessage(dynamicPptInstance , data){
        if(dynamicPptInstance.isLoadFinished){
            try{
                if(dynamicPptInstance.dynamicPptIframeElement && dynamicPptInstance.dynamicPptIframeElement.src ){
                    let source =  "ys_dynamicPPT" ;
                    let sendData = {
                        source:source ,
                        data:data
                    };
                    sendData = JSON.stringify(sendData);
                    if(dynamicPptInstance.dynamicPptIframeElement && dynamicPptInstance.dynamicPptIframeElement.contentWindow && dynamicPptInstance.dynamicPptIframeElement.contentWindow.postMessage){
                        L.Logger.debug('[_postMessage]dynamic ppt postMessage instanceId is '+dynamicPptInstance.id+',sendData:'+sendData);
                        dynamicPptInstance.dynamicPptIframeElement.contentWindow.postMessage(sendData ,"*" );
                    }
                }
            }catch (err){
                L.Logger.error( '[_postMessage] dynamic ppt postMessage error:' , err );
            }
        }else{
            dynamicPptInstance.awitExecutePostMessageArray.push(data);
        }
    }

    /*显示loading*/
    _showLoading(dynamicPptInstance){
        dynamicPptInstance.dynamicPptLoadingElement.style.display = 'block' ;
        this._isShowReloadFileShowReloadNumber( dynamicPptInstance );
    }

    /*隐藏loading*/
    _hideLoading(dynamicPptInstance){
        dynamicPptInstance.dynamicPptLoadingElement.style.display = 'none' ;
        this._isShowReloadFileShowReloadNumber( dynamicPptInstance );
    }

    /*获取动态PPT实例id,根据id获取*/
    _getDynamicPptInstanceID(id){
        let dynamicPptInstanceID = !this.uniqueDynamicPpt && id !== undefined && id !== null  ? (this.dynamicPptInstanceIDPrefix+id) :  this.dynamicPptInstanceDefaultID ;
        if(id && typeof id === 'string'){
            let rq = new RegExp(this.specialDynamicPptInstanceIDPrefix , 'g') ;
            if( rq .test(id) ){
                dynamicPptInstanceID = id ;
            }
        }
        return dynamicPptInstanceID ;
    };

    /*销毁动态PPT实例，通过实例dynamicPptInstance*/
    _destroyDynamicPptInstance(dynamicPptInstance){
        let dynamicPptInstanceID = dynamicPptInstance.dynamicPptInstanceID ;
        let dynamicPptElement = dynamicPptInstance.dynamicPptElement;
        if(!dynamicPptElement){
            L.Logger.warning( '[destroy] dynamicPpt elements do not exist , element id is:'+dynamicPptInstance.dynamicPptElementId+'!' ) ;
        }else{
            dynamicPptElement.innerHTML = '' ;
        }
        for(let key of Object.keys(dynamicPptInstance) ){
            dynamicPptInstance[key] = null ;
            delete dynamicPptInstance[key] ;
        }
        this.dynamicPptInstanceStore[dynamicPptInstanceID] = null ; //动态PPT实例
        delete  this.dynamicPptInstanceStore[dynamicPptInstanceID]  ;
    };

    /*接收动态PPT的iframe消息*/
    _receiveWindowMessageEvent(instanceId, dynamicPptInstance , event){
        // 通过origin属性判断消息来源地址
        if( event.data ){
            let data = undefined;
            let recvData = undefined ;
            try{
                recvData =  JSON.parse(event.data) ;
                data = recvData.data ;
            }catch (e){
                L.Logger.warning(  "dynamic ppt receive iframe message data can't be converted to JSON , iframe data:" , event.data ) ;
                return ;
            }
            if(recvData && recvData.source === "ys_dynamicPPT") {
                L.Logger.debug("[dynamicPpt]receive remote iframe data form "+ event.origin +":",  event );
                const INITEVENT = "initEvent";
                const SLIDECHANGEEVENT = "slideChangeEvent";
                const STEPCHANGEEVENT = "stepChangeEvent";
                const AUTOPLAYVIDEOINNEWPPT = "autoPlayVideoInNewPpt" ;
                const CLICKNEWPPTTRIGGEREVENT = "clickNewpptTriggerEvent" ;
                const CLICKLINK = "clickLink" ;
                const ALLVIDEOANDAUDIO = "allVideoAndAudio";
                const AGAINRECONNECT = "againReconnect";
                const CLINETAUDIOPLAYER = "clinetAudioPlayer";
                switch (data.action) {
                    case INITEVENT :
                        this._handleIframeMessage_initEvent(dynamicPptInstance , data);
                        break;
                    case SLIDECHANGEEVENT :
                    case STEPCHANGEEVENT :
                        this._handleIframeMessage_slideOrStepChangeEvent(dynamicPptInstance , data , data.action);
                        break;
                    case AUTOPLAYVIDEOINNEWPPT:
                        this._handleIframeMessage_autoPlayVideoInNewPpt(dynamicPptInstance , data);
                        break;
                    case CLINETAUDIOPLAYER:
                        this._handleIframeMessage_autoPlayAudioInNative(dynamicPptInstance , data);
                    break;
                    case CLICKNEWPPTTRIGGEREVENT:
                        this._handleIframeMessage_clickNewpptTriggerEvent(instanceId, dynamicPptInstance , data);
                        break ;
                    case ALLVIDEOANDAUDIO:
                        //FIXME 此处处理由文档工具条代为处理
                        break;
                    case CLICKLINK:
                        //TODO 超链接 ， bug:触发器的也会走这
                        break ;
                    case AGAINRECONNECT: //动态PPT内部要求重新加载文档
                        L.Logger.warning('[dynamic ppt]again reconnect info from dynamic ppt inner, again reconnect number is '+ dynamicPptInstance.againreconnectNum);
                        dynamicPptInstance.againreconnectNum++;
                        if(dynamicPptInstance.againreconnectNum<=1){
                            if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
                                dynamicPptInstance.handler.receiveActionCommandCallback('reloadCurrentDocument' ,{
                                    id:dynamicPptInstance.id ,
                                    iframeSrc:dynamicPptInstance.iframeSrc ,
                                    fileid:dynamicPptInstance.fileid ,
                                    forceReloadNumber:dynamicPptInstance.forceReloadNumber,
                                    isAgainreconnect:true
                                })
                            }
                        }else{
                            if(dynamicPptInstance.againreconnectElement){
                                if(dynamicPptInstance.againreconnectElement.parentNode){
                                    dynamicPptInstance.againreconnectElement.parentNode.removeChild(dynamicPptInstance.againreconnectElement);
                                }
                            }
                            if(dynamicPptInstance.playback){
                                return;
                            }
                            dynamicPptInstance.againreconnectElement = document.createElement('div');
                            dynamicPptInstance.againreconnectElement.className =  'againreconnect-container';
                            let againreconnectBox = document.createElement('div');
                            againreconnectBox.className = 'againreconnect-box';
                            let topSpan = document.createElement('span');
                            topSpan.className = 'top-box title';
                            let topMiddle = document.createElement('span');
                            topMiddle.className = 'middle-box point-icon';
                            let bottomMiddle = document.createElement('span');
                            bottomMiddle.className = 'bottom-box ok-container';
                            let okBtn = document.createElement('button');
                            okBtn.className = 'ok-btn';
                            okBtn.onclick = ()=>{
                                this._postMessage(dynamicPptInstance,{
                                    action:'userTriggerAudio'
                                });
                                if(dynamicPptInstance.againreconnectElement){
                                    if(dynamicPptInstance.againreconnectElement.parentNode){
                                        dynamicPptInstance.againreconnectElement.parentNode.removeChild(dynamicPptInstance.againreconnectElement);
                                    }
                                }
                                dynamicPptInstance.againreconnectElement = undefined;
                            };
                            okBtn.ontouchend = ()=>{
                                this._postMessage(dynamicPptInstance,{
                                    action:'userTriggerAudio'
                                });
                                if(dynamicPptInstance.againreconnectElement){
                                    if(dynamicPptInstance.againreconnectElement.parentNode){
                                        dynamicPptInstance.againreconnectElement.parentNode.removeChild(dynamicPptInstance.againreconnectElement);
                                    }
                                }
                                dynamicPptInstance.againreconnectElement = undefined;
                            };
                            bottomMiddle.appendChild(okBtn);
                            againreconnectBox.appendChild(topSpan);
                            againreconnectBox.appendChild(topMiddle);
                            againreconnectBox.appendChild(bottomMiddle);
                            dynamicPptInstance.againreconnectElement.appendChild(againreconnectBox);
                            let againreconnectElementParnetNode = dynamicPptInstance.againreconnectElementParentNode || dynamicPptInstance.dynamicPptInstanceElement ;
                            againreconnectElementParnetNode.appendChild(dynamicPptInstance.againreconnectElement);
                            this._setAgainreconnectInfo(dynamicPptInstance);
                        }
                        break;
                };
            }
        }
    }

    /*处理iframe的initEvent消息*/
    _handleIframeMessage_initEvent(dynamicPptInstance , data){
        clearTimeout( dynamicPptInstance.forceReloadNumberTimer );
        dynamicPptInstance.forceReloadNumberTimer = null ;
        dynamicPptInstance.remoteData.pptview = data.view;
        dynamicPptInstance.remoteData.pptslidesCount = data.slidesCount;
        dynamicPptInstance.remoteData.pptslide = data.slide + 1 ;
        dynamicPptInstance.remoteData.pptstep = data.step ;
        dynamicPptInstance.remoteData.pptstepTotal = data.stepTotal ;
        if(dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback){
            dynamicPptInstance.handler.receiveActionCommandCallback('dynamicPptSlideChange' , {
                id:dynamicPptInstance.id ,
                updateFileData:{
                    pptslide:dynamicPptInstance.remoteData.pptslide ,
                    pptstep:dynamicPptInstance.remoteData.pptstep ,
                    currpage:dynamicPptInstance.remoteData.pptslide ,
                    steptotal:dynamicPptInstance.remoteData.pptstepTotal ,
                    fileid:dynamicPptInstance.fileid ,
                    pagenum:dynamicPptInstance.remoteData.pptslidesCount
                }
            });
            dynamicPptInstance.handler.receiveActionCommandCallback('updateWhiteboardWatermarkImageScale' , {
                id:dynamicPptInstance.id ,
                scale:dynamicPptInstance.remoteData.pptview.width / dynamicPptInstance.remoteData.pptview.height ,
            });
            dynamicPptInstance.handler.receiveActionCommandCallback('dynamicPptLoadEnd' , {
                id:dynamicPptInstance.id ,
                scale:dynamicPptInstance.remoteData.pptview.width / dynamicPptInstance.remoteData.pptview.height ,
                reloadNumber:dynamicPptInstance.forceReloadNumber,
                success: true,
            });
        }
        if(!dynamicPptInstance.isLoadFinished){
            dynamicPptInstance.isLoadFinished = true ;
            if(dynamicPptInstance.awitJumpToAnimPptslide !== undefined){
                this._jumpToAnimation(dynamicPptInstance , dynamicPptInstance.awitJumpToAnimPptslide , dynamicPptInstance.awitJumpToAnimPptstep );
                dynamicPptInstance.awitJumpToAnimPptslide = undefined ;
                dynamicPptInstance.awitJumpToAnimPptstep = undefined ;
                delete  dynamicPptInstance.awitJumpToAnimPptslide ;
                delete  dynamicPptInstance.awitJumpToAnimPptstep ;
            }
        };
        if(dynamicPptInstance.awitExecutePostMessageArray && dynamicPptInstance.awitExecutePostMessageArray.length>0){
            for(let postMessageData of dynamicPptInstance.awitExecutePostMessageArray){
                this._postMessage(dynamicPptInstance , postMessageData);
            }
        }
        dynamicPptInstance.awitExecutePostMessageArray.length = 0 ;
        this._hideLoading(dynamicPptInstance);
    };

    /*处理iframe的slideChangeEvent或者stepChangeEvent消息*/
    _handleIframeMessage_slideOrStepChangeEvent(dynamicPptInstance , data , eventAction){
        dynamicPptInstance.remoteData.pptslide = data.slide + 1 ;
        dynamicPptInstance.remoteData.pptstep = data.step ;
        dynamicPptInstance.remoteData.pptstepTotal = data.stepTotal ;
        if(dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback){
            dynamicPptInstance.handler.receiveActionCommandCallback(eventAction === 'slideChangeEvent' ? 'dynamicPptSlideChange' : 'dynamicPptStepChange' , {
                id:dynamicPptInstance.id ,
                updateFileData:{
                    pptslide:dynamicPptInstance.remoteData.pptslide ,
                    pptstep:dynamicPptInstance.remoteData.pptstep ,
                    currpage:dynamicPptInstance.remoteData.pptslide ,
                    steptotal:dynamicPptInstance.remoteData.pptstepTotal ,
                    fileid:dynamicPptInstance.fileid ,
                    pagenum:dynamicPptInstance.remoteData.pptslidesCount
                }
            });
        }
        if (dynamicPptInstance.fileid === this.slideLoadFile.fileid && dynamicPptInstance.remoteData.pptslide === this.slideLoadFile.pptslide) {
            clearTimeout(this.slideLoadFile.timer);
        }
        if ( Object.keys(dynamicPptInstance.dynamicPptActionJson).length > 0  && dynamicPptInstance.dynamicPptActionJson[dynamicPptInstance.remoteData.pptslide]) {
            if (dynamicPptInstance.dynamicPptActionJson[dynamicPptInstance.remoteData.pptslide].length !== 0) {
                for(let dynamicPptAction of dynamicPptInstance.dynamicPptActionJson[dynamicPptInstance.remoteData.pptslide] ) {
                    this._postMessage(dynamicPptInstance , dynamicPptAction);
                }
                dynamicPptInstance.dynamicPptActionJson[dynamicPptInstance.remoteData.pptslide].length = 0 ;
                delete dynamicPptInstance.dynamicPptActionJson[dynamicPptInstance.remoteData.pptslide] ;
            }
        }
        if(data.externalData && data.externalData.initiative){
            this._sendSignalling_ShowPage(dynamicPptInstance , {
                data:{
                    action:eventAction === 'slideChangeEvent' ? 'slide' : 'step' ,
                }
            });
            if(dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback) {
                dynamicPptInstance.handler.receiveActionCommandCallback('closeAllSelectBox', {
                    id: dynamicPptInstance.id,
                });
            }
        }
    };

    /*处理iframe的autoPlayVideoInNewPpt消息*/
    _handleIframeMessage_autoPlayVideoInNewPpt(dynamicPptInstance , data){
        if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
            let { isvideo , url , fileid } = data ;
            let action = 'publishDymanicPptNetworkMedia';
            let cmd = {
                id:dynamicPptInstance.id ,
                url:url ,
                video:isvideo ,
                audio:true ,
                attributes:{
                    source:'dynamicPPT' ,
                    filename:'' ,
                    fileid:fileid ,
                }
            };
            dynamicPptInstance.handler.receiveActionCommandCallback( action , cmd );
        }
    }

    _handleIframeMessage_autoPlayAudioInNative(dynamicPptInstance , data){
        if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
            let { isPlay , url , fileid , ...other} = data ;
            let action = 'publishDymanicPptNetworkAudio';
            let cmd = {
                id:dynamicPptInstance.id ,
                url:url ,
                isPlay:isPlay ,
                audio:true ,
                attributes:{
                    source:'dynamicPPT' ,
                    filename:'' ,
                    fileid:fileid ,
                    type:'audio' ,
                    other:other ,
                    currentPage:dynamicPptInstance.remoteData.pptslide
                },
            };
            dynamicPptInstance.handler.receiveActionCommandCallback( action , cmd );
        }
    }

    /*处理iframe的clickNewpptTriggerEvent消息*/
    _handleIframeMessage_clickNewpptTriggerEvent(instanceId, dynamicPptInstance , data){
        if(data.externalData && data.externalData.initiative){
            data.fileid = dynamicPptInstance.fileid ;
            data.sourceInstanceId = instanceId;
            this._sendSignallingToServer(dynamicPptInstance , {
                name:instanceId === 'default'?'NewPptTriggerActionClick':'ExtendNewPptTriggerActionClick' ,
                id:instanceId === 'default'?'NewPptTriggerActionClick':`NewPptTriggerActionClick_${instanceId}`,
                toID:'__allExceptSender' ,
                data:data ,
            });
            if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback){
                dynamicPptInstance.handler.receiveActionCommandCallback('closeAllSelectBox' , {
                    id:dynamicPptInstance.id ,
                });
            }
        }
    }

    /*发送信令*/
    _sendSignallingToServer(dynamicPptInstance , {name ,id , toID = '__all' ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID} = {} ){
        if(dynamicPptInstance.handler && dynamicPptInstance.handler.sendSignallingToServer) {
            associatedMsgID = associatedMsgID || dynamicPptInstance.associatedMsgID  ;
            associatedUserID = associatedUserID || dynamicPptInstance.associatedUserID ;
            dynamicPptInstance.handler.sendSignallingToServer(name ,id , toID ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID);
        }
    }

    /*监测iframe进行重新加载*/
    _iframeReloadMonitor(dynamicPptInstance , source ){
        clearTimeout( dynamicPptInstance.forceReloadNumberTimer );
        dynamicPptInstance.forceReloadNumberTimer = null ;
        if( dynamicPptInstance.iframeSrc && !dynamicPptInstance.isLoadFinished && dynamicPptInstance.forceReloadNumber < dynamicPptInstance.maxForceReloadNumber ){
            dynamicPptInstance.forceReloadNumberTimer = setTimeout( () => {
                if( dynamicPptInstance.iframeSrc && !dynamicPptInstance.isLoadFinished && dynamicPptInstance.forceReloadNumber < dynamicPptInstance.maxForceReloadNumber ){
                    dynamicPptInstance.forceReloadNumber++ ;
                    this._isShowReloadFileShowReloadNumber( dynamicPptInstance );
                    if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
                        dynamicPptInstance.handler.receiveActionCommandCallback('reloadDynamicPptIframeSrc' ,{
                            id:dynamicPptInstance.id ,
                            iframeSrc:dynamicPptInstance.iframeSrc ,
                            source:source ,
                            fileid:dynamicPptInstance.fileid ,
                            forceReloadNumber:dynamicPptInstance.forceReloadNumber
                        })
                    }
                }
            } , dynamicPptInstance.forceReloadInterval ) ;
        }
        if(dynamicPptInstance.iframeSrc && !dynamicPptInstance.isLoadFinished && dynamicPptInstance.forceReloadNumber === 1){
            if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
                dynamicPptInstance.handler.receiveActionCommandCallback('dynamicPptReloadFail' ,{
                    id: dynamicPptInstance.id ,
                    forceReloadNumber: 0,
                    success: false,
                    
                })
            }
        }
    }


    /*发送ShowPage信令*/
    _sendSignalling_ShowPage(dynamicPptInstance , updatePubmsgData = {} ){
        if( dynamicPptInstance.handler && dynamicPptInstance.handler.receiveActionCommandCallback ){
            dynamicPptInstance.handler.receiveActionCommandCallback('sendSignalling_ShowPage' ,{
                id:dynamicPptInstance.id ,
                updatePubmsgData:updatePubmsgData
            })
        }
    }


    /*是否显示文件重新加载提示*/
    _isShowReloadFileShowReloadNumber( dynamicPptInstance ){
        dynamicPptInstance.dynamicPptReloadNumberElement.style.display = dynamicPptInstance.isShowReloadFileTip &&  dynamicPptInstance.forceReloadNumber ? 'inline-table' : 'none' ;
        let forceReloadNumberTip = '当前网络不稳定，正在尝试重新打开课件……第'+dynamicPptInstance.forceReloadNumber+'次' ;
        switch ( dynamicPptInstance.languageType  ){
            case 'tw':
                forceReloadNumberTip = '當前網絡不穩定，正在嘗試重新打開課件……第'+dynamicPptInstance.forceReloadNumber+'次' ;
                break;
            case 'en':
                forceReloadNumberTip = 'The network is unstable , Trying to reopen the courseware ...'+dynamicPptInstance.forceReloadNumber+'' ;
                break;
            case 'ja':
                forceReloadNumberTip = 'ネットが不安定です、教材を開きなおしています'+dynamicPptInstance.forceReloadNumber+'次' ;
                break;
        }
        dynamicPptInstance.dynamicPptReloadNumberElement.innerHTML = forceReloadNumberTip || '' ;
    };

    _setAgainreconnectInfo(dynamicPptInstance){
        if(dynamicPptInstance.againreconnectElement){
            let topSpan = dynamicPptInstance.againreconnectElement.getElementsByClassName('top-box')[0];
            let okBtn = dynamicPptInstance.againreconnectElement.getElementsByClassName('ok-btn')[0];
            if(topSpan || okBtn){
                let againreconnectTitle = '加载有点慢......' ;
                let againreconnectOk = '点此继续';
                switch ( dynamicPptInstance.languageType  ){
                    case 'tw':
                        againreconnectTitle = '加載有點慢......' ;
                        againreconnectOk = '點此繼續';
                        break;
                    case 'en':
                        againreconnectTitle = 'Loading a bit slow...' ;
                        againreconnectOk = 'Click to continue';
                        break;
                    case 'ja':
                        againreconnectTitle = 'インストールに時間がかかっています。...' ;
                        againreconnectOk = '続行する';
                        break;
                }
                if(topSpan){
                    topSpan.innerHTML = againreconnectTitle;
                }
                if(okBtn){
                    okBtn.innerHTML = againreconnectOk;
                }
            }

        }
    }
};
const  DynamicPptIntermediateLayerInstance = new DynamicPptIntermediateLayer();
export default DynamicPptIntermediateLayerInstance ;
