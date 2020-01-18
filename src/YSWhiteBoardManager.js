/*sdk白板的管理类
 * @module YSWhiteBoardManager
 * @description  sdk与白板的通信管理类
 * @author 邱广生
 * @date 2018-04-18
 */
'use strict';
import Global from './utils/Global';
import Constant from './utils/Constant';
import Utils from './utils/Utils';
import Configuration from './utils/Configuration';
import WhiteboardIntermediateLayerInstance from './intermediateLayer/WhiteboardIntermediateLayer';
import WhiteboardView from './view/containers/WhiteboardView';
import RoadofAudioPlayer from './view/containers/AudioPlayer';
import RoadofVideoPlayer from './view/containers/VideoPlayer';
import RoadofDocumentToolbar from  './view/containers/DocumentToolbar';
import RoadofDocumentRemark from  './view/containers/DocumentRemark';

class YSWhiteBoardManagerInner{
    /*构造器*/
    constructor(room , sdkReceiveActionCommand, isInner){
        this.className = 'YSWhiteBoardManagerInner' ; //类的名字
        this.isInner = isInner;
        this.room = room ;
        this.sdkReceiveActionCommand = sdkReceiveActionCommand ;
        this.whiteboardViewMap = new Map() ;
        this.awitWhiteboardConfigrationMap = new Map() ;
        this.randomCreateExtendWhiteboardNumber = 0 ;
        this.audioPlayerView = undefined ; //音频播放器
        this.videoPlayerView = undefined ; //视频播放器
        this.documentRemarkViewList = {} ; //文档备注视图列表
        this.documentToolbarViewList = {} ; //文档工具条列表
        this.listernerBackupid = new Date().getTime()+'_'+Math.random() ;
        this.pureWhiteboardFileinfoList = {};
        this.saveMsglistData = {};//用于收到msglist消息时实例还没创建，保存数据
        this.savePubmsgData = {};//用于收到Pubmsg消息时实例还没创建，保存数据
        this._registerEvent();
        this._addRoomEvent();
        
    };

    /*获取版本号*/
    getVersion(){
        return Constant.WHITEBOARD_SDK_VERSION;
    }

    /*创建主白板
    * @params parentNode:白板容器节点 ， Node
    * @params configration:白板配置项 ， Json
    * @params receiveActionCommand:接收白板通知消息函数 ， Function
    * */
    createMainWhiteboard( parentNode = document.body  , configration = {} , receiveActionCommand ){
        if(  typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createMainWhiteboard method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }
        let instanceId = 'default' ;
		L.Logger.debug('[whiteboarrd-sdk]createMainWhiteboard  parentNode and configration and receiveActionCommand:',parentNode , configration , receiveActionCommand);
        this._createWhiteboard( parentNode , instanceId , configration , (...args) => {
            if( this.documentToolbarViewList[instanceId] && this.documentToolbarViewList[instanceId].receiveActionCommand ){
                this.documentToolbarViewList[instanceId].receiveActionCommand(...args);
            }
            if( this.documentRemarkViewList[instanceId] && this.documentRemarkViewList[instanceId].receiveActionCommand ){
                this.documentRemarkViewList[instanceId].receiveActionCommand(...args);
            }
            if(typeof receiveActionCommand === 'function'){
                if (this.isInner) {
                    receiveActionCommand(...args);
                }else {
                    let action = args[0];
                    if (action === 'viewStateUpdate' || action === 'mediaPlayerNotice') {
                        receiveActionCommand(...args);
                    }
                }
            }
        } );
        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        if( whiteboardView && whiteboardView.getConfigration().isLoadDocumentToolBar ){
            let documentToolBarParentNode = whiteboardView.getConfigration().documentToolBarConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
            this.createDocumentToolBar( documentToolBarParentNode , whiteboardView.getConfigration().documentToolBarConfig, instanceId );
        }
        if( whiteboardView && whiteboardView.getConfigration().isLoadDocumentRemark ){
            let documentRemarkParentNode = whiteboardView.getConfigration().documentRemarkConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
            this.createDocumentRemark( documentRemarkParentNode , whiteboardView.getConfigration().documentRemarkConfig, instanceId );
        }
        if( whiteboardView && whiteboardView.getConfigration().isLoadAudioPlayer ){
            let audioPlayerParentNode = whiteboardView.getConfigration().audioPlayerConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
            this.createAudioPlayer( audioPlayerParentNode , whiteboardView.getConfigration().audioPlayerConfig );
        }
        if( whiteboardView && whiteboardView.getConfigration().isLoadVideoPlayer ){
            let videoPlayerParentNode = whiteboardView.getConfigration().videoPlayerConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
            this.createVideoPlayer( videoPlayerParentNode , whiteboardView.getConfigration().videoPlayerConfig );
        }
        this._executeSaveMsglistData(instanceId);
        this._executeSavePubmsgData(instanceId);
    };

    /*创建扩展白板
     * @params parentNode:白板容器节点 ， Node
     * @params instanceId:白板实例id  , String
     * @params configration:白板配置项 ， Json
     * @params receiveActionCommand:接收白板通知消息函数 ， Function
    */
    createExtendWhiteboard( parentNode = document.body ,  instanceId = undefined ,  configration = {} , receiveActionCommand ){
		L.Logger.debug('[whiteboarrd-sdk]createExtendWhiteboard  parentNode  instanceId  configration and receiveActionCommand:', parentNode , instanceId , configration , receiveActionCommand);
        if( instanceId !== undefined && instanceId !== null ){
            if(  typeof parentNode === 'string'){
                let parentNodeStr = parentNode ;
                parentNode = document.getElementById( parentNodeStr );
                if(!parentNode){
                    L.Logger.warning('The node id cannot be found by node id, and createExtendWhiteboard method cannot be performed , element id is '+parentNodeStr+'.');
                    return ;
                }
            }
            if(!instanceId){
                this.randomCreateExtendWhiteboardNumber++ ;
                instanceId = 'randomWhiteboard'+this.randomCreateExtendWhiteboardNumber ;
            }
            this._createWhiteboard( parentNode , instanceId , configration , (...args) => {
                if( this.documentToolbarViewList[instanceId] && this.documentToolbarViewList[instanceId].receiveActionCommand ){
                    this.documentToolbarViewList[instanceId].receiveActionCommand(...args);
                }
                if( this.documentRemarkViewList[instanceId] && this.documentRemarkViewList[instanceId].receiveActionCommand ){
                    this.documentRemarkViewList[instanceId].receiveActionCommand(...args);
                }
                if(typeof receiveActionCommand === 'function'){
                    if (this.isInner) {
                        receiveActionCommand(...args);
                    }else {
                        let action = args[0];
                        if (action === 'viewStateUpdate' || action === 'mediaPlayerNotice') {
                            receiveActionCommand(...args);
                        }
                    }
                }
            } );
            let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
            if( whiteboardView && whiteboardView.getConfigration().isLoadDocumentToolBar && whiteboardView.getConfigration().hasExtendDocument ){
                let documentToolBarParentNode = whiteboardView.getConfigration().documentToolBarConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                this.createDocumentToolBar( documentToolBarParentNode , whiteboardView.getConfigration().documentToolBarConfig, instanceId );
            }
            if( whiteboardView && whiteboardView.getConfigration().isLoadDocumentRemark && whiteboardView.getConfigration().hasExtendDocument ){
                let documentRemarkParentNode = whiteboardView.getConfigration().documentRemarkConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                this.createDocumentRemark( documentRemarkParentNode , whiteboardView.getConfigration().documentRemarkConfig, instanceId );
            }
            this._executeSaveMsglistData(instanceId);
            this._executeSavePubmsgData(instanceId);
        }
    };

    /*销毁主白板*/
    destroyMainWhiteboard(){
		L.Logger.debug('[whiteboarrd-sdk]destroyMainWhiteboard');
        let instanceId = 'default' ;
        this._destroyWhiteboard(instanceId);
    };

    /*销毁扩展白板
     * @params instanceId:白板实例id  , String
    * */
    destroyExtendWhiteboard(instanceId){
		L.Logger.debug('[whiteboarrd-sdk]destroyExtendWhiteboard  instanceId:',instanceId);
        if( instanceId !== undefined && instanceId !== null ){
            this._destroyWhiteboard(instanceId);
        }
    };

    /*改变显示的文件
     * @params fileid:文件id , Int
     * @params toPage:跳到的页数 , Int
     * @params instanceId:白板实例id  , String
     * */
    changeDocument( fileid , toPage = 1, instanceId = 'default' ){
        if(YS.SDKTYPE === 'mobile'){
            L.Logger.error('changeDocument method is not allowed in the mobile environment!');
            return ;
        }
        if(fileid == undefined || fileid == null){
            L.Logger.error('changeDocument method parameter error: fileid can\'t be empty! ');
            return ;
        }
        if( this.room ){
            if( this.whiteboardViewMap.has(instanceId) ){
                let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
                let fileinfo = undefined ;
                if(fileid == 0){
                    fileinfo = this.pureWhiteboardFileinfoList[instanceId] ;
                }else{
                    let filelist = this.room.getFileList();
                    for( let file of filelist ){
                        if( file.fileid ==  fileid ){
                            fileinfo = file ;
                            break ;
                        }
                    }
                }
                if( fileinfo ){
                    if( /(mp3|mp4|webm)/g.test( fileinfo.filetype ) ){
                        let swfpath = fileinfo.swfpath;
                        let index = swfpath.lastIndexOf(".") ;
                        let imgType = swfpath.substring(index);
                        let fileUrl = swfpath.replace(imgType,"-1"+imgType) ;
                        let url =  Global.nowUseDocAddress  + fileUrl ,
                            isVideo = /(mp4|webm)/g.test( fileinfo.filetype ) ,
                            toID = whiteboardView.getConfigration().mediaShareToID ,
                            attrs = {
                                source:'mediaFileList' ,
                                filename:fileinfo.filename ,
                                fileid:fileinfo.fileid  ,
                                pauseWhenOver:isVideo && whiteboardView.getConfigration().mediaSharePauseWhenOver
                            } ;
                        this.startShareMedia( url , isVideo , toID , attrs );
                    }else{
                        let fileprop = Number( fileinfo.fileprop );
                        let isDynamicPPT = fileprop === 1 || fileprop === 2 ;
                        let isH5Document = fileprop === 3 ;
                        let isGeneralFile = !isDynamicPPT && !isH5Document ;
                        if( isDynamicPPT || isH5Document || isGeneralFile ){
                            if( isGeneralFile && toPage > fileinfo.pagenum ){
                                toPage = fileinfo.pagenum ;
                            }
                            if(toPage < 1){
                                toPage = 1 ;
                            }
                            let pubmsgData = {
                                name: instanceId === 'default'?'ShowPage':'ExtendShowPage' ,
                                id: instanceId === 'default'?'DocumentFilePage_ShowPage':`DocumentFilePage_ExtendShowPage_${instanceId}`  ,
                                toID: '__all' ,
                                data: {
                                    sourceInstanceId:instanceId,
                                    isGeneralFile: isGeneralFile ,
                                    isMedia:false ,
                                    isDynamicPPT:isDynamicPPT ,
                                    isH5Document: isH5Document  ,
                                    action: 'show' ,
                                    mediaType:'' ,
                                    filedata:{
                                        currpage:toPage ,
                                        pptslide: isDynamicPPT ? toPage : 1,
                                        pptstep:0,
                                        steptotal:0 ,
                                        fileid:fileinfo.fileid ,
                                        pagenum:fileinfo.pagenum ,
                                        filename:fileinfo.filename ,
                                        filetype:fileinfo.filetype ,
                                        isContentDocument:fileinfo.isContentDocument ,
                                        swfpath: (isDynamicPPT || isH5Document) ? fileinfo.downloadpath : fileinfo.swfpath
                                    }
                                },
                                save: true ,
                            };
                            this.receiveEventRoomPubmsg({ type:'room-pubmsg' , message: Object.deepAssign({} , pubmsgData)  }, instanceId);
                            if( whiteboardView.getConfigration().synchronization &&  whiteboardView.getConfigration().isConnectedRoom){
                                this.pubMsg( pubmsgData );
                            }
                        }else{
                            L.Logger.info('[whiteboarrd-sdk]changeDocument:you open file type is not support , filetype is '+fileinfo.filetype+' , fileid is '+fileid+' , toPage is '+toPage+'.');
                        }
                    }
                }else{
                    L.Logger.info('[whiteboarrd-sdk]changeDocument:you can\'t find the file by fileid , fileid is '+fileid+' , toPage is '+toPage+'.');
                }
            }
        }
    };

