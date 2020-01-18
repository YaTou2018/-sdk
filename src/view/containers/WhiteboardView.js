/* 白板视图（视图入口）
 * @module WhiteboardView
 * @description  sdk白板视图入口
 * @author 邱广生
 * @date 2018-04-18
 */
'use strict';
import DomUtils from '../../utils/DomUtils';
import Configuration from '../../utils/Configuration';
import Constant from '../../utils/Constant';
import Global from '../../utils/Global';
import Utils from '../../utils/Utils';
import WhiteboardIntermediateLayerInstance from '../../intermediateLayer/WhiteboardIntermediateLayer';
import DynamicPptIntermediateLayerInstance from '../../intermediateLayer/DynamicPptIntermediateLayer';
import H5DocumentIntermediateLayerInstance from '../../intermediateLayer/H5DocumentPptIntermediateLayer';

class WhiteboardView{
    constructor( parentNode = document.body , instanceId = 'default' , configration = Object.deepAssign({} , Configuration.defaultWhiteboard , Configuration.commonWhiteboard )  , receiveActionCommand = undefined , whiteBoardManagerInstance = undefined ){
        this.parentNode = parentNode ; //节点
        this.instanceId = instanceId ; //白板实例id
        this.configration = configration ; //配置项
        this.receiveActionCommand = receiveActionCommand ; //接受白板动作指令函数
        this.whiteBoardManagerInstance = whiteBoardManagerInstance ; //白板管理器
        this.elements = {};
        this.fileid = 0 ;
        this.fullScreen = false ; //是否全屏
        this.remark = false ; //是否开启文档备注
        this.scale = this.configration.defaultWhiteboardScale;// 课件比例
        this.loadDocumentFail = undefined;
        this.remarkText = '' ; //当前页文档备注的文本内容
        this.fileTypeMark = 'generalDocument' ; //generalDocument 、 dynamicPPT 、 h5Document
        this.cacheMaxPageNum = 1;        //当前打开文档的缓存的最大页数，缺省为1
        this.cacheMinPageNum = 1;        //当前打开文档的缓存的最小页数，缺省为1
        this.filePreLoadCurrPage = 1;        //当前打开文档的缓存的当前页，缺省为1
        this.filePreLoadStep = 2;     //普通文档预加载步长，缺省为2
        this.dynamicPptVolume = 100 ; //动态PPT音量大小
        this.maxGeneralFileForceReloadNumber = 10 ; //普通文件最大重新加载次数
        this.generalDocumentFileForceReloadNumber = 0 ; //普通文件重新加载次数
        this.volume = 100;
        this.whiteboardViewState = {
            tool: {},  //白板标注工具信息
            action: {}, //撤销、恢复、清空信息
            zoom: {},  //方法缩小信息
            page: {}, //翻页信息
            documentType: this.fileTypeMark, //打开的文件类别，generalDocument（普通文档）、dynamicPPT（动态PPT）、h5Document(H5课件)
            fileid: this.fileid, //打开的文档的文件id
            dynamicPptVolume: this.dynamicPptVolume, //动态PPT文档的音量
            fullScreen: this.fullScreen, //是否全屏
            remark: this.remark, //是否开启文档备注
            scale:this.scale,//课件比例
            remarkText:this.remarkText , //当前页文档备注的文本内容
            other:{ //其它信息
                primaryColor: this.configration.primaryColor ,  //画笔颜色 ,默认 #000000
                secondaryColor:this.configration.secondaryColor ,  //填充颜色 ,默认 #ffffff
                backgroundColor: 'none' || this.configration.backgroundColor ,   //背景颜色 ,默认 #ffffff
                pencilWidth:this.configration.pencilWidth , //画笔大小 , 默认5
                shapeWidth:this.configration.shapeWidth, //图形画笔大小 , 默认5
                eraserWidth:this.configration.eraserWidth, //橡皮大小 ， 默认15
                fontSize:this.configration.fontSize , //字体大小 ， 默认18
                fontFamily:this.configration.fontFamily , //使用的字体 ，默认"微软雅黑"
            }
        };
        this._createElements();
        this._connectElements();
    }

    /*获取配置项*/
    getConfigration(){
        return this.configration ;
    }

    /*保存白板数据且加载当前页的白板数据*/
    saveFiledataAndLoadCurrpageWhiteboardData( updateFiledata = {} ){
        this._saveFiledataAndLoadCurrpageWhiteboardData( updateFiledata );
    }