    /*打开指定服务器的课件/
     * @params url: 文件路径 String
     * @params id: 文件相关信息辨识用id(任意唯一且不重复的值) String
     * @params type: 文件类型 generalDocument: 图片， dynamicPPT: 动态PPT课件, h5Document: h5课件, mediaFile:媒体文件，  String
     * @params onFailure: 传入失败后回调函数 Function
     * @params: [option]: 配置项 扩展用 Object
    */
    openRemoteDocument(url, id, type,onFailure,option = {}) {
        const checkArguments = (function () {
            function checkURL(URL) { 
                let str = URL;
                let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
                let objExp = new RegExp(Expression);
                if(objExp.test(str) == true){ 
                    return true; 
                }else{ 
                    return false; 
                } 
            }
            function checkType(TYPE) {
                let types = ['generalDocument', 'dynamicPPT', 'h5Document','mediaFile'];
                if ( types.indexOf(TYPE) !=-1) {
                    return true;
                }
                return false;
            }
            function checkNotEmpty(id) {
                return !!id;
            }
            return function(url, type, id, onFailure){
                if(!checkURL(url)){
                    L.Logger.error('[whiteboarrd-sdk]openRemoteDocument: url invalid');
                    if(typeof onFailure === 'function'){
                        onFailure('url invalid');
                    }
                    return false;
                }
                if(!checkType(type)){
                    L.Logger.error('[whiteboarrd-sdk]openRemoteDocument: type invalid');
                    if(typeof onFailure === 'function'){
                        onFailure('type invalid');
                    }
                    return false;
                }
                if(!checkNotEmpty(id)){
                    L.Logger.error('[whiteboarrd-sdk]openRemoteDocument: id is empty');
                    if(typeof onFailure === 'function'){
                        onFailure('id is empty');
                    }
                    return false;
                }
                return true;
            }
        })()
        if(!checkArguments(url, type, id, onFailure) || !this.room) return false;
        if( this.whiteboardViewMap.has('default') ){
            let whiteboardView = this.whiteboardViewMap.get('default') ;
            let filename = 'unknown';
            let filetype = 'unknown';
            try{
                let urlArr = url.split(/(\/|\\)/g);
                if(urlArr && urlArr.length>1){
                    let fileInfo = urlArr[urlArr.length-1];
                    if(fileInfo && typeof fileInfo === 'string'){
                        let fileInfoArr = fileInfo.split('.');
                        if(fileInfoArr && fileInfoArr.length == 2){
                            filename = fileInfoArr[0];
                            filetype = fileInfoArr[1];
                        }
                    }
                }
            }catch (e) {
                L.Logger.error('[whiteboarrd-sdk]openRemoteDocument err:',e);
            }
            if(type === 'mediaFile'){
                let toID = whiteboardView.getConfigration().mediaShareToID ;
                let isVideo = filetype === 'unknown' ? /(.mp4|.webm)/g.test(url) : /(mp4|webm)/g.test(filetype);
                let attrs = {
                    source:'mediaFileList' ,
                    filename:filename ,
                    fileid:id  ,
                    pauseWhenOver:isVideo && whiteboardView.getConfigration().mediaSharePauseWhenOver
                } ;
                this.startShareMedia( url , isVideo , toID , attrs );
            }else{
                let pubmsgData = {
                    name: 'ShowPage' ,
                    id: 'DocumentFilePage_ShowPage' ,
                    toID: '__all' ,
                    data: {
                        isGeneralFile: type == 'generalDocument' ,
                        isMedia:false ,
                        isDynamicPPT: type == 'dynamicPPT' ,
                        isH5Document: type == 'h5Document'  ,
                        action: 'show' ,
                        mediaType:'' ,
                        filedata:{
                            currpage:option.toPage !== undefined && typeof option.toPage === 'number'? option.toPage : 1 ,
                            pptslide:option.toPage !== undefined && typeof option.toPage === 'number'? option.toPage : 1 ,
                            pptstep:0 ,
                            steptotal:0 ,
                            fileid:id ,
                            pagenum:1,
                            filename:filename ,
                            filetype:filetype ,
                            isContentDocument:1 ,
                            swfpath: url
                        }
                    },
                    save: true ,
                };
                this.receiveEventRoomPubmsg({ type:'room-pubmsg' , message: Object.deepAssign({} , pubmsgData)  });
                if( whiteboardView.getConfigration().synchronization &&  whiteboardView.getConfigration().isConnectedRoom){
                    this.pubMsg( pubmsgData );
                }
            }
        }
    }

    /*改变白板相关配置
     * @params configration:需要更新的配置项 , Object
     * @params instanceId:白板实例id , String
     */
    changeWhiteBoardConfigration(configration , instanceId = 'default'){
        let commonWhiteBoardConfigration = {} ;
        for( let key in configration ){
            if( Configuration.commonWhiteboard.hasOwnProperty( key ) ){
                commonWhiteBoardConfigration[key] = configration[key] ;
                delete configration[key] ;
            }
        }
        if( Object.keys(commonWhiteBoardConfigration).length ){
            this.changeCommonWhiteBoardConfigration( commonWhiteBoardConfigration ) ;
        }
        if( !Object.keys(configration).length ){
            return ;
        }
        L.Logger.debug('[whiteboarrd-sdk]changeWhiteBoardConfigration  configration and instanceId:' , configration , instanceId);
        if( this.whiteboardViewMap.has(instanceId) ){
            if( this.awitWhiteboardConfigrationMap.has(instanceId) ){
                this.awitWhiteboardConfigrationMap.delete(instanceId);
            }
            this.whiteboardViewMap.get(instanceId).changeWhiteBoardConfigration(configration);
        }else{
            if( this.awitWhiteboardConfigrationMap.has(instanceId) ){
                Object.deepAssign( this.awitWhiteboardConfigrationMap.get(instanceId) , configration);
            }else{
                this.awitWhiteboardConfigrationMap.set( instanceId ,Object.deepAssign({} , Configuration.defaultWhiteboard , Configuration.commonWhiteboard , configration) ) ;
            }
        }
        if( configration.isLoadDocumentToolBar !== undefined && instanceId === 'default' || configration.hasExtendDocument){
            let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
            if(configration.isLoadDocumentToolBar && !this.documentToolbarViewList[instanceId] ){
                if( whiteboardView ){
                    let documentToolBarParentNode = whiteboardView.getConfigration().documentToolBarConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                    this.createDocumentToolBar( documentToolBarParentNode , whiteboardView.getConfigration().documentToolBarConfig, instanceId );
                }
            }else if(!configration.isLoadDocumentToolBar && this.documentToolbarViewList[instanceId] && this.documentToolbarViewList[instanceId].destroyView ){
                this.documentToolbarViewList[instanceId].destroyView();
                this.documentToolbarViewList[instanceId] = undefined ;
            }
        }
        if( configration.isLoadDocumentRemark !== undefined && instanceId === 'default' || configration.hasExtendDocument){
            let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
            if(configration.isLoadDocumentRemark && !this.documentRemarkViewList[instanceId] ){
                if( whiteboardView ){
                    let documentRemarkParentNode = whiteboardView.getConfigration().documentRemarkConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                    this.createDocumentRemark( documentRemarkParentNode , whiteboardView.getConfigration().documentRemarkConfig, instanceId );
                }
            }else if(!configration.isLoadDocumentRemark && this.documentRemarkViewList[instanceId] && this.documentRemarkViewList[instanceId].destroyView ){
                this.documentRemarkViewList[instanceId].destroyView();
                this.documentRemarkViewList[instanceId] = undefined ;
            }
        }
        if( configration.isLoadAudioPlayer !== undefined && instanceId === 'default'){
            let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
            if(configration.isLoadAudioPlayer && !this.audioPlayerView ){
                if( whiteboardView ){
                    let audioPlayerParentNode = whiteboardView.getConfigration().audioPlayerConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                    this.createAudioPlayer( audioPlayerParentNode , whiteboardView.getConfigration().audioPlayerConfig );
                }
            }else if(!configration.isLoadAudioPlayer && this.audioPlayerView && this.audioPlayerView.destroyView ){
                this.audioPlayerView.destroyView();
                this.audioPlayerView = undefined ;
            }
        }

        if( configration.isLoadVideoPlayer !== undefined && instanceId === 'default'){
            let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
            if(configration.isLoadVideoPlayer && !this.videoPlayerView ){
                if( whiteboardView ){
                    let videoPlayerParentNode = whiteboardView.getConfigration().videoPlayerConfig.parentNode ||  whiteboardView.getWhiteboardRootElement();
                    this.createVideoPlayer( videoPlayerParentNode , whiteboardView.getConfigration().videoPlayerConfig );
                }
            }else if(!configration.isLoadVideoPlayer && this.videoPlayerView && this.videoPlayerView.destroyView ){
                this.videoPlayerView.destroyView();
                this.videoPlayerView = undefined ;
            }
        }

        if( configration.languageType !== undefined ){
            if( instanceId === 'default' || configration.hasExtendDocument){
                if( this.documentToolbarViewList[instanceId] ){
                    this.documentToolbarViewList[instanceId].setProps({
                        languageType:configration.languageType
                    });
                }
                if( this.documentRemarkViewList[instanceId] ){
                    this.documentRemarkViewList[instanceId].setProps({
                        languageType:configration.languageType
                    });
                }
            }
        }
        if( configration.isMobile !== undefined ){
            if( instanceId === 'default' || configration.hasExtendDocument){
                if( this.documentToolbarViewList[instanceId] ){
                    this.documentToolbarViewList[instanceId].setProps({
                        isMobile:configration.isMobile
                    });
                }
                if( this.documentRemarkViewList[instanceId] ){
                    this.documentRemarkViewList[instanceId].setProps({
                        isMobile:configration.isMobile
                    });
                }
            }
        }

        if( configration.canRemark !== undefined ){
            if( instanceId === 'default' || configration.hasExtendDocument){
                if( this.documentToolbarViewList[instanceId] ){
                    this.documentToolbarViewList[instanceId].setProps({
                        canRemark:configration.canRemark
                    });
                }
                if( this.documentRemarkViewList[instanceId] ){
                    this.documentRemarkViewList[instanceId].setProps({
                        canRemark:configration.canRemark
                    });
                }
            }
        }

        if( configration.documentToolBarConfig  !== undefined ){
            if( instanceId === 'default' || configration.hasExtendDocument){
                if( this.documentToolbarViewList[instanceId] ){
                    if( configration.documentToolBarConfig.hasOwnProperty( 'parentNode' ) && typeof this.documentToolbarViewList[instanceId].changeParentNode === 'function' ){
                        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
                        let parentNode = configration.documentToolBarConfig.parentNode || ( whiteboardView ?  whiteboardView.getWhiteboardRootElement() : undefined );
                        if( typeof parentNode === 'string'){
                            let parentNodeStr = parentNode ;
                            parentNode = document.getElementById( parentNodeStr );
                            if(!parentNode){
                                L.Logger.warning('The node id cannot be found by node id, and  documentToolBarConfig.parentNode cannot update config, element id is '+parentNodeStr+'.');
                                return ;
                            }
                        }
                        this.documentToolbarViewList[instanceId].changeParentNode( parentNode );
                    }
                    for(let key in configration.documentToolBarConfig ){
                        let value = configration.documentToolBarConfig[key] ;
                        if( typeof value === 'object' ){
                            configration.documentToolBarConfig[key] = Object.deepAssign({} , this.documentToolbarViewList[instanceId].props[key] , value );
                        }
                    }
                    this.documentToolbarViewList[instanceId].setProps( Object.deepAssign({} , configration.documentToolBarConfig ) );
                }
            }
        }

        if( configration.documentRemarkConfig  !== undefined ){
            if( instanceId === 'default' || configration.hasExtendDocument){
                if( this.documentRemarkViewList[instanceId] ){
                    if( configration.documentRemarkConfig.hasOwnProperty( 'parentNode' ) && typeof this.documentRemarkViewList[instanceId].changeParentNode === 'function' ){
                        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
                        let parentNode = configration.documentRemarkConfig.parentNode || ( whiteboardView ?  whiteboardView.getWhiteboardRootElement() : undefined );
                        if( typeof parentNode === 'string'){
                            let parentNodeStr = parentNode ;
                            parentNode = document.getElementById( parentNodeStr );
                            if(!parentNode){
                                L.Logger.warning('The node id cannot be found by node id, and  documentRemarkConfig.parentNode cannot update config, element id is '+parentNodeStr+'.');
                                return ;
                            }
                        }
                        this.documentRemarkViewList[instanceId].changeParentNode( parentNode );
                    }
                    for(let key in configration.documentRemarkConfig ){
                        let value = configration.documentRemarkConfig[key] ;
                        if( typeof value === 'object' ){
                            configration.documentRemarkConfig[key] = Object.deepAssign({} , this.documentRemarkViewList[instanceId].props[key] , value );
                        }
                    }
                    this.documentRemarkViewList[instanceId].setProps( Object.deepAssign({} , configration.documentRemarkConfig ) );
                }
            }
        }

        if( configration.audioPlayerConfig  !== undefined ){
            if( this.audioPlayerView ){
                for(let key in configration.audioPlayerConfig ){
                    let value = configration.audioPlayerConfig[key] ;
                    if( typeof value === 'object' ){
                        configration.audioPlayerConfig[key] = Object.deepAssign({} , this.audioPlayerView.props[key] , value );
                    }
                }
                this.audioPlayerView.setProps( Object.deepAssign({} , configration.audioPlayerConfig ) );
            }
        }

        if( configration.videoPlayerConfig  !== undefined ){
            if( this.videoPlayerView ){
                for(let key in configration.videoPlayerConfig ){
                    let value = configration.videoPlayerConfig[key] ;
                    if( typeof value === 'object' ){
                        configration.videoPlayerConfig[key] = Object.deepAssign({} , this.videoPlayerView.props[key] , value );
                    }
                }
                this.videoPlayerView.setProps( Object.deepAssign({}  , configration.videoPlayerConfig ) );
            }
        }

    };

    /*通知白板sdk执行动作指令*/
    noticeWhiteboardActionCommand(action, cmd,instanceId = 'default'){
        L.Logger.debug('[whiteboarrd-sdk]noticeWhiteboardActionCommand ');
        if( this.whiteboardViewMap.has(instanceId) ){
            let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
            whiteboardView.noticeWhiteboardActionCommand(action,cmd);
        }
    };

    /*改变所有白板的公有配置
    * @params <Object> commonConfigration 更新的公有配置项
    * */
    changeCommonWhiteBoardConfigration(commonConfigration){
        L.Logger.debug('[whiteboarrd-sdk]changeCommonWhiteBoardConfigration common configration:' , commonConfigration );
        let CopyObj = Object.deepAssign({},commonConfigration);
        if(typeof CopyObj.docAddress === 'object'){
            Global.docAddress = commonConfigration.docAddress;
            if(Global.docAddressKey === ''){
                Global.docAddressKey = commonConfigration.docAddress.hostname ;
            }
            Global.protocol = CopyObj.docAddress.protocol;
            Global.port = CopyObj.docAddress.port;
            CopyObj.docAddress = commonConfigration.docAddress.protocol  + '://'  + commonConfigration.docAddress.hostname + ':' + commonConfigration.docAddress.port ; // 将拷贝完毕之后的doc地址还原成字符串
        };
        if(typeof CopyObj.webAddress === 'object'){
            CopyObj.webAddress = commonConfigration.webAddress.protocol  + '://'  + commonConfigration.webAddress.hostname + ':' + commonConfigration.webAddress.port ; // 将拷贝完毕之后的web地址还原成字符串
        }
        if( CopyObj.backupDocAddressList && Array.isArray(CopyObj.backupDocAddressList) ){
            Global.backupDocAddressList = commonConfigration.backupDocAddressList;
            Configuration.commonWhiteboard.backupDocAddressList = [];
        }
        Object.deepAssign( Configuration.commonWhiteboard , CopyObj) ;
        for( let awitWhiteboardConfigration of this.awitWhiteboardConfigrationMap.values() ){
            Object.deepAssign( awitWhiteboardConfigration , CopyObj);
        }
        if( commonConfigration.docAddress !== undefined || commonConfigration.backupDocAddressList !== undefined ){
            Global.docAddressList =  [Global.docAddress,...Global.backupDocAddressList,...Global.laterAddressList] ;
            if( !Global.hasGetDocAddressIndexByLocalStorage ){
                Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey)  || Configuration.commonWhiteboard.docAddress;
                this.getLocalStorageItem( 'ysDocAddressKey'  ,  (docAddressKey) => {
                    if(docAddressKey && docAddressKey !== undefined && typeof  docAddressKey === 'string' && docAddressKey !=='undefined'){
                        Global.docAddressKey = docAddressKey ;
                        Global.localStorageDocAddressKey = docAddressKey;
                        if(Global.localStorageDocAddressKey && Utils.getItem(Global.docAddressList,Global.localStorageDocAddressKey) === '' && Utils.getItem(Global.laterAddressList,Global.localStorageDocAddressKey) === ''){
                            if(Global.protocol && Global.port) {
                                Global.laterAddressList = [{protocol:Global.protocol,hostname:Global.localStorageDocAddressKey ,port:Global.port}];
                            }
                            Global.docAddressList =  [Global.docAddress,...Global.backupDocAddressList,...Global.laterAddressList] ;
                        }
                        Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || Configuration.commonWhiteboard.docAddress;
                        Global.hasGetDocAddressIndexByLocalStorage = true ;
                    }else{
                        if(Global.localStorageDocAddressKey && Utils.getItem(Global.docAddressList,Global.localStorageDocAddressKey) === '' && Utils.getItem(Global.laterAddressList,Global.localStorageDocAddressKey) === ''){
                            if(Global.protocol && Global.port) {
                                Global.laterAddressList = [{protocol:Global.protocol,hostname:Global.localStorageDocAddressKey ,port:Global.port}];
                            }
                            Global.docAddressList =  [Global.docAddress,...Global.backupDocAddressList,...Global.laterAddressList] ;
                        }
                        Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || Configuration.commonWhiteboard.docAddress;
                        Global.hasGetDocAddressIndexByLocalStorage = true ;
                    }
                });
            }else{
                if(Global.localStorageDocAddressKey && Utils.getItem(Global.docAddressList,Global.localStorageDocAddressKey) === '' && Utils.getItem(Global.laterAddressList,Global.localStorageDocAddressKey) === ''){
                    if(Global.protocol && Global.port) {
                        Global.laterAddressList = [{protocol:Global.protocol,hostname:Global.localStorageDocAddressKey ,port:Global.port}];
                    }
                    Global.docAddressList =  [Global.docAddress,...Global.backupDocAddressList,...Global.laterAddressList] ;
                }
                Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || Configuration.commonWhiteboard.docAddress  ;
            }
        }

        for( let [instanceId , whiteboardView] of this.whiteboardViewMap ){
            if( this.awitWhiteboardConfigrationMap.has(instanceId) ){
                this.awitWhiteboardConfigrationMap.delete(instanceId);
            }
            whiteboardView.changeWhiteBoardConfigration(CopyObj);
        }

        for(let documentToolbarView of Object.values(this.documentToolbarViewList)){
            if (documentToolbarView) {
                documentToolbarView.setProps( Object.deepAssign({} , CopyObj ) );
            }
        }

        for(let documentRemarkView of Object.values(this.documentRemarkViewList)){
            if (documentRemarkView) {
                documentRemarkView.setProps( Object.deepAssign({} , CopyObj ) );
            }
        }

        if( this.audioPlayerView ){
            this.audioPlayerView.setProps( Object.deepAssign({} , CopyObj ) );
        }