    /*通知白板sdk执行动作指令*/
    noticeWhiteboardActionCommand(action,cmd){
        if(this.instanceId === 'default'){
            switch (action){
                case 'playOrPauseDynamicPpt':
                    if( this.fileTypeMark === 'dynamicPPT' ){
                        DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , {
                            action:!cmd.pause?"playDynamicPpt" : "stopDynamicPpt" ,
                        } );
                    }
                    break;
                case 'updateMute':
                    if( this.fileTypeMark === 'dynamicPPT' ){
                        DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , {
                            action:'ExtendedNotice' ,
                            extendedData:{
                                type:"updateMute" ,
                                data:{mute:cmd.isMute}
                            }
                        });
                    }
                    break;
                case 'ExtendedNotice':
                    if( this.fileTypeMark === 'dynamicPPT' ){
                        DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , {
                            action:'ExtendedNotice' ,
                            extendedData:cmd.extendedData
                        });
                    }
                    break;
                case 'closeDynamicPptAutoVideo':
                    if( this.fileTypeMark === 'dynamicPPT' ){
                        DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , {
                            action:'closeDynamicPptAutoVideo' ,
                        });
                    }
                    break;
            }
        }
    }

    /*重新加载文档*/
    reloadCurrentDocument( options = {} ){
        // if (this.isPreloadFile(WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId))) return;
        if( this.instanceId === 'default' || this.configration.hasExtendDocument){
            switch ( this.fileTypeMark ){
                case 'generalDocument':
                    let { cospdfpath, swfpath ,  isContentDocument, fileid  , filetype , currpage } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
                    if(cospdfpath){
                        // swfpath = cospdfpath
                    }
                    if( swfpath && filetype !== 'whiteboard' && fileid != 0 ){
                        let src;
                        if (Number(isContentDocument)) {
                            if (swfpath) {
                                src = swfpath;
                            }
                        }else {
                            let index = swfpath.lastIndexOf(".") ;
                            let imgType = swfpath.substring(index);
                            let fileUrl = swfpath.replace(imgType,"-"+currpage+imgType) ;
                            src = Global.nowUseDocAddress +  fileUrl;
                        }
                        WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage(this.instanceId , src , {resetDedaultWhiteboardMagnification:false} );
                    }
                    break;
                case 'dynamicPPT':
                    if( !options.isAgainreconnect ) {
                        this.forceReloadTimestampFromPpt = new Date().getTime();
                    }
                    this._loadCurrentDynamicPpt({},{isAgainreconnect:options.isAgainreconnect});
                    break;
                case 'h5Document':
                    this._loadCurrentH5Document( {
                        forceReloadTimestamp:new Date().getTime()
                    });
                    break;
            }
        }
    }

    /*改变文档备注的开启状态*/
    changeDocumentRemarkState( isRemark ){
        this.remark = isRemark && this.configration.canRemark ;
        this._viewStateUpdate() ;
    }

    /*改变全屏状态*/
    changeFullScreenState( isFullScreen ){
        this.fullScreen = isFullScreen ;
        this._viewStateUpdate() ;
        this.resizeWhiteboardHandler();
    }

    /*销毁白板视图*/
    destroyWhiteboardView(){
        if( WhiteboardIntermediateLayerInstance.hasWhiteboardById(this.instanceId) ){
            WhiteboardIntermediateLayerInstance.destroyWhiteboardInstance(this.instanceId);
        }
        if( DynamicPptIntermediateLayerInstance.hasDynamicPptById(this.instanceId) ){
            DynamicPptIntermediateLayerInstance.destroyDynamicPptInstance(this.instanceId);
        }
        if( H5DocumentIntermediateLayerInstance.hasH5DocumentById(this.instanceId) ){
            H5DocumentIntermediateLayerInstance.destroyH5DocumentInstance(this.instanceId);
        }
        DomUtils.removeChild(this.elements.whiteboardViewRootElement , this.parentNode );
        for(let key in this.elements){
            this.elements[key] = undefined ;
            delete this.elements[key] ;
        }
    };

    /*改变白板相关配置*/
    changeWhiteBoardConfigration(configration){
        Object.deepAssign(this.configration , configration);
        let whiteboardConfigrationCopy = {} , dynamicPptConfigrationCopy = {} , h5DocumentConfigrationCopy = {} ;
        for(let [key , value] of Object.entries(configration) ){
            if(key === 'canDraw'){
                whiteboardConfigrationCopy['deawPermission'] = this.configration.canDraw && this.configration.synchronization && this.configration.isConnectedRoom  ;
            } else if(key === 'myUserId'){
                whiteboardConfigrationCopy['myselfId'] = value ;
            }else if(key === 'myName'){
                whiteboardConfigrationCopy['nickname'] = value ;
            }else if(key === 'primaryColor' || key === 'secondaryColor' || key === 'primaryColor' ){
                whiteboardConfigrationCopy[key.replace(/Color/g , '')] = value ;
            }else if(key === 'synchronization'){
                whiteboardConfigrationCopy['synchronizationWhiteboard'] = this.configration.synchronization && this.configration.isConnectedRoom   ;
            }else {
                whiteboardConfigrationCopy[key] = value ;
            }
            if(key === 'synchronization'){
                dynamicPptConfigrationCopy['synchronizationDynamicPpt'] =   this.configration.synchronization && this.configration.isConnectedRoom ;
            }else if(key === 'actionClick'){
                dynamicPptConfigrationCopy['dynamicPptActionClick'] = this.configration.actionClick && this.configration.isConnectedRoom ;
            }else{
                dynamicPptConfigrationCopy[key] = value ;
            }
            if(key === 'synchronization'){
                h5DocumentConfigrationCopy['synchronizationH5Document'] =  this.configration.synchronization && this.configration.isConnectedRoom  ;
            }else if(key === 'actionClick'){
                h5DocumentConfigrationCopy['h5DocumentActionClick'] = this.configration.actionClick && this.configration.isConnectedRoom  ;
            }else{
                h5DocumentConfigrationCopy[key] = value ;
            }
        }
        if( configration['isConnectedRoom'] !== undefined ){
            whiteboardConfigrationCopy['synchronizationWhiteboard'] = this.configration.synchronization && this.configration.isConnectedRoom   ;
            dynamicPptConfigrationCopy['synchronizationDynamicPpt'] =   this.configration.synchronization && this.configration.isConnectedRoom ;
            h5DocumentConfigrationCopy['synchronizationH5Document'] =  this.configration.synchronization && this.configration.isConnectedRoom  ;
            dynamicPptConfigrationCopy['dynamicPptActionClick'] = this.configration.actionClick && this.configration.isConnectedRoom ;
            h5DocumentConfigrationCopy['h5DocumentActionClick'] = this.configration.actionClick && this.configration.isConnectedRoom  ;
            whiteboardConfigrationCopy['deawPermission'] = this.configration.canDraw && this.configration.synchronization && this.configration.isConnectedRoom  ;
        }
        if( configration['synchronization'] !== undefined ){
            whiteboardConfigrationCopy['deawPermission'] = this.configration.canDraw && this.configration.synchronization && this.configration.isConnectedRoom  ;
        }

        WhiteboardIntermediateLayerInstance.updateWhiteboardProperty(this.instanceId , whiteboardConfigrationCopy);
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DynamicPptIntermediateLayerInstance.updateDynamicPptProperty(this.instanceId , dynamicPptConfigrationCopy);
        }
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            H5DocumentIntermediateLayerInstance.updateH5DocumentProperty(this.instanceId , h5DocumentConfigrationCopy );
        }
        if(configration.loadDynamicPptView !== undefined && this.elements.dynamicPptViewElement){
            if( configration.loadDynamicPptView && !document.getElementById( this.elements.dynamicPptViewElement.getAttribute('id') ) ){
                DomUtils.appendChild( this.elements.documentViewElement  , this.elements.dynamicPptViewElement );
                this._productionDynamicPpt(); //生产动态PPT
            }else if(!configration.loadDynamicPptView  && document.getElementById( this.elements.dynamicPptViewElement.getAttribute('id') ) ){
                if( DynamicPptIntermediateLayerInstance.hasDynamicPptById(this.instanceId) ){
                    DynamicPptIntermediateLayerInstance.destroyDynamicPptInstance(this.instanceId);
                }
                DomUtils.removeChild(this.elements.dynamicPptViewElement , this.elements.documentViewElement );
            }
        }
        if(configration.loadH5DocumentView !== undefined && this.elements.h5DocumentViewElement){
            if( configration.loadH5DocumentView && !document.getElementById( this.elements.h5DocumentViewElement.getAttribute('id') ) ){
                DomUtils.appendChild( this.elements.documentViewElement  , this.elements.h5DocumentViewElement );
                this._productionH5Document(); //生产H5课件
            }else if(!configration.loadH5DocumentView  && document.getElementById( this.elements.h5DocumentViewElement.getAttribute('id') ) ){
                if( H5DocumentIntermediateLayerInstance.hasH5DocumentById(this.instanceId) ){
                    H5DocumentIntermediateLayerInstance.destroyH5DocumentInstance(this.instanceId);
                }
                DomUtils.removeChild(this.elements.h5DocumentViewElement , this.elements.documentViewElement );
            }
        }
        if( configration.rootBackgroundColor !== undefined){
            DomUtils.updateStyle(this.elements.whiteboardViewRootElement , {
                backgroundColor: 'none' || configration.rootBackgroundColor
            });
        }
        if( configration.isMobile !== undefined ){
            if( configration.isMobile ){
                DomUtils.addClass(this.elements.whiteboardViewRootElement , 'app-mobile');
            }else{
                DomUtils.removeClass(this.elements.whiteboardViewRootElement , 'app-mobile');
            }
        }
        if( configration.canPage !== undefined || configration.addPage !== undefined || configration.isConnectedRoom !== undefined ){
            this._viewStateUpdate();
        }
    };

    /*处理room-pubmsg*/
    receiveEventRoomPubmsg(recvEventData){
        if(recvEventData && typeof recvEventData === 'string'){
            recvEventData = JSON.parse( recvEventData );
        }
        if(typeof recvEventData === 'object' &&  recvEventData.message && typeof recvEventData.message === 'string'){
            recvEventData.message = JSON.parse( recvEventData.message );
        }
        if(typeof recvEventData.message === 'object' && recvEventData.message.data && typeof recvEventData.message.data === 'string'){
            recvEventData.message.data = JSON.parse( recvEventData.message.data );
        }
        let pubmsgData = recvEventData.message ;
        switch(pubmsgData.name) {
            case "ShowPage":
            case "ExtendShowPage":
                pubmsgData.source = 'room-pubmsg' ;
                this._handleShowPageSignalling(pubmsgData, recvEventData.local);
                break;
            case "whiteboardMarkTool":
            case "ExtendWhiteboardMarkTool":
                if(pubmsgData.data && pubmsgData.data.selectMouse){
                    WhiteboardIntermediateLayerInstance.activeWhiteboardTool('tool_mouse' , this.instanceId);
                }else{
                    WhiteboardIntermediateLayerInstance.useHistoryPenTool(this.instanceId);
                }
                break;
            case "NewPptTriggerActionClick":
            case "ExtendNewPptTriggerActionClick":
                if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                    DynamicPptIntermediateLayerInstance.postMessageDynamicPptTriggerAction(this.instanceId , pubmsgData.data );
                }
                break;
            case "H5DocumentAction":
            case "ExtendH5DocumentAction":
                if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                    H5DocumentIntermediateLayerInstance.postMessageH5DocumentTriggerAction(this.instanceId , pubmsgData.data );
                }
                break ;
            case "PptVolumeControl":
            case "ExtendPptVolumeControl":
                this.volume = pubmsgData.data.volume * 100;
                this._updatedynamicPptVolume( pubmsgData.data.volume * 100 );
                break;
        }
    };

    /*处理room-delmsg*/
    receiveEventRoomDelmsg(recvEventData){

    };

    /*处理room-msglist*/
    receiveEventRoomMsglist(name , signallingData){
        switch (name){
            case 'ShowPage':
            case "ExtendShowPage":
                signallingData.source = 'room-msglist' ;
                this._handleShowPageSignalling(signallingData);
                break;
            case 'whiteboardMarkTool':
            case 'ExtendWhiteboardMarkTool':
                if(signallingData.data && signallingData.data.selectMouse){
                    WhiteboardIntermediateLayerInstance.activeWhiteboardTool('tool_mouse' , this.instanceId);
                }else{
                    WhiteboardIntermediateLayerInstance.useHistoryPenTool(this.instanceId);
                }
                break;
            case "NewPptTriggerActionClick":
            case "ExtendNewPptTriggerActionClick":
                if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                    DynamicPptIntermediateLayerInstance.postMessageDynamicPptTriggerAction(this.instanceId , signallingData.data )
                }
                break;
            case "H5DocumentAction":
            case "ExtendH5DocumentAction":
                if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                    H5DocumentIntermediateLayerInstance.postMessageH5DocumentTriggerAction(this.instanceId , signallingData.data );
                }
                break ;
            case "PptVolumeControl":
            case "ExtendPptVolumeControl":
                this._updatedynamicPptVolume( signallingData.data.volume * 100 );
                break;
        }
    };

    /*处理room-receiveActionCommand*/
    reveiveEventRoomReceiveActionCommand( action , cmd ){
        switch (action){
            case 'fullScreenChangeCallback': //接收全屏的状态通知
                this.changeFullScreenState( cmd.isFullScreen );
                break ;
            case 'changeDynamicPptSize': //改变动态ppt的大小
                if( this.configration.isMobile && this.fileTypeMark === 'dynamicPPT' ){
                    DynamicPptIntermediateLayerInstance.changeDynamicPptSize(this.instanceId);
                }
                break;
            case 'closeDynamicPptWebPlay': //关闭动态PPT界面里的视频播放
                if( this.fileTypeMark === 'dynamicPPT' ){
                    let postMessageData = {
                        action:"closeDynamicPptAutoVideo" ,
                    };
                    DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , postMessageData );
                }
                break;
        }
    }

    /*发送动作指定
    * @params action：执行的动作
          action目前有：
            closeAllSelectBox：选择框的关闭通知消息
            viewStateUpdate：视图状态更新
    * @params cmd:动作描述
    * */
    sendActionCommand(action , cmd){
        if( this.receiveActionCommand && typeof this.receiveActionCommand === 'function' ){
            if( typeof cmd === 'object' && !Array.isArray(cmd) ){
                cmd = Object.deepAssign({} ,cmd ) ;
            }
            this.receiveActionCommand( action , cmd );
        }
    }

    /*发送PubMsg信令 */
    pubMsg(params){
        if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.pubMsg  ){
            this.whiteBoardManagerInstance.pubMsg(params);
        }
    }

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
     *备注：指定用户会收到事件room-delmsg
     * */
    delMsg(params){
        if(  this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.delMsg ){
            this.whiteBoardManagerInstance.delMsg(params);
        }
    }

    /*获取白板视图状态*/
    getWhiteboardViewState(){
        return this.whiteboardViewState ;
    };

    /*强制更新视图状态*/
    forceViewStateUpdate(){
        this._viewStateUpdate();
    }

    /*使用标注工具
     * @params toolKey:工具的key
     * */
    useWhiteboardTool( toolKey ){
        if( this.whiteboardViewState.tool[toolKey] && this.whiteboardViewState.tool[toolKey].disabled ){
            L.Logger.warning( 'whiteboard tool('+toolKey+') state is disabled , cannot use '+ toolKey +' tool!' );
            return ;
        }
        if( (this.instanceId === 'default' || this.configration.hasExtendDocument) &&  ( this.configration.synchronization && this.configration.isConnectedRoom )
            &&  toolKey !== WhiteboardIntermediateLayerInstance.getActiveTool(this.instanceId)
            && ( ( toolKey !== 'tool_mouse' && WhiteboardIntermediateLayerInstance.getActiveTool(this.instanceId) === 'tool_mouse' )
                || ( toolKey === 'tool_mouse' && WhiteboardIntermediateLayerInstance.getActiveTool(this.instanceId) !== 'tool_mouse' )
            )
        ){
            let pubmsgData = {
                name: this.instanceId === 'default'?'whiteboardMarkTool':'ExtendWhiteboardMarkTool' ,
                id: this.instanceId === 'default'?'whiteboardMarkTool':`ExtendWhiteboardMarkTool_${this.instanceId}` ,
                toID: '__allExceptSender' ,
                data: {
                    sourceInstanceId:this.instanceId,
                    selectMouse: toolKey === 'tool_mouse'
                },
                save: true ,
            };
            this.pubMsg( pubmsgData );
        }
        WhiteboardIntermediateLayerInstance.activeWhiteboardTool( toolKey , this.instanceId );
    }

    /*执行撤销操作
     * @params actionKey:动作的key
    * */
    executeWhiteboardAction( actionKey ){
        if( this.whiteboardViewState.action[actionKey] && this.whiteboardViewState.action[actionKey].disabled ){
            L.Logger.warning( 'whiteboard action('+actionKey+') state is disabled , cannot execute '+ actionKey +' action!' );
            return ;
        }
        WhiteboardIntermediateLayerInstance.activeWhiteboardTool( actionKey , this.instanceId );
    }

    /*执行缩放白板
     * @params zoomKey:白板缩放的key ， key值描述如下：
     * */
    executeZoomWhiteaord( zoomKey ){
        if( this.whiteboardViewState.zoom[zoomKey] && this.whiteboardViewState.zoom[zoomKey].disabled ){
            L.Logger.warning( 'whiteboard zoom('+zoomKey+') state is disabled , cannot execute '+ zoomKey +' zoom!' );
            return ;
        }
        WhiteboardIntermediateLayerInstance.activeWhiteboardTool( zoomKey , this.instanceId );
    }

    /*加页*/
    addPage(){
        let { fileid , pagenum } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId) ;
        if( this.fileTypeMark !== 'generalDocument' && Number(fileid) === 0 ){
            L.Logger.warning( 'whiteboard addPage method can only be used in pure whiteboard.' );
            return ;
        }
        pagenum++ ;
        WhiteboardIntermediateLayerInstance.updateWhiteboardFiledata(this.instanceId , {
           pagenum:pagenum
        });
        if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
            let pubmsgData = {
                name:this.instanceId === 'default'?'WBPageCount':'ExtendWBPageCount' ,
                id: this.instanceId === 'default'?'WBPageCount':`WBPageCount_${this.instanceId}` ,
                toID: '__allExceptSender' ,
                data: {
                    sourceInstanceId:this.instanceId,
                    totalPage: pagenum ,
                    fileid:fileid
                },
                save: true ,
            };
            this.pubMsg( pubmsgData );
        }
        this.nextPage();
    };

    /*下一页*/
    nextPage( ){
        if( this.whiteboardViewState.page.nextPage && this.whiteboardViewState.page.nextPage.disabled ){
            L.Logger.warning( 'whiteboard nexPage state is disabled , cannot execute nextPage method!' );
            return ;
        }
        switch (this.fileTypeMark){
            case 'generalDocument':
                let { currpage , pagenum } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId) ;
                currpage++ ;
                if( currpage > pagenum ){
                    currpage = pagenum ;
                }
                let updatePubmsgData = {
                    data:{
                        filedata:{
                            currpage:currpage
                        }
                    }
                };
                this._sendSignalling_ShowPage( updatePubmsgData , (pubmsgData) => {
                    this.receiveEventRoomPubmsg({
                        type:'room-pubmsg' ,
                        message:pubmsgData ,
                        local:true ,
                    })
                });
                break;
            case 'h5Document':
                H5DocumentIntermediateLayerInstance.nextPage( this.instanceId );
                break;
            case 'dynamicPPT':
                DynamicPptIntermediateLayerInstance.nextSlide(this.instanceId);
                break;
        }
    }

    /*上一页*/
    prevPage( ){
        if( this.whiteboardViewState.page.prevPage && this.whiteboardViewState.page.prevPage.disabled ){
            L.Logger.warning( 'whiteboard prevPage state is disabled , cannot execute prevPage method!' );
            return ;
        }
        switch (this.fileTypeMark){
            case 'generalDocument':
                let { currpage } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId) ;
                currpage-- ;
                if( currpage < 1 ){
                    currpage = 1 ;
                }
                let updatePubmsgData = {
                    data:{
                        filedata:{
                            currpage:currpage
                        }
                    }
                };
                this._sendSignalling_ShowPage( updatePubmsgData , (pubmsgData) => {
                    this.receiveEventRoomPubmsg({
                        type:'room-pubmsg' ,
                        message:pubmsgData ,
                        local:true ,
                    })
                });
                break;
            case 'h5Document':
                H5DocumentIntermediateLayerInstance.prevPage( this.instanceId );
                break;
            case 'dynamicPPT':
                DynamicPptIntermediateLayerInstance.prevSlide(this.instanceId);
                break;
        }
    }

    /*跳转到某一页*/
    skipPage( page ){
        switch (this.fileTypeMark){
            case 'generalDocument':
                let { pagenum } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId) ;
                if( page > pagenum ){
                    page = pagenum ;
                }
                if( page < 1 ){
                    page = 1 ;
                }
                let updatePubmsgData = {
                    data:{
                        filedata:{
                            currpage:page
                        }
                    }
                };
                this._sendSignalling_ShowPage( updatePubmsgData , (pubmsgData) => {
                    this.receiveEventRoomPubmsg({
                        type:'room-pubmsg' ,
                        message:pubmsgData ,
                        local:true ,
                    })
                });
                break;
            case 'h5Document':
                H5DocumentIntermediateLayerInstance.skipPage( this.instanceId , page );
                break;
            case 'dynamicPPT':
                let  slide = page , step = 0 , initiative = true ;
                DynamicPptIntermediateLayerInstance.jumpToAnimation(this.instanceId ,  slide , step , initiative);
                break;
        }
    }

    /*下一步，用于动态ppt*/
    nextStep( ){
        if( this.fileTypeMark !== 'dynamicPPT' ){
            L.Logger.warning( 'whiteboard nextStep method can only be used in dynamic PPT files.' );
            return ;
        }
        if( this.whiteboardViewState.page.nextStep && this.whiteboardViewState.page.nextStep.disabled ){
            L.Logger.warning( 'whiteboard nextStep state is disabled , cannot execute nextStep method!' );
            return ;
        }
        switch (this.fileTypeMark){
            case 'dynamicPPT':
                DynamicPptIntermediateLayerInstance.nextStep(this.instanceId);
                break;
        }
    }

    /*上一步，用于动态ppt*/
    prevStep( ){
        if( this.fileTypeMark !== 'dynamicPPT' ){
            L.Logger.warning( 'whiteboard prevStep method can only be used in dynamic PPT files.' );
            return ;
        }
        if( this.whiteboardViewState.page.prevStep && this.whiteboardViewState.page.prevStep.disabled ){
            L.Logger.warning( 'whiteboard prevStep state is disabled , cannot execute prevStep method!' );
            return ;
        }
        switch (this.fileTypeMark){
            case 'dynamicPPT':
                DynamicPptIntermediateLayerInstance.prevStep(this.instanceId);
                break;
        }
    }

    /*白板大小改变的回调函数*/
    resizeWhiteboardSizeCallback(fatherContainerConfiguration){
        if( fatherContainerConfiguration.loadScrollBar ){
            DomUtils.addClass( this.elements.totalDocumentViewElement ,  'custom-scroll-bar' );
        }else{
            DomUtils.removeClass( this.elements.totalDocumentViewElement ,  'custom-scroll-bar' );
        }
        DomUtils.updateStyle(this.elements.documentViewElement  , {
            width:fatherContainerConfiguration.style.width ,
            height:fatherContainerConfiguration.style.height ,
        });
        DomUtils.updateStyle(this.elements.totalDocumentViewElement  , {
            width:fatherContainerConfiguration.style.width ,
            height:fatherContainerConfiguration.style.height ,
            top:'50%' ,
            left:'50%' ,
        });
        DomUtils.updateStyle(this.elements.totalDocumentViewElement  , {
            marginLeft:'-'+( this.elements.totalDocumentViewElement.offsetWidth / 2 ) + 'px',
            marginTop:'-'+( this.elements.totalDocumentViewElement.offsetHeight/ 2 ) + 'px'
        });
    };

    /*工具状态更新的回调函数*/
    noticeUpdateToolDescCallback(){
        this._viewStateUpdate();
    };

    noticeUpdateWhiteboardFiledataCallback(){
        this._viewStateUpdate();
    };

    /*接收动作指令回调函数*/
    receiveActionCommandCallback(action , cmd){
        if(cmd.id !== this.instanceId){
            return ;
        }
        switch (action){
            case 'closeAllSelectBox': //关闭所有的选择框
                this.sendActionCommand('closeAllSelectBox');   //选择框的关闭通知消息
                break;
            case 'changeWhiteboardActiveTool': //改变白板使用的标注工具
                this._updateViewShowAndHide();
                break ;
            case 'updateWhiteboardWatermarkImageScale': //更新白板的scale
                WhiteboardIntermediateLayerInstance.updateWhiteboardWatermarkImageScale(this.instanceId , cmd.scale );
                break ;
            case 'dynamicPptLoadEnd': //动态ppt加载结束
            case 'h5DocumentLoadEnd': //h5文档加载结束
            case 'generalDocumentLoadEnd':
                DomUtils.removeClass(this.elements.disableClickViewElement ,  'loading');
                this.scale = cmd.scale;
                this._viewStateUpdate() ;
                let endData = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
                endData.success = cmd.success;
                endData.reloadNumber = cmd.reloadNumber;
                let loadSuccessData = {
                    loadSuccessData:endData,
                };
                this.sendActionCommand('documentLoadSuccess', loadSuccessData);
                break ;
            case 'h5DocumentReloadFail':
            case 'dynamicPptReloadFail':
            case 'generalDocumentReloadFail':
                let failData = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
                failData.success = cmd.success;
                failData.reloadNumber = cmd.reloadNumber;
                let loadFailData = {
                    loadFailData:{...failData, cdn: Global.nowUseDocAddress,},
                };
                this.sendActionCommand('documentLoadFail', loadFailData);
                break;    
            case 'sendSignalling_ShowPage':
                this._sendSignalling_ShowPage(cmd.updatePubmsgData);
                break;
            case 'saveFiledataAndLoadCurrpageWhiteboardData'://保存白板数据且加载当前页的白板数据
                this._saveFiledataAndLoadCurrpageWhiteboardData(cmd.updateFileData);
                break;
            case 'dynamicPptSlideChange': //动态ppt的slide改变
                this._saveFiledataAndLoadCurrpageWhiteboardData(cmd.updateFileData);
                break;
            case 'dynamicPptStepChange': //动态ppt的step改变
                WhiteboardIntermediateLayerInstance.updateWhiteboardFiledata( this.instanceId , cmd.updateFileData);
                break;
            case 'publishDymanicPptNetworkMedia':
                if (this.instanceId === 'default') {//TODO 只有主白板才能播放视频
					let postMessageData = {
	                    action:"closeDynamicPptAutoVideo" ,
	                };
	                DynamicPptIntermediateLayerInstance.postMessage( this.instanceId , postMessageData );
                    let filedata = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId)
                    let { swfpath, isContentDocument, baseurl } = filedata
                    console.error("Dymanic PPT fileData: ", filedata);
	                let src;
	                if (Number(isContentDocument)) {
	                    if (swfpath) {
	                        src = swfpath.replace(/\/newppt.html/g,'');
	                    }
	                }else {
                        src = baseurl ? baseurl : Global.nowUseDocAddress +  swfpath;
	                }
	                cmd.url = src + '/' + cmd.url ;
	                if(this.whiteBoardManagerInstance){
	                    if( this.configration.clientMediaShare &&  this.whiteBoardManagerInstance.getRoomDelegate() &&  this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface
	                        && this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface() && this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().startShareMediaFile ){
	                        this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().startShareMediaFile(cmd.url,undefined, undefined, {
	                            IgnoreElementId:true ,
	                            toID: this.configration.mediaShareToID,
	                            attrs:cmd.attributes
	                        });
	                    }else{
	                        this.whiteBoardManagerInstance.startShareMedia(  cmd.url , cmd.video , this.configration.mediaShareToID , cmd.attributes );
	                    }
	                }
				}
                break;
            case 'publishH5DocumentNetworkAudio':
                if (this.configration.isNativePlayAudio) {
                    let src = cmd.url;
                    src = src.replace(/^https/,"http");
                    src = src.replace(/443/g, "80");
                    if(this.whiteBoardManagerInstance){
                        if(this.whiteBoardManagerInstance.getRoomDelegate().isPlayAudio){
                            this.whiteBoardManagerInstance.getRoomDelegate().isPlayAudio(  src , cmd.isPlay , cmd.attributes );
                            if(this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume){
                                this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume(100);
                            }
                        }
                    }
                }
                break;
            case 'publishDymanicPptNetworkAudio':
                if (this.configration.isNativePlayAudio) {
	                let filedata = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId)
                    let { swfpath, isContentDocument, baseurl } = filedata
                    console.error("Dymanic PPT fileData: ", filedata);
	                let src;
	                if (Number(isContentDocument)) {
	                    if (swfpath) {
	                        src = swfpath.replace(/\/newppt.html/g,'');
	                    }
	                }else {
                        src = baseurl ? baseurl : Global.nowUseDocAddress +  swfpath;
                    }
                    src = src.replace(/^https/,"http");
                    src = src.replace(/443/g, "80");
                    cmd.url = src + '/' + cmd.url ;
	                if(this.whiteBoardManagerInstance){
                        if(this.whiteBoardManagerInstance.getRoomDelegate().isPlayAudio){
                            this.whiteBoardManagerInstance.getRoomDelegate().isPlayAudio(  cmd.url , cmd.isPlay , cmd.attributes );
                            if(this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume){
                                this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume(this.volume);
                            }
                        }
	                }
				}
                break;
            case 'updateWhiteboardFiledata':
                WhiteboardIntermediateLayerInstance.updateWhiteboardFiledata( this.instanceId , cmd.updateFileData);
                break;
            case 'getWhiteboardFiledata':
                if(cmd && cmd.callback && typeof cmd.callback === 'function'){
                    cmd.callback( WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId) );
                }
                break;
            case 'reloadCurrentDocument':
                this.reloadCurrentDocument({isAgainreconnect:cmd.isAgainreconnect});
                break;
            case 'reloadDynamicPptIframeSrc':
                // if (this.isPreloadFile(WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId))) return; 
                if( cmd.iframeSrc && this.fileTypeMark === 'dynamicPPT' && new RegExp( WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).swfpath+'/newppt.html' , 'g' ).test( cmd.iframeSrc ) ){
                    let oldForceUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress ;
                    Global.docAddressKey = Utils.getItem(Global.docAddressList,Global.docAddressKey,true) ;
                    if( this.whiteBoardManagerInstance && Utils.isFunction( this.whiteBoardManagerInstance.setLocalStorageItem ) ){
                        this.whiteBoardManagerInstance.setLocalStorageItem( 'ysDocAddressKey'  ,  Global.docAddressKey );
                        this.sendActionCommand( 'docAddressUpdate' ,  {
                            docAddressList:[ ...Global.docAddressList ],
                            docAddressIndex:Global.docAddressKey ,
                            oldDocAddress:oldForceUseDocAddress ,
                            nowDocAddress:Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress
                        }) ; //文档加载地址更新
                    }
                    Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress ;
                    L.Logger.info('[reload dynamic ppt]change doc address , old address is '+oldForceUseDocAddress + ' , now address is '+ Global.nowUseDocAddress );
                    if(cmd.forceReloadNumber !== undefined){
                        this.forceReloadNumberFromPpt = cmd.forceReloadNumber;
                    }
                    this._loadCurrentDynamicPpt() ;
                    L.Logger.info('['+cmd.source+ ']load dynamic ppt failure , reload file , old url is ' +  cmd.iframeSrc
                        + ' , now url is ' + DynamicPptIntermediateLayerInstance.getIframeSrc( this.instanceId )
                        + ' , reload number is '+ cmd.forceReloadNumber );
                }
                break;
            case 'reloadH5DocumentIframeSrc':
                // if (this.isPreloadFile(WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId))) return; 
                if( cmd.iframeSrc && this.fileTypeMark === 'h5Document' && new RegExp( WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).swfpath , 'g' ).test( cmd.iframeSrc ) ){
                    let oldForceUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress ;
                    Global.docAddressKey = Utils.getItem(Global.docAddressList,Global.docAddressKey,true) ;
                    if( this.whiteBoardManagerInstance && Utils.isFunction( this.whiteBoardManagerInstance.setLocalStorageItem ) ){
                        this.whiteBoardManagerInstance.setLocalStorageItem( 'ysDocAddressKey'  ,  Global.docAddressKey );
                        this.sendActionCommand( 'docAddressUpdate' ,  {
                            docAddressList:[ ...Global.docAddressList ],
                            docAddressIndex:Global.docAddressKey ,
                            oldDocAddress:oldForceUseDocAddress ,
                            nowDocAddress:Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress
                        }) ; //文档加载地址更新
                    }
                    Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey)|| this.configration.docAddress ;
                    L.Logger.info('[reload h5 document]change doc address , old address is '+oldForceUseDocAddress + ' , now address is '+ Global.nowUseDocAddress );

                    let parameters = { };
                    if(cmd.forceReloadNumber){
                        parameters.forceReloadNumber = cmd.forceReloadNumber ;
                    }
                    this._loadCurrentH5Document( parameters , {
                        forceReloadNumber:cmd.forceReloadNumber
                    });
                    L.Logger.info('['+cmd.source+ ']load h5 document failure , reload file , old url is ' +  cmd.iframeSrc
                        + ' , now url is ' + DynamicPptIntermediateLayerInstance.getIframeSrc( this.instanceId )
                        + ' , reload number is '+ cmd.forceReloadNumber );
                }
                break;
            case 'updateWhiteboardToolsInfo':
                this._viewStateUpdate(); //更新白板工具信息
                break;
            case 'h5DocumentOnJumpPage'://H5课件跳转到某页
                this.whiteBoardManagerInstance.skipPage(cmd.toPage, this.instanceId);
                break;
            case 'slideLoadTimeout': 
                this.sendActionCommand('slideLoadTimeout', cmd);
                break;
        }
    };

    /*普通文档加载失败*/
    whiteboardWatermarkImageOnFailureCallback(failureImgUrl){
        let { cospdfpath, swfpath , currpage  , filetype, isContentDocument } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
        if(cospdfpath){
            // swfpath = cospdfpath
        }
        if( this.fileTypeMark === 'generalDocument' && swfpath &&  failureImgUrl && filetype !== 'whiteboard' && this.generalDocumentFileForceReloadNumber < this.maxGeneralFileForceReloadNumber ){
            let fileUrl = undefined;
            if (Number(isContentDocument)) {
                fileUrl = swfpath;
            }else{
                let index = swfpath.lastIndexOf(".") ;
                let imgType = swfpath.substring(index);
                fileUrl = swfpath.replace(imgType,"-"+currpage+imgType) ;
            }
            if( new RegExp(  fileUrl , 'g' ).test( failureImgUrl ) ){
                if (!Number(isContentDocument)) {
                    let oldForceUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress ;
                    Global.docAddressKey = Utils.getItem(Global.docAddressList,Global.docAddressKey,true) ;
                    if( this.whiteBoardManagerInstance && Utils.isFunction( this.whiteBoardManagerInstance.setLocalStorageItem ) ){
                        this.whiteBoardManagerInstance.setLocalStorageItem( 'ysDocAddressKey'  ,  Global.docAddressKey );
                        this.sendActionCommand( 'docAddressUpdate' ,  {
                            docAddressList:[ ...Global.docAddressList ],
                            docAddressIndex:Global.docAddressKey ,
                            oldDocAddress:oldForceUseDocAddress ,
                            nowDocAddress: Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress
                        }) ; //文档加载地址更新
                    }
                    Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || this.configration.docAddress ;
                    L.Logger.info('[reload general document]change doc address , old address is '+oldForceUseDocAddress + ' , now address is '+ Global.nowUseDocAddress );

                    this.generalDocumentFileForceReloadNumber++ ;
                    L.Logger.info('[general document]load general document failure , reload file , old url is '+ ( oldForceUseDocAddress + fileUrl ) +' , now url is '  + ( Global.nowUseDocAddress + fileUrl) + ' , reload number is '+ this.generalDocumentFileForceReloadNumber  );
                }else{
                    this.generalDocumentFileForceReloadNumber++ ;
                    L.Logger.info('[general document]load general document failure , reload file ,  url is '  + fileUrl + ' , reload number is '+ this.generalDocumentFileForceReloadNumber );
                }

                let src;
                if (Number(isContentDocument)) {
                    if (fileUrl) {
                        src = fileUrl;
                    }
                }else {
                    src = Global.nowUseDocAddress +  fileUrl;
                }
                WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage(this.instanceId , src , {resetDedaultWhiteboardMagnification:false} );
            }else{
                this.generalDocumentFileForceReloadNumber = 0 ;
            }
        }
        if(this.generalDocumentFileForceReloadNumber  === 1){
            this.sendActionCommand( 'generalDocumentReloadFail' ,  {
                reloadNumber: 0,
                success: false,
            }) ; //文档加载失敗次數
        }
    };

    /*普通文档加载完成*/
    whiteboardWatermarkImageOnloadCallback(data){
        let { width , height} = data;
        this.scale = width/height;
        this.sendActionCommand( 'generalDocumentLoadEnd' ,  {
            reloadNumber:this.generalDocumentFileForceReloadNumber ,
            success: true,
            scale:this.scale,
        }) ; //文档加载失敗次數
    }
    /*更新白板大小*/
    resizeWhiteboardHandler(){
        WhiteboardIntermediateLayerInstance.resizeWhiteboardHandler(this.instanceId);
        if (this.fileTypeMark === 'dynamicPPT' && this.configration.clientType === 'ios') {
            DynamicPptIntermediateLayerInstance.changeDynamicPptSize(this.instanceId);
        }
    }

    /*白板是否处于文本点击状态*/
    isWhiteboardTextEditing(){
        return WhiteboardIntermediateLayerInstance.isWhiteboardTextEditing(this.instanceId);
    }

    /*重置白板所有的数据*/
    resetWhiteboardData() {
        this.whiteboardViewState = {
            tool: {},  //白板标注工具信息
            action: {}, //撤销、恢复、清空信息
            zoom: {},  //方法缩小信息
            page: {}, //翻页信息
            documentType: this.fileTypeMark, //打开的文件类别，generalDocument（普通文档）、dynamicPPT（动态PPT）、h5Document(H5课件)
            fileid: this.fileid, //打开的文档的文件id
            dynamicPptVolume: this.dynamicPptVolume, //动态PPT文档的音量
            fullScreen: this.fullScreen, //是否全屏
            remark: this.remark, //是否开启文档备注
            scale: this.scale,//课件比例
            remarkText: this.remarkText, //当前页文档备注的文本内容
            other: { //其它信息
                primaryColor: this.configration.primaryColor,  //画笔颜色 ,默认 #000000
                secondaryColor: this.configration.secondaryColor,  //填充颜色 ,默认 #ffffff
                backgroundColor: 'none' || this.configration.backgroundColor,   //背景颜色 ,默认 #ffffff
                pencilWidth: this.configration.pencilWidth, //画笔大小 , 默认5
                shapeWidth: this.configration.shapeWidth, //图形画笔大小 , 默认5
                eraserWidth: this.configration.eraserWidth, //橡皮大小 ， 默认15
                fontSize: this.configration.fontSize, //字体大小 ， 默认18
                fontFamily: this.configration.fontFamily, //使用的字体 ，默认"微软雅黑"
            }
        };
        WhiteboardIntermediateLayerInstance.clearWhiteboardAllDataById(this.instanceId);
    }

    /*接收iframe的message消息*/
    receiveWindowMessageEvent(event){
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DynamicPptIntermediateLayerInstance.receiveWindowMessageEvent(this.instanceId , event) ;
        }
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            H5DocumentIntermediateLayerInstance.receiveWindowMessageEvent(this.instanceId , event) ;
        }
    };

    /*获取白板的根节点*/
    getWhiteboardRootElement(){
        return this.elements.whiteboardViewRootElement ;
    }

    /*重置纯白板总页数*/
    resetPureWhiteboardTotalPage( oldTotalPage ){
        if( oldTotalPage > 1 ){
            for( let currpage = 2 ; currpage <= oldTotalPage ; currpage++ ){
                WhiteboardIntermediateLayerInstance.clearWhiteboardDataByFileidAndCurrpage( this.instanceId , 0 , currpage );
            }
        }
        let filedata = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata( this.instanceId );
        if( filedata.fileid == 0 ){
            let open = false ;
            filedata.currpage = 1 ;
            filedata.pagenum = 1 ;
            this._saveFiledataAndLoadCurrpageWhiteboardData( filedata );
            this._generalDocumentFileShowPage(open);
        }
    }
    /*获取动态PPT实例,根据id获取*/
    getDynamicPptInstanceByID(){
        return DynamicPptIntermediateLayerInstance.getDynamicPptInstanceByID(this.instanceId);
    }
    /*获取h5文档实例,根据id获取*/
    getH5DocumentInstanceByID(){
        return H5DocumentIntermediateLayerInstance.getH5DocumentInstanceByID(this.instanceId);
    }

    /*创建所需节点*/
    _createElements(){
        this.elements.whiteboardViewRootElement = DomUtils.createElement('section' , this.instanceId+'RoadofcloudSdkWhiteboardRoot' , ( this.configration.isMobile ? 'app-mobile ' : ' ' )+ 'roadofcloud-sdk-whiteboard '+ this.instanceId+' sdkwhiteboard-root' , {
            width:'100%' ,
            height:'100%' ,
            position:'relative' ,
            left:0 ,
            top:0 ,
            backgroundColor: 'none' || this.configration.rootBackgroundColor ,
        }); //白板根节点

        this.elements.totalDocumentViewElement =  DomUtils.createElement('section' , this.instanceId+'RoadofcloudTotalDocument' ,  'roadofcloud-sdk-whiteboard '+ this.instanceId+' total-document-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
            maxWidth: '100%' ,
            maxHeight: '100%'
        }); //文档总容器节点（滚动条在该容器上）

        this.elements.documentViewElement =  DomUtils.createElement('section' , this.instanceId+'RoadofcloudDocument' ,  'roadofcloud-sdk-whiteboard '+ this.instanceId+' document-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
        }); //包裹所有的文档的节点，宽高为文档的宽高

        this.elements.whiteboardViewElement =  DomUtils.createElement('article' , this.instanceId+'RoadofcloudWhiteboard' ,  'roadofcloud-sdk-whiteboard '+ this.instanceId+' whiteboard-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
            zIndex:2 ,
        }); //白板容器节点

        this.elements.dynamicPptViewElement =  DomUtils.createElement('article' , this.instanceId+'RoadofcloudDynamicPpt' ,   'roadofcloud-sdk-whiteboard '+ this.instanceId+' dynamic-ppt-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
            display:'none' ,
            zIndex:1 ,
        }); //动态ppt容器节点

        this.elements.h5DocumentViewElement =  DomUtils.createElement('article' , this.instanceId+'RoadofcloudH5Document' ,   'roadofcloud-sdk-whiteboard '+ this.instanceId+' h5-document-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
            display:'none' ,
            zIndex:1 ,
        }); //h5容器节点

        this.elements.disableClickViewElement = DomUtils.createElement('div' , undefined ,   'roadofcloud-sdk-whiteboard '+ this.instanceId+' disable-clock-container' , {
            width:'100%' ,
            height:'100%' ,
            position:'absolute' ,
            left:0 ,
            top:0 ,
            display:'none' ,
            zIndex:4 ,
        }); //h5容器节点

    };

    /*连接所有节点*/
    _connectElements(){
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DomUtils.appendChild( this.elements.documentViewElement , this.elements.dynamicPptViewElement );
        }
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DomUtils.appendChild( this.elements.documentViewElement  , this.elements.h5DocumentViewElement );
        }

        DomUtils.appendChild( this.elements.documentViewElement  , this.elements.whiteboardViewElement );
        DomUtils.appendChild( this.elements.documentViewElement  , this.elements.disableClickViewElement );
        DomUtils.appendChild( this.elements.totalDocumentViewElement , this.elements.documentViewElement);
        DomUtils.appendChild( this.elements.whiteboardViewRootElement , this.elements.totalDocumentViewElement);
        DomUtils.appendChild( this.parentNode , this.elements.whiteboardViewRootElement );

        this._productionWhiteboard(); //生产白板
        // if(this.configration.loadDynamicPptView && this.instanceId === 'default'){
            this._productionDynamicPpt(); //生产动态PPT
        // };
        // if(this.configration.loadH5DocumentView && this.instanceId === 'default'){
            this._productionH5Document(); //生产H5课件
        // };
    }

    /*实例化白板*/
    _productionWhiteboard(){
        if( WhiteboardIntermediateLayerInstance.hasWhiteboardById(this.instanceId) ){
            WhiteboardIntermediateLayerInstance.destroyWhiteboardInstance(this.instanceId);
        }
        let whiteboardInstanceData = {
            whiteboardElementId:this.elements.whiteboardViewElement.getAttribute('id') ,
            id:this.instanceId ,
            handler:{
                sendSignallingToServer:(name ,id , toID ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID) => {   /*添加白板画笔数据，发送给服务器*/
                    if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
                        this.pubMsg({name:name ,id:id , toID:toID ,  data , save:!do_not_save , expiresabs  , associatedMsgID , associatedUserID});
                    }
                },
                delSignallingToServer:(name ,id , toID ,  data ) => { /*删除白板画笔数据，发送给服务器*/
                    if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
                        this.delMsg({name:name ,id:id , toID:toID ,  data});
                    }
                } ,
                resizeWhiteboardSizeCallback:this.resizeWhiteboardSizeCallback.bind(this) ,
                noticeUpdateToolDescCallback:this.noticeUpdateToolDescCallback.bind(this) ,
                noticeUpdateWhiteboardFiledataCallback:this.noticeUpdateWhiteboardFiledataCallback.bind(this) ,
                receiveActionCommandCallback:this.receiveActionCommandCallback.bind(this) ,
                whiteboardWatermarkImageOnFailureCallback:this.whiteboardWatermarkImageOnFailureCallback.bind(this) ,
                whiteboardWatermarkImageOnloadCallback:this.whiteboardWatermarkImageOnloadCallback.bind(this) ,
            },
            productionOptions:Object.deepAssign({
                deawPermission:this.configration.canDraw && this.configration.synchronization && this.configration.isConnectedRoom  ,
                showShapeAuthor:this.configration.showShapeAuthor ,
                myselfId:this.configration.myUserId,
                nickname:this.configration.myName,
                synchronizationWhiteboard:( this.configration.synchronization && this.configration.isConnectedRoom ) ,
                primaryColor:this.configration.primaryColor ,
                secondaryColor:this.configration.secondaryColor ,
                backgroundColor: 'none' || this.configration.backgroundColor ,
                pencilWidth:this.configration.pencilWidth , //笔的大小
                shapeWidth:this.configration.shapeWidth, //图形画笔大小
                eraserWidth:this.configration.eraserWidth , //橡皮大小
                fontSize:this.configration.fontSize , //字体大小
                fontFamily:this.configration.fontFamily, //使用的字体 ，默认"微软雅黑"
                parcelAncestorElementId:this.elements.whiteboardViewRootElement.getAttribute('id') ,
                defaultWhiteboardScale:this.configration.defaultWhiteboardScale ,
                associatedMsgID:this.configration.associatedMsgID ,
                associatedUserID:this.configration.associatedUserID ,
                isOnlyUndoRedoClearMyselfShape:this.configration.isOnlyUndoRedoClearMyselfShape ,
                insertPictureRule:this.configration.insertPictureRule,
            }, ( this.configration.initWhiteboardProductionOptions || {} ) )
        } ;
        let toolsDesc = {
            tool_pencil:{} ,
            tool_highlighter:{} ,
            tool_line:{} ,
            tool_arrow:{} ,
            tool_eraser:{} ,
            tool_text:{} ,
            tool_rectangle:{} ,
            tool_rectangle_empty:{} ,
            tool_ellipse:{} ,
            tool_ellipse_empty:{} ,
            tool_mouse:{} ,
            tool_laser:{} ,
            action_undo:{} ,
            action_redo:{} ,
            action_clear:{} ,
            zoom_big:{} ,
            zoom_small:{} ,
        };
        WhiteboardIntermediateLayerInstance.productionWhiteboard(whiteboardInstanceData);
        WhiteboardIntermediateLayerInstance.registerWhiteboardTools(this.instanceId , toolsDesc);
        WhiteboardIntermediateLayerInstance.clearRedoAndUndoStack(this.instanceId);
        WhiteboardIntermediateLayerInstance.loadCurrpageWhiteboard(this.instanceId);
        if( this.instanceId === 'default' || this.configration.hasExtendDocument){
            WhiteboardIntermediateLayerInstance.activeWhiteboardTool( 'tool_mouse' , this.instanceId );
        }
    }

    /*实例化动态PPT*/
    _productionDynamicPpt(){
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            if( DynamicPptIntermediateLayerInstance.hasDynamicPptById(this.instanceId) ){
                DynamicPptIntermediateLayerInstance.destroyDynamicPptInstance(this.instanceId);
            }
            let dynamicPptInstanceData = {
                dynamicPptElementId:this.elements.dynamicPptViewElement.getAttribute('id') ,
                id:this.instanceId ,
                handler:{
                    sendSignallingToServer:(name ,id , toID ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID) => {
                         if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
                            this.pubMsg({name:name ,id:id , toID:toID ,  data , save:!do_not_save , expiresabs  , associatedMsgID , associatedUserID});
                        }
                    },
                    receiveActionCommandCallback:this.receiveActionCommandCallback.bind(this) ,
                },
                productionOptions:{
                    synchronizationDynamicPpt:( this.configration.synchronization && this.configration.isConnectedRoom ) ,
                    associatedMsgID:this.configration.associatedMsgID ,
                    associatedUserID:this.configration.associatedUserID ,
                    isShowReloadFileTip:this.configration.isShowReloadFileTip ,
                    languageType:this.configration.languageType ,
                    againreconnectElementParentNode:this.elements.documentViewElement,
                    dynamicPptActionClick:this.configration.actionClick,
                }
            } ;
            DynamicPptIntermediateLayerInstance.productionDynamicPpt(dynamicPptInstanceData);
        }
    };

    /*实例化H5课件*/
    _productionH5Document(){
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            if( H5DocumentIntermediateLayerInstance.hasH5DocumentById(this.instanceId) ){
                H5DocumentIntermediateLayerInstance.destroyH5DocumentInstance(this.instanceId);
            }
            let h5DocumentInstanceData = {
                h5DocumentElementId:this.elements.h5DocumentViewElement.getAttribute('id') ,
                id:this.instanceId ,
                handler:{
                    sendSignallingToServer:(name ,id , toID ,  data , do_not_save , expiresabs  , associatedMsgID , associatedUserID) => {
                        if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
                            this.pubMsg({name:name ,id:id , toID:toID ,  data , save:!do_not_save , expiresabs  , associatedMsgID , associatedUserID});
                        }
                    },
                    receiveActionCommandCallback:this.receiveActionCommandCallback.bind(this) ,
                },
                productionOptions:{
                    synchronizationH5Document:( this.configration.synchronization && this.configration.isConnectedRoom ) ,
                    associatedMsgID:this.configration.associatedMsgID ,
                    associatedUserID:this.configration.associatedUserID ,
                    isShowReloadFileTip:this.configration.isShowReloadFileTip ,
                    languageType:this.configration.languageType ,
                    h5DocumentActionClick:this.configration.actionClick,
                }
            } ;
            H5DocumentIntermediateLayerInstance.productionH5Document(h5DocumentInstanceData);
        }
    };

    /*处理ShowPage信令*/
    _handleShowPageSignalling(signallingData, local = false){
        let {source , data} = signallingData;
        let open = this.fileid != data.filedata.fileid;
        // console.error("===>  showPage: ", this.fileid != data.filedata.fileid, data.filedata.baseurl, local, signallingData);
        this.fileid = data.filedata.fileid ;
        if(!this.configration.isPlayback){
            if(local){
                if (signallingData.name === 'ShowPage') {
                    Global.showPageFromId = this.configration.myUserId ;
                }else if (signallingData.name === 'ExtendShowPage') {
                    Global.extendShowPageFromId = this.configration.myUserId ;
                }
            }else{
                let isReturn = true ;
                if (signallingData.name === 'ShowPage') {
                    if( open || !signallingData.fromID || (Global.showPageFromId !== this.configration.myUserId && signallingData.fromID === this.configration.myUserId)
                        || (signallingData.fromID !== this.configration.myUserId) ){ //上一次翻页的用户不是我自己且本次翻页是我自己，或者本次翻页不是我自己，则能够翻页
                        isReturn = false ;
                    }
                    Global.showPageFromId = signallingData.fromID;
                }else if (signallingData.name === 'ExtendShowPage') {
                    if( open || !signallingData.fromID || (Global.extendShowPageFromId !== this.configration.myUserId && signallingData.fromID === this.configration.myUserId)
                        || (signallingData.fromID !== this.configration.myUserId) ){ //上一次翻页的用户不是我自己且本次翻页是我自己，或者本次翻页不是我自己，则能够翻页
                        isReturn = false ;
                    }
                    Global.extendShowPageFromId = signallingData.fromID;
                }
                if(isReturn){
                    return ;
                }
            }
        }
        this.fileTypeMark =   data.isDynamicPPT ? 'dynamicPPT' : (
            data.isH5Document ? 'h5Document':'generalDocument'
        );
        if( data.isDynamicPPT || data.isH5Document ){
            data.filedata.pagenum = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).pagenum ;
        }
        if( data.isGeneralFile
            || ( !open && ( data.isDynamicPPT &&  (this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument) && DynamicPptIntermediateLayerInstance.isLoadFinished(this.instanceId) ) )
            || ( !open && (  data.isH5Document &&  (this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument) && H5DocumentIntermediateLayerInstance.isLoadFinished(this.instanceId) ) )
        ){ //如果是普通文档，则限制ShowPage页数范围 , 或者是动态PPT和H5课件且已打开（加载完毕）则限制ShowPage页数范围
            let filedata = data.filedata ;
            if(filedata.currpage > filedata.pagenum ){
                filedata.currpage = filedata.pagenum ;
            }
            if(filedata.currpage < 1){
                filedata.currpage = 1 ;
            }
            if(data.isDynamicPPT){
                filedata.pptslide = filedata.currpage ;
            }
        }
        this._updateViewShowAndHide();
        this._viewStateUpdate(); // 更新文件fileid
        if (data.isGeneralFile) { //普通文档
            if(source==='room-pubmsg' && !open  &&  Number( data.filedata.currpage ) === WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).currpage){
                return ;
            }
            this._saveFiledataAndLoadCurrpageWhiteboardData(data.filedata);
            this._generalDocumentFileShowPage(open);
        }else if( data.isDynamicPPT ){
            /*if(source==='room-pubmsg' && !open
                &&  Number(data.filedata.currpage) === WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).currpage
                &&  Number(data.filedata.pptslide) === WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).pptslide
                &&  Number(data.filedata.pptstep) === WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).pptstep ){
                return ;
            }*/
            WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage(this.instanceId , "" );
            this._dynamicPPTFileShowPage(open , signallingData);
        }else if( data.isH5Document ){
            if (source==='room-pubmsg' && !open  &&  Number(data.filedata.currpage) === WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId).currpage ) {
                return ;
            }
            WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage(this.instanceId , "" );
            this._saveFiledataAndLoadCurrpageWhiteboardData(data.filedata);
            this._h5DocumentFileShowPage(open);
        }
    };

    /*普通文档的ShowPage*/
    _generalDocumentFileShowPage(open){
        this.generalDocumentFileForceReloadNumber = 0 ;
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DynamicPptIntermediateLayerInstance.setDynamicPptIframeSrc(this.instanceId , '') ;
        }
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            H5DocumentIntermediateLayerInstance.setH5DocumentIframeSrc(this.instanceId , '') ;
        }
        WhiteboardIntermediateLayerInstance.resetDedaultWhiteboardMagnification(this.instanceId); //重置白板的缩放比
        let {cospdfpath, swfpath , currpage , pagenum , filetype, isContentDocument, fileid} = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
        if(cospdfpath){
            // swfpath = cospdfpath
        }
        DomUtils.removeClass(this.elements.disableClickViewElement ,  'loading');
        if( filetype === 'whiteboard') {
            this.scale = this.configration.defaultWhiteboardScale;
            this._viewStateUpdate() ;
            WhiteboardIntermediateLayerInstance.updateWhiteboardWatermarkImageScale(this.instanceId , this.configration.defaultWhiteboardScale);
            WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage( this.instanceId, "" , {resetDedaultWhiteboardMagnification:false} );
        }else{
            let src;
            if (Number(isContentDocument)) {
                if (swfpath) {
                    src = swfpath;
                }
            }else {
                let index = swfpath.lastIndexOf(".") ;
                let imgType = swfpath.substring(index);
                let fileUrl = swfpath.replace(imgType,"-"+currpage+imgType) ;
                let serviceUrl = Global.nowUseDocAddress ;
                src = serviceUrl +  fileUrl;
            }
            const timeoutCallback = () => {
                this.receiveActionCommandCallback('slideLoadTimeout' ,{
                    id: dynamicPptInstance.id ,
                    loadTimeoutFile: {
                        currpage ,
                        fileid: fileid ,
                        pagenum,
                        cdn: Global.nowUseDocAddress,
                    },
                    fileType: 'general',
                });
            };
            WhiteboardIntermediateLayerInstance.setWhiteboardWatermarkImage(this.instanceId , src , {resetDedaultWhiteboardMagnification:false, timeoutCallback} );
            if(!Number(isContentDocument)){
                let startInt = 1;
                let endInt = 1;
                if(open) {
                    this.cacheMaxPageNum = currpage;  //当前打开文档的缓存的最大页数，缺省为1
                    this.cacheMinPageNum = currpage;  //当前打开文档的缓存的最小页数，缺省为1
                    this.filePreLoadCurrPage = currpage;   //当前打开文档的缓存的当前页，缺省为1
                    if (this.cacheMaxPageNum + this.filePreLoadStep <= pagenum) {
                        this.cacheMaxPageNum += this.filePreLoadStep;
                    } else if (this.cacheMaxPageNum < pagenum) {
                        this.cacheMaxPageNum += (pagenum - this.cacheMaxPageNum);
                    }

                    if (this.cacheMinPageNum - this.filePreLoadStep >= 1) {
                        this.cacheMinPageNum -= this.filePreLoadStep;
                    } else {
                        this.cacheMinPageNum = 1;
                    }
                    endInt = this.cacheMaxPageNum;
                    startInt = this.cacheMinPageNum;
                } else {
                    if(this.filePreLoadCurrPage  < currpage ){
                        startInt = this.cacheMaxPageNum + 1;
                        if(currpage > this.cacheMaxPageNum ){
                            this.cacheMaxPageNum = currpage;
                        }
                        if (this.cacheMaxPageNum + this.filePreLoadStep <= pagenum) {
                            this.cacheMaxPageNum += this.filePreLoadStep;
                        } else if (this.cacheMaxPageNum < pagenum) {
                            this.cacheMaxPageNum += (pagenum - this.cacheMaxPageNum);
                        }
                        endInt = this.cacheMaxPageNum;
                    } else if (this.filePreLoadCurrPage  > currpage){
                        endInt = this.cacheMinPageNum - 1;
                        if(currpage < this.cacheMinPageNum ){
                            this.cacheMinPageNum = currpage;
                        }
                        if (this.cacheMinPageNum - this.filePreLoadStep >= 1) {
                            this.cacheMinPageNum -= this.filePreLoadStep;
                        } else {
                            this.cacheMinPageNum = 1;
                        }
                        startInt = this.cacheMinPageNum;
                    }
                    this.filePreLoadCurrPage = currpage;
                }

                for(let i = startInt ;i <= endInt ; i++){  // 普通文档预加载代码
                    if(i !== currpage){
                        let index = swfpath.lastIndexOf(".") ;
                        let imgType = swfpath.substring(index);
                        let fileUrl = swfpath.replace(imgType,"-"+ i + imgType) ;
                        let serviceUrl = Global.nowUseDocAddress ;
                        let src = serviceUrl +  fileUrl;
                        WhiteboardIntermediateLayerInstance.preloadWhiteboardImg(src);
                    }
                }
            }
        }
    };

    /*动态ppt的ShowPage*/
    _dynamicPPTFileShowPage(open, signallingData) {
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                H5DocumentIntermediateLayerInstance.setH5DocumentIframeSrc(this.instanceId , '') ;
            }
            if(open){
                WhiteboardIntermediateLayerInstance.updateWhiteboardWatermarkImageScale(this.instanceId ,  this.configration.defaultWhiteboardScale );
                this._saveFiledataAndLoadCurrpageWhiteboardData(signallingData.data.filedata);
                DomUtils.addClass(this.elements.disableClickViewElement ,  'loading');
                this.forceReloadNumberFromPpt = undefined;
                this.forceReloadTimestampFromPpt = undefined;
                this._loadCurrentDynamicPpt();
            }else{
                let { currpage , pptstep } = signallingData.data.filedata ;
                DynamicPptIntermediateLayerInstance.jumpToAnimation(this.instanceId , currpage , pptstep );
            }
        }
    };

    /*h5文档的ShowPage*/
    _h5DocumentFileShowPage(open){
        if(this.configration.loadH5DocumentView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
                DynamicPptIntermediateLayerInstance.setDynamicPptIframeSrc(this.instanceId , '') ;
            }
            let filedata = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
            let { swfpath , currpage } = filedata ;
            if(open){
                WhiteboardIntermediateLayerInstance.updateWhiteboardWatermarkImageScale(this.instanceId ,  this.configration.defaultWhiteboardScale );
                DomUtils.addClass(this.elements.disableClickViewElement ,  'loading');
                this._loadCurrentH5Document();
            }else{
                H5DocumentIntermediateLayerInstance.jumpToPage(this.instanceId , currpage )
            }
        }
    };

    /*保存白板数据且加载当前页的白板数据*/
    _saveFiledataAndLoadCurrpageWhiteboardData(updateFiledata = {} ){
        WhiteboardIntermediateLayerInstance.saveWhiteboardStackToStorage(this.instanceId);
        WhiteboardIntermediateLayerInstance.updateWhiteboardFiledata( this.instanceId , updateFiledata);
        WhiteboardIntermediateLayerInstance.loadCurrpageWhiteboard( this.instanceId );
    }

    /*更新白板的显示和隐藏*/
    _updateViewShowAndHide(){
        switch (this.fileTypeMark){
            case 'generalDocument':
                DomUtils.show(this.elements.whiteboardViewElement);
                DomUtils.hide([ this.elements.h5DocumentViewElement ,  this.elements.dynamicPptViewElement ]);
                break;
            case 'h5Document':
                DomUtils.show(this.elements.h5DocumentViewElement);
                DomUtils.hide(this.elements.dynamicPptViewElement);
                if(WhiteboardIntermediateLayerInstance.getActiveTool(this.instanceId) !== 'tool_mouse'){
                    DomUtils.show(this.elements.whiteboardViewElement);
                }else{
                    DomUtils.hide(this.elements.whiteboardViewElement);
                }
                break;
            case 'dynamicPPT':
                DomUtils.show(this.elements.dynamicPptViewElement);
                DomUtils.hide(this.elements.h5DocumentViewElement);
                if(WhiteboardIntermediateLayerInstance.getActiveTool(this.instanceId) !== 'tool_mouse'){
                    DomUtils.show(this.elements.whiteboardViewElement);
                }else{
                    DomUtils.hide(this.elements.whiteboardViewElement);
                }
                break;
        }
        DomUtils.removeClass(this.elements.documentViewElement , ['roadofcloud-filetype-generalDocument' , 'roadofcloud-filetype-h5Document' , 'roadofcloud-filetype-dynamicPPT']);
        DomUtils.addClass(this.elements.documentViewElement , 'roadofcloud-filetype-'+this.fileTypeMark );
        this.resizeWhiteboardHandler();
    } ;

    /*动态PPT音量的更新*/
    _updatedynamicPptVolume(volume){
        if( volume < 0 ){
            volume = 0;
        }else if(volume > 100){
            volume = 100 ;
        }
        this.dynamicPptVolume  = volume ;
        if(this.configration.loadDynamicPptView && this.instanceId === 'default' || this.configration.hasExtendDocument){
            DynamicPptIntermediateLayerInstance.postMessage(this.instanceId , {
                action:"PptVolumeControl" ,
                volumeValue:this.dynamicPptVolume / 100
            });
        }
        if (this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume) {
            this.whiteBoardManagerInstance.getRoomDelegate().setPptAudioVolume(volume);
        }
        this._viewStateUpdate(); // 动态ppt文档音频音量的更新
    }

    /*视图状态更新*/
    _viewStateUpdate(){
        if( !WhiteboardIntermediateLayerInstance.hasWhiteboardById( this.instanceId ) ){
            return ;
        }
        let tempWhiteboardViewState = {};
        let { currpage , pagenum , pptslide , pptstep  , steptotal , fileid } = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata( this.instanceId ) ;
        let registerWhiteboardToolsList = WhiteboardIntermediateLayerInstance.getRegisterWhiteboardToolsList( this.instanceId );
        let pageState = {
            nextPage:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') ||  !( this.configration.canPage && this.configration.isConnectedRoom  &&  currpage < pagenum ) ,
            },
            prevPage:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') || !( this.configration.canPage && this.configration.isConnectedRoom  &&  currpage > 1 )  ,
            },
            skipPage:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') || !(this.configration.canPage && this.configration.isConnectedRoom)
            },
            addPage:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') || ( this.fileTypeMark !== 'generalDocument' || !(this.configration.canPage && this.configration.addPage && this.configration.isConnectedRoom ) ) ? true : !( currpage >= pagenum && Number(fileid) === 0 )  ,
            },
            nextStep:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') || ( this.fileTypeMark !== 'dynamicPPT' || !(this.configration.canPage && this.configration.isConnectedRoom ) ) ? true : ( pptslide >= pagenum && pptstep >= steptotal-1 ) ,
            },
            prevStep:{
                disabled:(Global.isPlayVideoing && this.instanceId === 'default') || ( this.fileTypeMark !== 'dynamicPPT' || !(this.configration.canPage && this.configration.isConnectedRoom ) ) ? true : ( pptslide <= 1 && pptstep <= 0 ) ,
            },
            currentPage:currpage < 1 ? 1 :  currpage , //当前页
            totalPage:pagenum < 1 ? 1 : pagenum ,   //总页数
        };
        for( let [key , value] of Object.entries(registerWhiteboardToolsList) ){
            if( /tool_/g.test(key) ){
                if( this.whiteboardViewState.tool[key] !== value ){
                    if( typeof value === 'object' && !Array.isArray( value ) ){
                        for( let [innerKey , innerValue] of Object.entries(value) ){
                            this.whiteboardViewState.tool[key] = this.whiteboardViewState.tool[key] || {} ;
                            if( innerValue !== this.whiteboardViewState.tool[key][innerKey] ){
                                tempWhiteboardViewState.tool = tempWhiteboardViewState.tool || {};
                                tempWhiteboardViewState.tool[key] = tempWhiteboardViewState.tool[key] || {} ;
                                tempWhiteboardViewState.tool[key][innerKey] = innerValue ;
                            }
                        }
                    }else{
                        tempWhiteboardViewState.tool = tempWhiteboardViewState.tool || {};
                        tempWhiteboardViewState.tool[key] = value ;
                    }
                }
            }else if( /action_/g.test(key) ){
                if( this.whiteboardViewState.action[key] !== value ){
                    if( typeof value === 'object' && !Array.isArray( value ) ){
                        for( let [innerKey , innerValue] of Object.entries(value) ){
                            this.whiteboardViewState.action[key] = this.whiteboardViewState.action[key] || {} ;
                            if( innerValue !== this.whiteboardViewState.action[key][innerKey] ){
                                tempWhiteboardViewState.action = tempWhiteboardViewState.action || {};
                                tempWhiteboardViewState.action[key] = tempWhiteboardViewState.action[key] || {} ;
                                tempWhiteboardViewState.action[key][innerKey] = innerValue ;
                            }
                        }
                    }else{
                        tempWhiteboardViewState.action = tempWhiteboardViewState.action || {};
                        tempWhiteboardViewState.action[key] = value ;
                    }
                }
            }else if( /zoom_/g.test(key) ){
                if( this.whiteboardViewState.zoom[key] !== value ){
                    if( typeof value === 'object' && !Array.isArray( value ) ){
                        for( let [innerKey , innerValue] of Object.entries(value) ){
                            this.whiteboardViewState.zoom[key] = this.whiteboardViewState.zoom[key] || {} ;
                            if( innerValue !== this.whiteboardViewState.zoom[key][innerKey] ){
                                tempWhiteboardViewState.zoom = tempWhiteboardViewState.zoom || {};
                                tempWhiteboardViewState.zoom[key] = tempWhiteboardViewState.zoom[key] || {} ;
                                tempWhiteboardViewState.zoom[key][innerKey] = innerValue ;
                            }
                        }
                    }else{
                        tempWhiteboardViewState.zoom = tempWhiteboardViewState.zoom || {};
                        tempWhiteboardViewState.zoom[key] = value ;
                    }
                }
            }
        }
        for( let [key,value] of Object.entries(pageState) ){
            this.whiteboardViewState.page[key] = this.whiteboardViewState.page[key] || {} ;
            if( typeof value === 'object' ){
                for(let [innerKey , innerValue] of Object.entries(value) ){
                    if( this.whiteboardViewState.page[key][innerKey] !== innerValue ){
                        tempWhiteboardViewState.page = tempWhiteboardViewState.page || {};
                        tempWhiteboardViewState.page[key] = tempWhiteboardViewState.page[key] || {} ;
                        tempWhiteboardViewState.page[key][innerKey] =  innerValue ;
                    }
                }
            }else{
                if( this.whiteboardViewState.page[key] !== value ){
                    tempWhiteboardViewState.page = tempWhiteboardViewState.page || {};
                    tempWhiteboardViewState.page[key] =  value ;
                }
            }
        }
        if(this.fileTypeMark !== this.whiteboardViewState.documentType){
            tempWhiteboardViewState.documentType = this.fileTypeMark ;
        }
        if( this.fileid != this.whiteboardViewState.fileid ){
            tempWhiteboardViewState.fileid = this.fileid ; //打开的文档的文件id
        }
        if( this.dynamicPptVolume !== this.whiteboardViewState.dynamicPptVolume ){
            tempWhiteboardViewState.dynamicPptVolume = this.dynamicPptVolume ; //动态ppt的音量
        }
        if( this.fullScreen !== this.whiteboardViewState.fullScreen ){
            tempWhiteboardViewState.fullScreen = this.fullScreen ; //是否全屏
        }
        if( this.remark !== this.whiteboardViewState.remark ){
            tempWhiteboardViewState.remark = this.remark ; //是否开启文档备注
        }
        if(this.scale !== this.whiteboardViewState.scale){
            tempWhiteboardViewState.scale = this.scale ; //文档比例
        }
        let documentRemarkInfoJson = Global.allDocumentRemarkInfoMap.get('documentRemark_'+this.fileid) ;
        this.remarkText =  this.fileid != 0 && documentRemarkInfoJson && documentRemarkInfoJson[this.fileid+'_'+pageState.currentPage] ? documentRemarkInfoJson[fileid+'_'+pageState.currentPage] : '' ;
        if( this.remarkText !== this.whiteboardViewState.remarkText ){
            tempWhiteboardViewState.remarkText = this.remarkText ; //当前页文档备注文本内容
        }
        let whiteboardToolsInfo = WhiteboardIntermediateLayerInstance.getWhiteboardToolsInfo( this.instanceId );
        if( whiteboardToolsInfo && typeof whiteboardToolsInfo === 'object' ){
            for( let [key,value] of Object.entries(whiteboardToolsInfo) ){
                if( this.whiteboardViewState.other[key] !== undefined && this.whiteboardViewState.other[key] !== value ){
                    tempWhiteboardViewState.other = tempWhiteboardViewState.other || {};
                    tempWhiteboardViewState.other[key] = value ;
                }
            }
        }

        if( Object.keys(tempWhiteboardViewState).length ){
            if( tempWhiteboardViewState.tool !== undefined ){
                this._updateViewShowAndHide();
            }
            Object.deepAssign(this.whiteboardViewState , tempWhiteboardViewState );
            if( Object.keys( this.whiteboardViewState.tool ).length && Object.keys( this.whiteboardViewState.action ).length  && Object.keys( this.whiteboardViewState.zoom ).length  && Object.keys( this.whiteboardViewState.page ).length ){
                let cmd = {
                    viewState:this.whiteboardViewState ,
                    updateViewState:tempWhiteboardViewState ,
                };
                this.sendActionCommand( 'viewStateUpdate' ,  cmd ) ; //视图状态更新
            }
        }
    }

    /*发送ShowPage信令*/
    _sendSignalling_ShowPage( updatePubmsgData , callback ){
        if(this.instanceId === 'default' || this.configration.hasExtendDocument){
            let filedata = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
            let pubmsgData = {
                name: this.instanceId === 'default'?'ShowPage':'ExtendShowPage' ,
                id: this.instanceId === 'default'?'DocumentFilePage_ShowPage':`DocumentFilePage_ExtendShowPage_${this.instanceId}` ,
                toID: '__all' ,
                data: {
                    sourceInstanceId:this.instanceId,
                    isGeneralFile: this.fileTypeMark === 'generalDocument' ,
                    isMedia:false ,
                    isDynamicPPT: this.fileTypeMark === 'dynamicPPT' ,
                    isH5Document: this.fileTypeMark === 'h5Document'  ,
                    action: '' ,
                    mediaType:'' ,
                    filedata:filedata
                },
                save: true ,
            };
            if(updatePubmsgData){
                Object.deepAssign( pubmsgData , updatePubmsgData );
            }
            if( ( this.configration.synchronization && this.configration.isConnectedRoom ) ){
                this.pubMsg( pubmsgData );
            }
            if(callback && typeof callback === 'function'){
                callback( pubmsgData );
            }
        };
    };

    /*加载动态PPT*/
    _loadCurrentDynamicPpt( otherParameters , options = {} ){
        if( this.fileTypeMark !== 'dynamicPPT' ){
            return ;
        }
        let filedata  = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
        let { fileid, swfpath, isContentDocument } = filedata;
        let baseurl = this.getRealBaseurl(filedata);
        let src = !Number(isContentDocument) ? (baseurl ? baseurl : Global.nowUseDocAddress + swfpath + '/newppt.html') : swfpath;
        let parameters = {
            versions:Constant.dynamicPptVersions ,
            fileid:fileid ,
            playback:this.configration.isPlayback ,
            classbegin:true ,
            // classbegin:( this.configration.synchronization && this.configration.isConnectedRoom ) ,
            publishDynamicPptMediaPermission_video:( this.configration.synchronization && this.configration.isConnectedRoom ) ,
            remoteNewpptUpdateTime:Constant.remoteDynamicPptUpdateTime ,
            role:this.configration.myRole ,
            dynamicPptActionClick:this.configration.actionClick && this.configration.isConnectedRoom ,
            newpptPagingPage:this.configration.canPage && this.configration.isConnectedRoom ,
            dynamicPptDebug:Constant.dynamicPptDebugLog ,
            PptVolumeValue:this.dynamicPptVolume / 100 ,
            deviceType:this.configration.deviceType === 'phone' ? 0:undefined,
            isBackEvent:this.configration.isBackEvent,
            isClientPlayAudio:this.configration.isNativePlayAudio,
        };
        this.setPreloadParams(parameters, baseurl);
        if(this.forceReloadTimestampFromPpt !== undefined){
            parameters.forceReloadTimestamp = this.forceReloadTimestampFromPpt;
        }
        if(this.forceReloadNumberFromPpt !== undefined){
            parameters.forceReloadNumber = this.forceReloadNumberFromPpt;
            options.forceReloadNumber = this.forceReloadNumberFromPpt;
        }
        if(  otherParameters && Utils.isJson( otherParameters ) ){
            for( let [key , value] of Object.entries( otherParameters ) ){
                parameters[key] = value ;
            }
        }
        options.playback = this.configration.isPlayback;
        DynamicPptIntermediateLayerInstance.setDynamicPptIframeSrc(this.instanceId , src , parameters , filedata , options ) ;
    };

    /*加载动态H5文档*/
    _loadCurrentH5Document( otherParameters  , options = {} ){
        if( this.fileTypeMark !== 'h5Document' ){
            return ;
        }
        let filedata  = WhiteboardIntermediateLayerInstance.getWhiteboardFiledata(this.instanceId);
        let {fileid, swfpath, isContentDocument } = filedata;
        let baseurl = this.getRealBaseurl(filedata);
        let src;
        L.Logger.info('Document swfpath：',swfpath,'isContentDocument:', isContentDocument);
        if (Number(isContentDocument)) {
            if (swfpath) {
                src = swfpath;
            }
        }else {
            src = baseurl ? baseurl : Global.nowUseDocAddress +  swfpath;
        }

        let parameters = this.configration.sendH5DocumentRoomInfo;
        parameters.isClientPlayAudio = this.configration.isNativePlayAudio;
        parameters.fileid = fileid;
        this.setPreloadParams(parameters, baseurl);
        parameters.role = this.configration.myRole;
        if(  otherParameters && Utils.isJson( otherParameters ) ){
            for( let [key , value] of Object.entries( otherParameters ) ){
                parameters[key] = value ;
            }
        }
        H5DocumentIntermediateLayerInstance.setH5DocumentIframeSrc(this.instanceId , src , parameters , filedata , options) ;
    };

    setPreloadParams(parameters, baseurl) {
        /* 调试专用代码,正式上线删除 start */
        // const preloadMsgEle = document.querySelectorAll(".preload-msg");
        // preloadMsgEle.forEach(ele => ele.remove());
        /* 调试专用代码,正式上线删除 end */
        if (baseurl) {
            const splits = Global.nowUseDocAddress.split(":");
            parameters.playProtocol = splits[0];
            parameters.playHostname = splits[1].replace(/\//g, "");
            parameters.playPort = splits[2];

            /* 调试专用代码,正式上线删除 start */
            // const preloadMsgEle = document.createElement("div");
            // preloadMsgEle.className = "preload-msg";
            // preloadMsgEle.style.position = "fixed";
            // preloadMsgEle.style.top = 0;
            // preloadMsgEle.style.right = 0;
            // preloadMsgEle.style.padding = "20px";
            // preloadMsgEle.style.maxWidth = "100%";
            // preloadMsgEle.style.background = "#FFF";
            // preloadMsgEle.style.border = "10px solid red";
            // preloadMsgEle.style.color = "black";
            // preloadMsgEle.style.zIndex = 9999999999999;
            // preloadMsgEle.innerText = `baseurl: ${baseurl}`;
            // document.querySelector("body").appendChild(preloadMsgEle);
            /* 调试专用代码,正式上线删除 end */
        }
    }

    getRealBaseurl (filedata) {
        let baseurl = "";
        if (!Global.preloadFile) { // 还未预加载并且参数中有baseurl参数
            let preloadFile = localStorage.getItem("preloadFile");
            try {
                preloadFile = JSON.parse(preloadFile);
            } catch (error) {
                if (filedata.baseurl) {
                    preloadFile = filedata;
                } else {
                    preloadFile = preloadFile;
                }
            }
            Global.preloadFile = preloadFile ? preloadFile : Global.preloadFile;
            if (!Global.preloadFile && filedata.baseurl) {
                Global.preloadFile = filedata;
            }
        }
        if (Global.preloadFile && this.isPreloadFile(filedata)) {
            baseurl = Global.preloadFile.baseurl;
        }
        return baseurl;
    }

    isPreloadFile(filedata) {
        return !!Global.preloadFile && !!filedata && String(Global.preloadFile.fileid) === String(filedata.fileid);
    }

}
export default  WhiteboardView ;