        if( this.videoPlayerView ){
            this.videoPlayerView.setProps( Object.deepAssign({} , CopyObj ) );
        }
    };

    /*加页
    * @params instanceId:白板实例id  , String
    * */
    addPage(instanceId = 'default'){
        L.Logger.debug('[whiteboarrd-sdk]addPage ')
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).addPage(  );
        }
    };

    /*下一页
    * @params instanceId:白板实例id  , String
    * */
    nextPage(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]nextPage ' )
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).nextPage();
        }
    }

    /*上一页
    * @params instanceId:白板实例id  , String
    * */
    prevPage(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]prevPage ')
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).prevPage(  );
        }
    }

    /*跳转到指定页
    * @params page:跳转到的页数，Int
    * @params instanceId:白板实例id  , String
    * */
    skipPage(page, instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]skipPage  page :' ,page)
        if( typeof page !== 'number' ){
            L.Logger.warning('skipPage page must is number!');
            return ;
        }
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).skipPage( page );
        }
    }

    /*下一步，用于动态ppt
    * @params instanceId:白板实例id  , String
    * */
    nextStep(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]nextStep ')
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).nextStep(  );
        }
    }

    /*上一步，用于动态ppt
    * @params instanceId:白板实例id  , String
    * */
    prevStep(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]prevStep ' )
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).prevStep(  );
        }
    }

    /*放大操作
    * @params instanceId:白板实例id  , String
    * */
    enlargeWhiteboard( instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]enlargeWhiteboard  instanceId:'  ,instanceId)
        let zoomKey = 'zoom_big';// zoom_big:放大白板
        this.executeZoomWhiteaord( zoomKey , instanceId);
    };

    /*缩小操作
    * @params instanceId:白板实例id  , String*/
    narrowWhiteboard( instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]narrowWhiteboard  instanceId:'  ,instanceId)
        let zoomKey = 'zoom_small';// zoom_big:放大白板
        this.executeZoomWhiteaord( zoomKey , instanceId);
    };

    /*清空当前页画笔操作
    * @params instanceId:白板实例id  , String*/
    clear( instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]clear  instanceId:'  ,instanceId)
        let actionKey = 'action_clear';// action_clear:清空白板画笔
        this.executeWhiteboardAction( actionKey , instanceId );
    }

    /*撤销画笔操作
    * @params instanceId:白板实例id  , String*/
    undo( instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]undo  instanceId:'  ,instanceId)
        let  actionKey = 'action_undo';// action_undo:撤销白板画笔
        this.executeWhiteboardAction( actionKey , instanceId );
    }

    /*恢复画笔操作
    * @params instanceId:白板实例id  , String*/
    redo( instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]redo  instanceId:'  ,instanceId)
        let  actionKey = 'action_redo';// action_redo:恢复白板画笔
        this.executeWhiteboardAction( actionKey , instanceId );
    }

    /*全屏功能
    * @params instanceId:白板实例id  , String*/
    fullScreen(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]fullScreen ' );
        if( this.whiteboardViewMap.has(instanceId) && this.room ){
            let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
            if( whiteboardView.getConfigration().isMobile ){ //移动端的全屏
                if( this.room.changeWebPageFullScreen ){
                    this.room.changeWebPageFullScreen(true);
                }
            }else{ //浏览器的全屏
                if( Utils.isFullScreenStatus() ){
                    Utils.exitFullscreen();
                }
                let fullScreenElement = whiteboardView.getWhiteboardRootElement() ;
                let { fullScreenElementId } =  whiteboardView.getConfigration().documentToolBarConfig ;
                if( fullScreenElementId ){
                    if( typeof  fullScreenElementId === 'string' ){
                        if( document.getElementById( fullScreenElementId ) ){
                            fullScreenElement = document.getElementById( fullScreenElementId ) ;
                        }
                    }else{
                        fullScreenElement = fullScreenElementId ;
                    }
                }
                Utils.launchFullscreen( fullScreenElement ) ;
            }
            // whiteboardView.changeFullScreenState( true );
        }
    }

    /*退出全屏功能
    * @params instanceId:白板实例id  , String*/
    exitFullScreen(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]exitFullScreen ');
        if( this.whiteboardViewMap.has(instanceId) && this.room ){
            let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
            if( whiteboardView.getConfigration().isMobile ){ //移动端的全屏
                if( this.room.changeWebPageFullScreen ){
                    this.room.changeWebPageFullScreen(false);
                }
            }else{ //浏览器的全屏
                Utils.exitFullscreen();
            }
            // whiteboardView.changeFullScreenState( false );
        }
    }

    /*更新白板大小
     * @params instanceId:白板实例id , String
    * */
    updateWhiteboardSize(instanceId  = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]updateWhiteboardSize  instanceId:'  ,instanceId);
		let configration = {};
        if( this.whiteboardViewMap.has(instanceId) ){
            let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
            whiteboardView.resizeWhiteboardHandler();
            configration = whiteboardView.getConfigration();
        }
        if( (instanceId  === 'default' || configration.hasExtendDocument) && this.documentRemarkViewList[instanceId] &&  Utils.isFunction( this.documentRemarkViewList[instanceId].resize ) ){
            this.documentRemarkViewList[instanceId].resize();
        }
        if( (instanceId  === 'default' || configration.hasExtendDocument) && this.documentToolbarViewList[instanceId] &&  Utils.isFunction( this.documentToolbarViewList[instanceId].resize ) ){
            this.documentToolbarViewList[instanceId].resize();
        }
    };

    /*更新所有白板大小*/
    updateAllWhiteboardSize(){
		L.Logger.debug('[whiteboarrd-sdk]updateAllWhiteboardSize ');
        for( let instanceId of this.whiteboardViewMap.keys() ){
            this.updateWhiteboardSize( instanceId );
        }
    };

    /*重置指定白板的所有画笔数据
     * @params instanceId:白板实例id , 默认为'default', String
     * */
    resetWhiteboardData(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]resetWhiteboardData  instanceId:'  ,instanceId);
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).resetWhiteboardData();
        }
    };

    /*重置所有白板的数据*/
    resetAllWhiteboardData(){
		L.Logger.debug('[whiteboarrd-sdk]resetAllWhiteboardData ');
        for( let whiteboardView of this.whiteboardViewMap.values() ){
            whiteboardView.resetWhiteboardData();
        }
    };

    /*重置纯白板总页数
    * @params instanceId:白板实例id  , String*/
    resetPureWhiteboardTotalPage(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]resetPureWhiteboardTotalPage ');
		let oldTotalPage = this.pureWhiteboardFileinfoList[instanceId]?this.pureWhiteboardFileinfoList[instanceId].pagenum:1;
		if (this.pureWhiteboardFileinfoList[instanceId]) {
            this.pureWhiteboardFileinfoList[instanceId].pagenum = 1 ;
        }
        let whiteboardView =  this.whiteboardViewMap.get(instanceId) ;
        if( whiteboardView && Utils.isFunction( whiteboardView.resetPureWhiteboardTotalPage ) ){
            whiteboardView.resetPureWhiteboardTotalPage( oldTotalPage );
        }
    }

    /*改变动态PPT音量
    * @params volume:音量大小(0-100)，Int
    * @params instanceId:白板实例id  , String
    * */
    changeDynamicPptVolume( volume, instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]changeDynamicPptVolume volume:',volume);
        if( typeof volume === 'number' && this.whiteboardViewMap.has(instanceId) ){
            let whiteboardView =  this.whiteboardViewMap.get(instanceId);
            if( volume < 0 ){
                volume = 0;
            }else if(volume > 100){
                volume = 100 ;
            }
            let pubmsgData = {
                name: instanceId === 'default'?'PptVolumeControl':'ExtendPptVolumeControl',
                id: instanceId === 'default'?'PptVolumeControl':`PptVolumeControl_${instanceId}`,
                toID: '__allExceptSender' ,
                data: {
                    sourceInstanceId: instanceId,
                    volume:volume / 100
                },
                save: true ,
            };
            this.receiveEventRoomPubmsg({ type:'room-pubmsg' , message:pubmsgData });
            if (this.room.setPptAudioVolume) {
                this.room.setPptAudioVolume( volume );
            }
            if( whiteboardView.getConfigration().pptVolumeSynchronization &&  whiteboardView.getConfigration().isConnectedRoom ){
                this.pubMsg( pubmsgData );
            }
        }
    }

    /*打开文档备注
    * @params instanceId:白板实例id  , String*/
    openDocumentRemark(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]openDocumentRemark ');
        if( this.whiteboardViewMap.has(instanceId) ){
            let whiteboardView =  this.whiteboardViewMap.get(instanceId);
            whiteboardView.changeDocumentRemarkState( true );
        }
    }

    /*关闭文档备注
    * @params instanceId:白板实例id  , String*/
    closeDocumentRemark(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]closeDocumentRemark ');
        if( this.whiteboardViewMap.has(instanceId) ){
            let whiteboardView =  this.whiteboardViewMap.get(instanceId);
            whiteboardView.changeDocumentRemarkState( false );
        }
    }

    /*执行白板的动作
     * @params actionKey:白板动作的key ， key值描述如下：
     action_clear:清空白板画笔
     action_redo:恢复白板画笔
     action_undo:撤销白板画笔
     * @params instanceId:白板实例id
     * */
    executeWhiteboardAction( actionKey ,  instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]executeWhiteboardAction actionKey and	instanceId:',actionKey,instanceId);
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).executeWhiteboardAction( actionKey );
        }
    }

    /*执行缩放白板
     * @params zoomKey:白板缩放的key ， key值描述如下：
     zoom_big:放大白板
     zoom_small:缩小白板
     * @params instanceId:白板实例id
     * */
    executeZoomWhiteaord( zoomKey ,  instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]executeZoomWhiteaord 	zoomKey and	instanceId:',zoomKey,instanceId);
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).executeZoomWhiteaord( zoomKey );
        }
    }

    /*处理room-pubmsg*/
    receiveEventRoomPubmsg(recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomPubmsg 	recvEventData:',recvEventData);
        if(typeof recvEventData === 'string'){
            recvEventData = JSON.parse(recvEventData);
        }
        let pubmsgData = recvEventData.message ;
        if( this._isWhiteboardCorrelationSignalling( pubmsgData.name ) ){
            if( pubmsgData.name === 'ShowPage' || pubmsgData.name === 'whiteboardMarkTool' || pubmsgData.name === 'NewPptTriggerActionClick' || pubmsgData.name === 'PptVolumeControl' || pubmsgData.name === 'H5DocumentAction'
                || pubmsgData.name === 'ExtendShowPage' || pubmsgData.name === 'ExtendWhiteboardMarkTool' || pubmsgData.name === 'ExtendH5DocumentAction' || pubmsgData.name === 'ExtendPptVolumeControl' || pubmsgData.name === 'ExtendNewPptTriggerActionClick'){
                if(pubmsgData.name === 'ShowPage' || pubmsgData.name === 'ExtendShowPage'){
                    if(typeof pubmsgData.data === 'string'){
                        pubmsgData.data = Utils.toJsonParse(pubmsgData.data);
                    }
                    if(pubmsgData.data.isGeneralFile && pubmsgData.data.filedata &&  pubmsgData.data.filedata.fileid == 0){
                        if (pubmsgData.name === 'ShowPage' && this.pureWhiteboardFileinfoList['default']) {
                            pubmsgData.data.filedata.pagenum = this.pureWhiteboardFileinfoList['default'].pagenum;
                        }else if (pubmsgData.name === 'ExtendShowPage' && this.pureWhiteboardFileinfoList[pubmsgData.data.sourceInstanceId]){
                            pubmsgData.data.filedata.pagenum = this.pureWhiteboardFileinfoList[pubmsgData.data.sourceInstanceId].pagenum;
                        }
                    }
                }
                if ( pubmsgData.name === 'ShowPage' || pubmsgData.name === 'whiteboardMarkTool' || pubmsgData.name === 'NewPptTriggerActionClick' || pubmsgData.name === 'PptVolumeControl' || pubmsgData.name === 'H5DocumentAction') {
                    if( this.whiteboardViewMap.has('default')){
                        this.whiteboardViewMap.get('default').receiveEventRoomPubmsg( recvEventData ) ;
                    }else {//此实例不存在又收到了此实例的消息，则保存数据
                        if (this.savePubmsgData['default'] && Array.isArray(this.savePubmsgData['default'])) {
                            this.savePubmsgData['default'].push(recvEventData);
                        }else {
                            this.savePubmsgData['default'] = [recvEventData];
                        }
                    }
                }else if (pubmsgData.name === 'ExtendShowPage' || pubmsgData.name === 'ExtendWhiteboardMarkTool' || pubmsgData.name === 'ExtendPptVolumeControl' || pubmsgData.name === 'ExtendH5DocumentAction' || pubmsgData.name === 'ExtendNewPptTriggerActionClick') {
                    if(pubmsgData.data){
                        if (this.whiteboardViewMap.has(pubmsgData.data.sourceInstanceId)) {
                            this.whiteboardViewMap.get(pubmsgData.data.sourceInstanceId).receiveEventRoomPubmsg(recvEventData);
                        }else {//此实例不存在又收到了此实例的消息，则保存数据
                            if (this.savePubmsgData[pubmsgData.data.sourceInstanceId] && Array.isArray(this.savePubmsgData[pubmsgData.data.sourceInstanceId])) {
                                this.savePubmsgData[pubmsgData.data.sourceInstanceId].push(recvEventData);
                            }else {
                                this.savePubmsgData[pubmsgData.data.sourceInstanceId] = [recvEventData];
                            }
                        }
                    }
                }
            }else{
                for( let  whiteboardView  of this.whiteboardViewMap.values() ){
                    whiteboardView.receiveEventRoomPubmsg(recvEventData);
                }
            }
        }
    };

    /*处理room-connected*/
    receiveEventRoomConnected(recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomConnected 	recvEventData:',recvEventData);
        // 房间连接成功处理清空数据的相关操作
        this.saveMsglistData = {};
        this.savePubmsgData = {};
        this.resetAllWhiteboardData();
        this.resetPureWhiteboardTotalPage();
        let msgs = recvEventData.message ;
        this.receiveEventRoomMsglist(  JSON.stringify( {type: 'room-msglist', message:msgs} ) );
    };

    /*失去连接*/
    receiveEventRoomDisconnected(){
		L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomDisconnected ');
        Global.laterAddressList = [];
        Global.hasGetDocAddressIndexByLocalStorage = false;
        for( let  whiteboardView  of this.whiteboardViewMap.values() ){
            if( whiteboardView && whiteboardView.getConfigration() && whiteboardView.getConfigration().isDisconnectedClearWhiteboardData && Utils.isFunction( whiteboardView.resetWhiteboardData ) ){
                whiteboardView.resetWhiteboardData(); //失去连接且有配置项则清除所有数据
            }
        }
    }

    /*处理room-delmsg*/
    receiveEventRoomDelmsg(recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomDelmsg 	recvEventData:',recvEventData);
        if(typeof recvEventData === 'string'){
            recvEventData = JSON.parse(recvEventData);
        }
        let delmsgData = recvEventData.message ;
        if( this._isWhiteboardCorrelationSignalling( delmsgData.name ) ){
            if(delmsgData.name !== 'SharpsChange'){
                for( let whiteboardView of this.whiteboardViewMap.values() ){
                    whiteboardView.receiveEventRoomDelmsg(recvEventData);
                }
            }
        }
    };

    /*处理room-msglist*/
    receiveEventRoomMsglist(recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomMsglist 	recvEventData:',recvEventData);
        if(typeof recvEventData === 'string'){
            recvEventData = JSON.parse(recvEventData);
        }
        let tmpSignallingData =  {};
        let messageListData = recvEventData.message ;
        for(let x in messageListData) {
            if( this._isWhiteboardCorrelationSignalling( messageListData[x].name ) ){
                if(messageListData[x].data && typeof messageListData[x].data === "string") {
                    messageListData[x].data = JSON.parse(messageListData[x].data);
                }
                if(tmpSignallingData[messageListData[x].name] === null || tmpSignallingData[messageListData[x].name] === undefined) {
                    tmpSignallingData[messageListData[x].name] = [];
                    tmpSignallingData[messageListData[x].name].push(messageListData[x]);
                } else {
                    tmpSignallingData[messageListData[x].name].push(messageListData[x]);
                }
            }
        };

        let signallingNameArray = ['ShowPage', 'whiteboardMarkTool', 'NewPptTriggerActionClick', 'PptVolumeControl', 'H5DocumentAction'
            , 'ExtendShowPage', 'ExtendWhiteboardMarkTool', 'ExtendPptVolumeControl', 'ExtendH5DocumentAction', 'ExtendNewPptTriggerActionClick'] ;
        for(let signallingName of signallingNameArray){
            let signallingArray = tmpSignallingData[signallingName];
            if((signallingName === 'ShowPage' || signallingName === 'ExtendShowPage') && signallingArray && signallingArray.length){
                for(let pubmsgData of signallingArray){
                    if(pubmsgData.name === 'ShowPage' || pubmsgData.name === 'ExtendShowPage'){
                        if(typeof pubmsgData.data === 'string'){
                            pubmsgData.data = Utils.toJsonParse(pubmsgData.data);
                        }
                        if(pubmsgData.data.isGeneralFile && pubmsgData.data.filedata &&  pubmsgData.data.filedata.fileid == 0){
                            if (pubmsgData.name === 'ShowPage' && this.pureWhiteboardFileinfoList['default']) {
                                pubmsgData.data.filedata.pagenum = this.pureWhiteboardFileinfoList['default'].pagenum;
                            }else if (pubmsgData.name === 'ExtendShowPage' && this.pureWhiteboardFileinfoList[pubmsgData.data.sourceInstanceId]) {
                                pubmsgData.data.filedata.pagenum = this.pureWhiteboardFileinfoList[pubmsgData.data.sourceInstanceId].pagenum;
                            }
                        }
                    }
                }
            }
            /*if( signallingName === 'ShowPage' && !( signallingArray !== null && signallingArray !== undefined && signallingArray.length > 0 ) ){
                if( this.whiteboardViewMap.has('default') ){
                    this.whiteboardViewMap.get('default').saveFiledataAndLoadCurrpageWhiteboardData( ) ;
                }
            }*/
            if(signallingArray !== null && signallingArray !== undefined && signallingArray.length > 0) {
                if (signallingName === 'ShowPage' || signallingName === 'whiteboardMarkTool' || signallingName === 'NewPptTriggerActionClick' || signallingName === 'PptVolumeControl' || signallingName === 'H5DocumentAction') {
                    if( this.whiteboardViewMap.has('default')){
                        this.whiteboardViewMap.get('default').receiveEventRoomMsglist( signallingName ,  signallingArray[ signallingArray.length - 1 ] );
                    }else {
                        if (this.saveMsglistData['default'] && Array.isArray(this.saveMsglistData['default'])) {
                            this.saveMsglistData['default'].push(signallingArray[ signallingArray.length - 1 ]);
                        }else {
                            this.saveMsglistData['default'] = [signallingArray[ signallingArray.length - 1 ]];
                        }
                    }
                }else if (signallingName === 'ExtendShowPage' || signallingName === 'ExtendWhiteboardMarkTool' || signallingName === 'ExtendPptVolumeControl' || signallingName === 'ExtendH5DocumentAction' || signallingName === 'ExtendNewPptTriggerActionClick') {
                    for(let pubmsgData of signallingArray){
                        if(pubmsgData.data){
                            if (this.whiteboardViewMap.has(pubmsgData.data.sourceInstanceId)) {
                                this.whiteboardViewMap.get(pubmsgData.data.sourceInstanceId).receiveEventRoomMsglist( signallingName ,  pubmsgData );
                            }else {//此实例不存在又收到了此实例的消息，则保存数据
                                if (this.saveMsglistData[pubmsgData.data.sourceInstanceId] && Array.isArray(this.saveMsglistData[pubmsgData.data.sourceInstanceId])) {
                                    this.saveMsglistData[pubmsgData.data.sourceInstanceId].push(pubmsgData);
                                }else {
                                    this.saveMsglistData[pubmsgData.data.sourceInstanceId] = [pubmsgData];
                                }
                            }
                        }
                    }
                }
            }
            tmpSignallingData[signallingName] = null;
            delete tmpSignallingData[signallingName] ;
        }
    };

    reveiveEventRoomUsermediaorfilestateChanged(recvEventData){
        L.Logger.debug('[whiteboarrd-sdk]reveiveEventRoomUsermediaorfilestateChanged recvEventData:',recvEventData);
        this._forwardingStreamEvents( 'reveiveEventRoomUsermediaorfilestateChanged' ,  recvEventData );
    }

    reveiveEventRoomUsermediaorfileattributesUpdate(recvEventData){
        L.Logger.debug('[whiteboarrd-sdk]reveiveEventRoomUsermediaorfileattributesUpdate recvEventData:',recvEventData);
        this._forwardingStreamEvents( 'reveiveEventRoomUsermediaorfileattributesUpdate' ,  recvEventData );
    }

    receiveEventRoomErrorNotice(recvEventData){
        L.Logger.debug('[whiteboarrd-sdk]receiveEventRoomErrorNotice recvEventData:',recvEventData);
        this._forwardingStreamEvents( 'receiveEventRoomErrorNotice' ,  recvEventData );
    }

    /*接收room-receiveActionCommand*/
    reveiveEventRoomReceiveActionCommand(recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]reveiveEventRoomReceiveActionCommand 	recvEventData:',recvEventData);
        let { action , cmd } = recvEventData.message ;
        switch ( action ){
            case 'transmitWindowSize':
                this._windowResizeCallback();
                break;
        }
        for (let whiteboardView of this.whiteboardViewMap.values()) {
            whiteboardView.reveiveEventRoomReceiveActionCommand( action , cmd );
        }
        // if( this.whiteboardViewMap.has('default') ){
        //     let whiteboardView = this.whiteboardViewMap.get('default') ;
        //     whiteboardView.reveiveEventRoomReceiveActionCommand( action , cmd );
        // }
    };

    /*设置房间*/
    registerRoomDelegate( room  , sdkReceiveActionCommand ){
		L.Logger.debug('[whiteboarrd-sdk]registerRoomDelegate 	room and  sdkReceiveActionCommand:',room , sdkReceiveActionCommand);
        this.room = room ;
        this.sdkReceiveActionCommand = sdkReceiveActionCommand ;
        this._addRoomEvent();
    };

    /*获取房间*/
    getRoomDelegate(){
		L.Logger.debug('[whiteboarrd-sdk]getRoomDelegate ');
        return this.room ;
    };

    /*是否有房间属性*/
    hasRoomDelegate(){
		L.Logger.debug('[whiteboarrd-sdk]hasRoomDelegate ');
        return !!this.room  ;
    };

    /*发送动作指令给sdk
     * @params action：执行的动作
         action目前有：
            whiteboardSdkNotice_ShowPage:翻页消息通知给sdk
     * @params cmd:动作描述
    * */
    sendActionCommandToSdk(action , cmd){
		L.Logger.debug('[whiteboarrd-sdk]sendActionCommandToSdk 	action and	cmd:',action , cmd);
        if( this.sdkReceiveActionCommand && typeof this.sdkReceiveActionCommand === 'function' ){
            if( typeof cmd && !Array.isArray(cmd) ){
                cmd = JSON.parse( JSON.stringify( cmd ) );
            }
            this.sdkReceiveActionCommand(action , cmd);
        }
    }

    /*发送PubMsg信令
     * @allParams params:pubMsg需要的所有参数承接对象
     * @params params.name:信令名字 , String
     * @params params.id:信令ID , String
     * @params params.toID:发送给谁(默认发给所有人) , String
     __all（所有人，包括自己） ,
     __allExceptSender （除了自己以外的所有人）,
     userid（指定id发给某人） ,
     __none （谁也不发，只有服务器会收到）,
     __allSuperUsers（只发给助教和老师）,
     __group:groupA:groupB(发送给指定组，组id不能包含冒号),
     __groupExceptSender:groupA（发给指定组，不包括自己）
     * @params params.data:信令携带的数据 , Json/JsonString
     * @params params.save:信令是否保存 , Boolean
     * @params params.expiresabs:暂时不用
     * @params params.associatedMsgID:绑定的父级信令id , String
     * @params params.associatedUserID:绑定的用户id , String
     * @params params.expires:暂时无效
     * @params params.type:扩展类型，目前只有count一种扩展类型，之后如需扩展可在此处进行相应变动 , String (目前直播才有用)
     * @params params.write2DB:暂时无效, Boolean (目前直播才有用)
     * @params params.actions:执行的动作操作列表，目前只有0，1 (0-不操作，1-代表增加操作), Array (目前直播才有用)
     * @params params.do_not_replace:老师和助教不能同时操作，后操作的服务器直接丢弃, Boolean (目前直播才有用)
     * 备注：指定用户会收到事件room-pubmsg
     * */
    pubMsg(params){
		L.Logger.debug('[whiteboarrd-sdk]pubMsg 	params :',params);
        if( this.room && this.room.pubMsg ){
            if( typeof params === 'string' ){
                params = JSON.parse( params ) ;
            }
            if( params.data && typeof params.data === 'object' && !Array.isArray(params.data) ){
                params.data = JSON.stringify(params.data);
            }
            this.room.pubMsg( params );
        }
    };

    /*发送DelMsg信令功能函数,删除之前发送的信令
     * @allParams params:delMsg需要的所有参数承接对象
     * @params msgName:信令名字 , String
     * @params msgId:信令ID , String
     * @params toId:发送给谁(默认发给所有人) , String
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
		L.Logger.debug('[whiteboarrd-sdk]delMsg params :',params);
        if( this.room && this.room.delMsg ){
            if( params.data && typeof params.data === 'object' && !Array.isArray(params.data) ){
                params.data = JSON.stringify(params.data);
            }
            this.room.delMsg( params );
        }
    };

    /*开始共享媒体文件*/
    startShareMedia( url , isVideo , toID , attrs = {} ){
		L.Logger.debug('[whiteboarrd-sdk]startShareMedia url  isVideo  toID  and  attrs:',url  ,isVideo  ,toID  ,attrs);
        this.stopShareMedia();
        this.stopShareLocalMedia();
        if( this.room && this.room.startShareMedia ){
            let whiteboardView = this.whiteboardViewMap.get('default') ;
            if(isVideo && whiteboardView && whiteboardView.getConfigration() && whiteboardView.getConfigration().mediaSharePauseWhenOver){
                attrs['pauseWhenOver'] = whiteboardView.getConfigration().mediaSharePauseWhenOver ;
            }
            if( whiteboardView && whiteboardView.getConfigration() && whiteboardView.getConfigration().myUserId !== undefined && !whiteboardView.getConfigration().synchronization ){
                toID = whiteboardView.getConfigration().myUserId ;
            }
            if( YS.SDKTYPE !== 'mobile'){
                this.room.startShareMedia( url , isVideo , (failinfo)=>{
                    L.Logger.warning('[whiteboard-sdk]startShareMedia fail , fail info:'+failinfo);
                } , {toID , attrs}  );
            }else{
                this.room.startShareMedia( url , isVideo ,  toID , attrs  );
            }
        }
    };

    /*停止共享媒体文件*/
    stopShareMedia(){
        L.Logger.debug('[whiteboarrd-sdk]stopShareMedia ');
        if(this.room && this.room.stopShareMedia){
            this.room.stopShareMedia();
        }
    };

    /*停止共享本地媒体文件*/
    stopShareLocalMedia(){
        if( YS.SDKTYPE !== 'mobile' && this.room && this.room.stopShareLocalMedia ){
            L.Logger.debug('[whiteboarrd-sdk]stopShareLocalMedia ');
            this.room.stopShareLocalMedia();
        }
    };

    /*创建音频播放器
    * @params parentNode:承放的节点
    * @params config:配置项*/
    createAudioPlayer( parentNode , config = {} ){
		L.Logger.debug('[whiteboarrd-sdk]createAudioPlayer parentNode and config :', parentNode , config);
        if(!window.RoadofAudioPlayer){
            L.Logger.error('The resource file for the audio player is not loaded and can\'t be executed with createAudioPlayer methods.');
            return ;
        }
        if( typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createAudioPlayer method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }
        let instanceId = 'default' ;
        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        let elementNode = parentNode || ( whiteboardView ? whiteboardView.getWhiteboardRootElement() : document.body ) ;
        if( this.audioPlayerView && this.audioPlayerView.destroyView){
            this.audioPlayerView.destroyView();
            this.audioPlayerView = undefined ;
        }
        this.audioPlayerView = new window.RoadofAudioPlayer( elementNode , instanceId , this  , Object.deepAssign({} , config , {
                languageType:whiteboardView ? whiteboardView.getConfigration().languageType : 'ch' ,
                isMobile:whiteboardView ? whiteboardView.getConfigration().isMobile : false  ,
            } , Configuration.commonWhiteboard ) , whiteboardView ? whiteboardView.getConfigration():undefined
        );
    };

    /*创建视频播放器
     * @params parentNode:承放的节点
     * @params config:配置项*/
    createVideoPlayer( parentNode , config = {} ){
		L.Logger.debug('[whiteboarrd-sdk]createVideoPlayer parentNode and config :', parentNode , config);
        if(!window.RoadofVideoPlayer){
            L.Logger.error('The resource file for the audio player is not loaded and can\'t be executed with createVideoPlayer methods.');
            return ;
        }
        if( typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createVideoPlayer method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }
        let instanceId = 'default' ;
        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        let elementNode = parentNode || ( whiteboardView ? whiteboardView.getWhiteboardRootElement() : document.body ) ;
        if( this.videoPlayerView && this.videoPlayerView.destroyView){
            this.videoPlayerView.destroyView();
            this.videoPlayerView = undefined ;
        }
        this.videoPlayerView = new window.RoadofVideoPlayer( elementNode , instanceId , this  , Object.deepAssign({} , config , {
                languageType:whiteboardView ? whiteboardView.getConfigration().languageType : 'ch' ,
                isMobile:whiteboardView ? whiteboardView.getConfigration().isMobile : false  ,
            } , Configuration.commonWhiteboard ) , whiteboardView ? whiteboardView.getConfigration():undefined
        );
    };

    /*创建课件备注视图
     * @params parentNode:承放的节点
     * @params config:配置项
     * @params instanceId:白板实例id  , String*/
    createDocumentRemark( parentNode , config = {}, instanceId ){
		L.Logger.debug('[whiteboarrd-sdk]createDocumentRemark parentNode and config :', parentNode , config);
        if(!window.RoadofDocumentRemark){
            L.Logger.error('The resource file for the document tool bar is not loaded and can\'t be executed with createDocumentRemark methods.');
            return ;
        }
        if( typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createDocumentRemark method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }

        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        let elementNode = parentNode || ( whiteboardView ? whiteboardView.getWhiteboardRootElement() : document.body ) ;
        if( this.documentRemarkViewList[instanceId] && this.documentRemarkViewList[instanceId].destroyView){
            this.documentRemarkViewList[instanceId].destroyView();
            // this.documentRemarkViewList[instanceId] = undefined ;
            delete this.documentRemarkViewList[instanceId];
        }
        this.documentRemarkViewList[instanceId] = new window.RoadofDocumentRemark(elementNode , instanceId , this , Object.deepAssign( {} , config , {
            languageType:whiteboardView ? whiteboardView.getConfigration().languageType : 'ch' ,
            isMobile:whiteboardView ? whiteboardView.getConfigration().isMobile : false  ,
            canRemark:whiteboardView ? whiteboardView.getConfigration().canRemark : false  ,
        } , Configuration.commonWhiteboard ) , whiteboardView ? whiteboardView.getConfigration():undefined );
        if( whiteboardView ){
            let whiteboardViewState = this.getWhiteboardViewState(instanceId);
            if( this.documentRemarkViewList[instanceId] && this.documentRemarkViewList[instanceId].receiveActionCommand && whiteboardViewState && Object.keys( whiteboardViewState.page ).length && Object.keys( whiteboardViewState.zoom ).length ){
                let action = 'viewStateUpdate' , cmd = {
                    viewState:whiteboardViewState ,
                    updateViewState:{} ,
                };
                this.documentRemarkViewList[instanceId].receiveActionCommand(action , cmd);
            }
        }
    };

    /*创建白板翻页工具条
     * @params parentNode:承放的节点
     * @params config:配置项
     * @params instanceId:白板实例id  , String*/
    createDocumentToolBar( parentNode , config = {}, instanceId = 'default' ){
		L.Logger.debug('[whiteboarrd-sdk]createDocumentToolBar parentNode and config :', parentNode , config);
        if(!window.RoadofDocumentToolbar){
            L.Logger.error('The resource file for the document tool bar is not loaded and can\'t be executed with createDocumentToolBar methods.');
            return ;
        }
        if( typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createDocumentToolBar method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }

        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        let elementNode = parentNode || ( whiteboardView ? whiteboardView.getWhiteboardRootElement() : document.body ) ;
        if( this.documentToolbarViewList[instanceId] && this.documentToolbarViewList[instanceId].destroyView){
            this.documentToolbarViewList[instanceId].destroyView();
            // this.documentToolbarViewList[instanceId] = undefined ;
            delete this.documentToolbarViewList[instanceId];
        }
        this.documentToolbarViewList[instanceId] = new window.RoadofDocumentToolbar(elementNode , instanceId , this , Object.deepAssign( {} , config , {
            languageType:whiteboardView ? whiteboardView.getConfigration().languageType : 'ch' ,
            isMobile:whiteboardView ? whiteboardView.getConfigration().isMobile : false  ,
            canRemark:whiteboardView ? whiteboardView.getConfigration().canRemark : false  ,
        } , Configuration.commonWhiteboard ) ,whiteboardView ? whiteboardView.getConfigration():undefined );
        if( whiteboardView ){
            let whiteboardViewState = this.getWhiteboardViewState(instanceId);
            if( this.documentToolbarViewList[instanceId] && this.documentToolbarViewList[instanceId].receiveActionCommand && whiteboardViewState && Object.keys( whiteboardViewState.page ).length && Object.keys( whiteboardViewState.zoom ).length ){
                let action = 'viewStateUpdate' , cmd = {
                    viewState:whiteboardViewState ,
                    updateViewState:{} ,
                };
                this.documentToolbarViewList[instanceId].receiveActionCommand(action , cmd);
            }
        }
    };


    /*获取白板视图状态
    * @params instanceId:白板实例id  , String*/
    getWhiteboardViewState(instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]getWhiteboardViewState ');
        let whiteboardView = this.whiteboardViewMap.get( instanceId ) ;
        if( whiteboardView ) {
            return whiteboardView.getWhiteboardViewState();
        }else{
            return undefined
        }
    }

    /*获取白板中间层*/
    getWhiteboardIntermediateLayerInstance(){
		L.Logger.debug('[whiteboarrd-sdk]getWhiteboardIntermediateLayerInstance ');
        return WhiteboardIntermediateLayerInstance ;
    }

    /*切换文档服务器
    * @params docAddressIndex:文档地址域名 String类型
    * @params isSaveLocalStorage:是否保存本地存储 ， 默认false
    * @params forceReloadDocument:是否强制重新加载文档 ， 默认false（即： 只有文档地址索引和当前索引不一致才会重新加载）
    * @params instanceId:白板实例id  , String
     * */
    switchDocAddress( docAddressKey , isSaveLocalStorage = false , forceReloadDocument = false, instanceId = 'default' ){
        L.Logger.debug('[whiteboarrd-sdk]call switchDocAddress method , docAddressKey is '+ docAddressKey);
        if( docAddressKey && typeof docAddressKey === 'string' ){
            Global.localStorageDocAddressKey = docAddressKey;
            if(Global.localStorageDocAddressKey && Utils.getItem(Global.docAddressList,Global.localStorageDocAddressKey) === '' && Utils.getItem(Global.laterAddressList,Global.localStorageDocAddressKey) === ''){
                if(Global.protocol && Global.port) {
                    Global.laterAddressList = [{protocol:Global.protocol,hostname:Global.localStorageDocAddressKey ,port:Global.port}];
                }
                Global.docAddressList =  [Global.docAddress,...Global.backupDocAddressList,...Global.laterAddressList] ;
            }
            if(  Global.docAddressKey !== docAddressKey ){
                let oldForceUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey);
                Global.docAddressKey = docAddressKey ;
                Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) || Configuration.commonWhiteboard.docAddress;
                if( isSaveLocalStorage ){
                    this.setLocalStorageItem( 'ysDocAddressKey' , Global.docAddressKey );
                }
                let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
                if( whiteboardView ){
                    whiteboardView.reloadCurrentDocument();
                    whiteboardView.sendActionCommand( 'docAddressUpdate' ,  {
                        docAddressList:[ ...Global.docAddressList ],
                        docAddressKey:Global.docAddressKey ,
                        oldDocAddress:oldForceUseDocAddress ,
                        nowDocAddress:Global.docAddressList[Global.docAddressKey] || Configuration.commonWhiteboard.docAddress
                    });
                }
            }else if( forceReloadDocument ){
                let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
                if( whiteboardView ){
                    whiteboardView.reloadCurrentDocument();
                }
            }
        }else if( forceReloadDocument ){
            let whiteboardView = this.whiteboardViewMap.get(instanceId) ;
            if( whiteboardView ){
                whiteboardView.reloadCurrentDocument();
            }
        }
    }

    /*设置本地存储*/
    setLocalStorageItem( key , value ){
        if( YS.SDKTYPE === 'mobile' ){
            if( this.room && Utils.isFunction( this.room.setLocalStorageItem ) ){
                this.room.setLocalStorageItem( key  ,  value ) ;
            }
        }else{
            Utils.setLocalStorageItem( key , value );
        }
    }

    /*获取本地存储*/
    getLocalStorageItem( key , callback ){
        if( Utils.isFunction( callback ) ){
            if( YS.SDKTYPE === 'mobile' ){
                if( this.room && Utils.isFunction( this.room.getLocalStorageItem ) ){
                    try{
                        this.room.getLocalStorageItem( key  , (docAddressKey) => {
                            callback( docAddressKey );
                        }) ;
                    }catch (e){
                        L.Logger.error('[whiteboard-sdk]getLocalStorageItem error:' , e);
                    }
                }
            }else{
                callback( Utils.getLocalStorageItem( 'ysDocAddressKey') );
            }
        }
    };
    /*执行保存的msglist数据
    * @params instanceId:白板实例id  , String*/
    _executeSaveMsglistData(instanceId) {
        if (this.saveMsglistData[instanceId] && this.whiteboardViewMap.get(instanceId)) {
            this.saveMsglistData[instanceId].forEach((pubmsgData,index)=>{
                this.whiteboardViewMap.get(instanceId).receiveEventRoomMsglist(pubmsgData.name, pubmsgData);
            });
            delete this.saveMsglistData[instanceId];
        }
    }
    /*执行保存的pubmsg数据
    * @params instanceId:白板实例id  , String*/
    _executeSavePubmsgData(instanceId) {
        if (this.savePubmsgData[instanceId] && this.whiteboardViewMap.get(instanceId)) {
            this.savePubmsgData[instanceId].forEach((recvEventData,index)=>{
                this.whiteboardViewMap.get(instanceId).receiveEventRoomPubmsg(recvEventData);
            });
            delete this.savePubmsgData[instanceId];
        }
    }

    /*创建白板
     * @params parentNode:白板的父节点 , 默认为 document.body ， ElementNode
     * @params instanceId:白板实例id , 默认为'default' , String
     * @params configration:白板配置项 , 默认为{} ,  Json
     * @params receiveActionCommand:接受白板动作指令函数 , Function
    * */
    _createWhiteboard( parentNode = document.body ,  instanceId = 'default',  configration = {} , receiveActionCommand ){
		L.Logger.debug('[whiteboarrd-sdk]_createWhiteboard  parentNode  instanceId  configration  and	receiveActionCommand:',parentNode , instanceId , configration  ,receiveActionCommand);
        if( typeof parentNode === 'string'){
            let parentNodeStr = parentNode ;
            parentNode = document.getElementById( parentNodeStr );
            if(!parentNode){
                L.Logger.warning('The node id cannot be found by node id, and createWhiteboard method cannot be performed , element id is '+parentNodeStr+'.');
                return ;
            }
        }
        this.pureWhiteboardFileinfoList[instanceId] = {
            "fileid": 0 ,
            "companyid": '' ,
            "filename": 'whiteboard' ,
            "uploaduserid": '' ,
            "uploadusername":'' ,
            "downloadpath": '' ,
            "swfpath": '',
            "filetype": 'whiteboard' ,
            "pagenum": 1 ,
            "dynamicppt": 0 ,
            "filecategory": 0 ,
            "fileprop": 0 , //0：普通文档 ， 1-2：动态ppt(1-旧版，2-新版) ， 3：h5文档
        };
        let defaultWhiteboard = undefined ;
        if( this.awitWhiteboardConfigrationMap.has(instanceId) ){
            defaultWhiteboard = this.awitWhiteboardConfigrationMap.get(instanceId) ;
            this.awitWhiteboardConfigrationMap.delete(instanceId);
        }else{
            defaultWhiteboard = Object.deepAssign( {} , Configuration.defaultWhiteboard , Configuration.commonWhiteboard ) ;
        }
        let whiteboardViewConfigration = Object.deepAssign({} , defaultWhiteboard, configration);
        if( this.whiteboardViewMap.has(instanceId) ){
            this._destroyWhiteboard(instanceId);
        }
        this.whiteboardViewMap.set(instanceId , new WhiteboardView( parentNode , instanceId , whiteboardViewConfigration , (...args) => {
            if(typeof receiveActionCommand === 'function'){
                receiveActionCommand(...args);
            }
        } , this ) ) ;
        Utils.onElementResize(parentNode,()=>{
            this.updateWhiteboardSize(instanceId);
        });
    };

    /*销毁白板
    * @params instanceId:白板实例id  , String*/
    _destroyWhiteboard( instanceId = 'default'){
		L.Logger.debug('[whiteboarrd-sdk]_destroyWhiteboard    instanceId  :',instanceId );
        if( this.whiteboardViewMap.has(instanceId) ){
            this.whiteboardViewMap.get(instanceId).destroyWhiteboardView();
            this.whiteboardViewMap.delete(instanceId);
        }
        if( this.awitWhiteboardConfigrationMap.has(instanceId) ){
            this.awitWhiteboardConfigrationMap.delete(instanceId);
        }
    };

    /*是否是白板相关信令*/
    _isWhiteboardCorrelationSignalling(name){
		L.Logger.debug('[whiteboarrd-sdk]_isWhiteboardCorrelationSignalling    name  :',name );
        let isWhiteboardCorrelationSignalling = false ;
        switch (name){
            // case 'SharpsChange':
            case 'ShowPage':
            case 'ExtendShowPage':
            // case 'WBPageCount':
            // case 'ExtendWBPageCount':
            case 'NewPptTriggerActionClick':
            case 'ExtendNewPptTriggerActionClick':
            case 'PptVolumeControl':
            case 'ExtendPptVolumeControl':
            case 'H5DocumentAction':
            case 'ExtendH5DocumentAction':
            case 'whiteboardMarkTool':
            case 'ExtendWhiteboardMarkTool':
            // case 'VideoWhiteboard':
            // case 'BlackBoard':
                isWhiteboardCorrelationSignalling = true ;
                break;
        }
        return isWhiteboardCorrelationSignalling ;
    };

    /*窗口改变事件处理方法*/
    _windowResizeCallback(){
		L.Logger.debug('[whiteboarrd-sdk]_windowResizeCallback ' );
        this.updateAllWhiteboardSize();
        setTimeout(()=>{
            this.updateAllWhiteboardSize();
            setTimeout(()=>{
                this.updateAllWhiteboardSize();
            },250);
        },50);
        return false ;
    };

    /*收到iframe的消息处理方法*/
    _windowMessageCallback(event){
		L.Logger.debug('[whiteboarrd-sdk]_windowMessageCallback');
        event = event || window.event ;
        for (let whiteboardView of this.whiteboardViewMap.values()) {
            whiteboardView.receiveWindowMessageEvent( event ) ;
        }
        for(let documentToolbarView of Object.values(this.documentToolbarViewList)){
            if (documentToolbarView) {
                documentToolbarView.receiveWindowMessageEvent( event ) ;
            }
        }
        return false;
    };

    /*键盘按下事件*/
    _documentKeydownCallback( event ){
		L.Logger.debug('[whiteboarrd-sdk]_documentKeydownCallback');
        event = event || window.event ;
        switch (event.keyCode){
            case 27: //ESC键
                if( Utils.isFullScreenStatus() ){
                    Utils.exitFullscreen();
                }
                break;
        }
        let _pageDeyDown = ()=>{
            if (!Global.isSkipPageing && this.whiteboardViewMap.has('default')) {
                if (this.whiteboardViewMap.get('default').getConfigration().isUseKeyboardPage) {
                    if (!this.whiteboardViewMap.get('default').isWhiteboardTextEditing()) {
                        switch (event.keyCode) {
                            case 37:
                                //左键
                                this.whiteboardViewMap.get('default').prevPage();
                                break;
                            case 38:
                                //上键
                                this.whiteboardViewMap.get('default').prevStep();
                                break;
                            case 39:
                                //右键
                                this.whiteboardViewMap.get('default').nextPage();
                                break;
                            case 40:
                                //下键
                                this.whiteboardViewMap.get('default').nextStep();
                                break;
                        }
                    }
                }
            }
        };
        clearTimeout(this.documentKeydownTimer);
        if(this.documentKeydownDateTime && new Date().getTime() - this.documentKeydownDateTime > 500){
            _pageDeyDown();
        }else{
            this.documentKeydownTimer = setTimeout(()=>{
                _pageDeyDown();
            },300);
        }
        this.documentKeydownDateTime = new Date().getTime();
        return false;
    }

    _documentFullscreenchangeCallback( event ){
		L.Logger.debug('[whiteboarrd-sdk]_documentFullscreenchangeCallback');
        for (let whiteboardView of this.whiteboardViewMap.values()) {
            if( Utils.isFullScreenStatus() ){
                let fullScreenElement = whiteboardView.getWhiteboardRootElement() ;
                let { fullScreenElementId } =  whiteboardView.getConfigration().documentToolBarConfig ;
                if( fullScreenElementId ){
                    if( typeof  fullScreenElementId === 'string' ){
                        if( document.getElementById( fullScreenElementId ) ){
                            fullScreenElement = document.getElementById( fullScreenElementId ) ;
                        }
                    }else{
                        fullScreenElement = fullScreenElementId ;
                    }
                }
                if( Utils.getFullscreenElement() && Utils.getFullscreenElement().id === fullScreenElement.id ){
                    whiteboardView.changeFullScreenState( true );
                }else{
                    whiteboardView.changeFullScreenState( false );
                }
            }else{
                whiteboardView.changeFullScreenState( false );
            }
        }
        if( this.videoPlayerView && this.videoPlayerView.receiveEventFullScreenChange ){
            this.videoPlayerView.receiveEventFullScreenChange( event );
        }
        this.updateAllWhiteboardSize();
        setTimeout(()=>{
            this.updateAllWhiteboardSize();
            setTimeout(()=>{
                this.updateAllWhiteboardSize();
            },250);
        },50);
        return false ;
    }

    /*注册事件*/
    _registerEvent(){
		L.Logger.debug('[whiteboarrd-sdk]_registerEvent');
        /*处理兼容性，监听浏览器窗口是否课件（最小化）*/
        const _getVisibilityChangeCompatibility =  () => {
            let hidden, state, visibilityChange;
            if (typeof document.hidden !== "undefined") {
                hidden = "hidden";
                visibilityChange = "visibilitychange";
                state = "visibilityState";
            } else if (typeof document.mozHidden !== "undefined") {
                hidden = "mozHidden";
                visibilityChange = "mozvisibilitychange";
                state = "mozVisibilityState";
            } else if (typeof document.msHidden !== "undefined") {
                hidden = "msHidden";
                visibilityChange = "msvisibilitychange";
                state = "msVisibilityState";
            } else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
                state = "webkitVisibilityState";
            }
            return {hidden, state, visibilityChange};
        };

        Utils.addEvent( window , 'resize' , this._windowResizeCallback.bind(this) );
        Utils.addEvent( window , 'message' , this._windowMessageCallback.bind(this) );
        Utils.addEvent( document , 'keyup' , this._documentKeydownCallback.bind(this) );//todo 扩展白板如果响应键盘事件有问题
        Utils.addFullscreenchange( this._documentFullscreenchangeCallback.bind(this) );
        let {state, visibilityChange} = _getVisibilityChangeCompatibility();
        Utils.addEvent(document , visibilityChange, () => {
            if (document[state] === 'visible') {
                this.updateAllWhiteboardSize();
                setTimeout(()=>{
                    this.updateAllWhiteboardSize();
                    setTimeout(()=>{
                        this.updateAllWhiteboardSize();
                    },250);
                },50);
                return false;
            }
        }, false ); //监听浏览器窗口是否可见（最小化）
    };

    /*监听房间的事件*/
    _addRoomEvent(){
		L.Logger.debug('[whiteboarrd-sdk]_addRoomEvent');
        if( this.room ){
            if( this.room.removeBackupListerner ){
                this.room.removeBackupListerner( this.listernerBackupid );
            }
            this.room.addEventListener( 'room-receiveActionCommand' , this.reveiveEventRoomReceiveActionCommand.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-pubmsg' , this.receiveEventRoomPubmsg.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-delmsg' , this.receiveEventRoomDelmsg.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-connected' , this.receiveEventRoomConnected.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-disconnected' , this.receiveEventRoomDisconnected.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-msglist' , this.receiveEventRoomMsglist.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-usermediastate-changed' , this.reveiveEventRoomUsermediaorfilestateChanged.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-userfilestate-changed' , this.reveiveEventRoomUsermediaorfilestateChanged.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-usermediaattributes-update' , this.reveiveEventRoomUsermediaorfileattributesUpdate.bind(this) , this.listernerBackupid );
            this.room.addEventListener( 'room-userfileattributes-update' , this.reveiveEventRoomUsermediaorfileattributesUpdate.bind(this) , this.listernerBackupid );
            this.room.addEventListener('room-error-notice', this.receiveEventRoomErrorNotice.bind(this), this.listernerBackupid );
        }
    }

    /*转发流的相关事件*/
    _forwardingStreamEvents( handlerName , recvEventData){
		L.Logger.debug('[whiteboarrd-sdk]_forwardingStreamEvents handlerName and recvEventData:', handlerName , recvEventData);
        if( this.audioPlayerView &&  this.audioPlayerView[handlerName] && Utils.isFunction( this.audioPlayerView[handlerName] ) ){
            this.audioPlayerView[handlerName](recvEventData);
        }
        if( this.videoPlayerView &&  this.videoPlayerView[handlerName] && Utils.isFunction( this.videoPlayerView[handlerName] )  ){
            this.videoPlayerView[handlerName](recvEventData);
        }
    }

};

let filterYSWhiteBoardManagerInnerArr = [
    'createMainWhiteboard', 'destroyMainWhiteboard', 'createExtendWhiteboard', 'destroyExtendWhiteboard',
    'changeWhiteBoardConfigration', 'addPage', 'nextPage', 'prevPage', 'skipPage',
    'nextStep', 'prevStep', 'enlargeWhiteboard', 'narrowWhiteboard', 'clear', 'undo', 'redo', 'fullScreen',
    'exitFullScreen', 'resetWhiteboardData', 'updateWhiteboardSize', 'updateAllWhiteboardSize',
    'resetAllWhiteboardData', 'resetPureWhiteboardTotalPage', 'changeDynamicPptVolume', 'openDocumentRemark',
    'closeDocumentRemark', 'getWhiteboardIntermediateLayerInstance', 'changeCommonWhiteBoardConfigration',
    'registerRoomDelegate', 'changeDocument' , 'stopShareLocalMedia' ,'switchDocAddress' ,'getVersion',
    'openRemoteDocument','noticeWhiteboardActionCommand'
] ;
let filterYSWhiteBoardManagerOuterArr = [
    'createMainWhiteboard', 'destroyMainWhiteboard', 'changeDocument', 'changeWhiteBoardConfigration',
    'addPage', 'nextPage', 'prevPage', 'skipPage', 'nextStep', 'prevStep',
    'enlargeWhiteboard', 'narrowWhiteboard', 'clear', 'undo', 'redo', 'fullScreen', 'exitFullScreen',
    'resetWhiteboardData','registerRoomDelegate','changeCommonWhiteBoardConfigration','getVersion',
    'openRemoteDocument','noticeWhiteboardActionCommand'
] ;

function YSWhiteBoardManager(room , sdkReceiveActionCommand,  isInner ) {
    let that = {};
    that.className = 'YSWhiteBoardManager' ; //类的名字

    let YSWhiteBoard = new YSWhiteBoardManagerInner(room , sdkReceiveActionCommand, isInner);
    let filterYSWhiteBoardManager = isInner?filterYSWhiteBoardManagerInnerArr:filterYSWhiteBoardManagerOuterArr;
    for(let methodName of filterYSWhiteBoardManager){
        that[methodName] = (...args) => {
            return YSWhiteBoard[methodName](...args);
        }
    }
    return that ;
}

window.YSWhiteBoardManager = YSWhiteBoardManager ;
export { YSWhiteBoardManager };
export default YSWhiteBoardManager ;