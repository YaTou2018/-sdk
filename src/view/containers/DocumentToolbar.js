/* 文档翻页等工具条
 * @module RoadofDocumentToolbar
 * @description  sdk白板文档翻页等工具条
 * @author 邱广生
 * @date 2018-04-25
 */
'use strict';
import RoadofcloudReact from '../components/RoadofcloudReact';
import DomUtils from '../../utils/DomUtils';
import Utils from '../../utils/Utils';
import SelectDumb from '../components/Select' ;
import RoadofLanguage from '../../utils/Language';
import Global from '../../utils/Global';

class RoadofDocumentToolbar extends RoadofcloudReact{
    constructor( parentNode  = document.body , instanceId = 'default', whiteBoardManagerInstance ,  props = {} , configration = {} ){
        super(props);
        this.parentNode = parentNode ;
        this.instanceId = instanceId ;
        this.whiteBoardManagerInstance = whiteBoardManagerInstance ;
        this.configration = configration ;
        this.elements = {};
        this.elementsViewClass = {};
        this.documentToolbarRoadofDrag = undefined ; //拖拽实例
        this.state = {
            updateState:false ,
            dynamicPptAVSize:0 , //动态PPT音视频的个数
            tempDisabledDrag: false , //是否临时禁用拖拽
            viewState: {
                tool: {}, //白板标注工具信息
                action: {}, //撤销、恢复、清空信息
                zoom: {}, //方法缩小信息
                page: {},  //翻页信息
                documentType:'generalDocument', //打开的文件类别，generalDocument（普通文档）、dynamicPPT（动态PPT）、h5Document(H5课件)
                fileid: 0 , //打开的文档的文件id
                dynamicPptVolume: 100 , //动态PPT文档的音量
                fullScreen: false , //是否全屏
                remark: false, //是否开启文档备注
                remarkText:'' , //当前页文档备注的文本内容
                other: { //其它信息
                    primaryColor: this.configration.primaryColor ,  //画笔颜色 ,默认 #000000
                    secondaryColor:this.configration.secondaryColor ,  //填充颜色 ,默认 #ffffff
                    backgroundColor: 'none' || this.configration.backgroundColor ,   //背景颜色 ,默认 #ffffff
                    pencilWidth:this.configration.pencilWidth , //画笔大小 , 默认5
                    shapeWidth:this.configration.shapeWidth, //图形画笔大小 , 默认5
                    eraserWidth:this.configration.eraserWidth, //橡皮大小 ， 默认15
                    fontSize:this.configration.fontSize , //字体大小 ， 默认18
                    fontFamily:this.configration.fontFamily , //使用的字体 ，默认"微软雅黑"
                }
            }
        };
        this._createConnectElements();
        this._updateSelectInfo();
        this._updateLanguage();
        this.render();
    }

    componentDidUpdateState( prevState ){
        if(prevState.viewState !== this.state.viewState ){
            let currentPageCompare =  prevState.viewState.page.currentPage === this.state.viewState.page.currentPage ;
            let totalPageCompare =   prevState.viewState.page.totalPage === this.state.viewState.page.totalPage ;
            let skipPageCompare = prevState.viewState.page.skipPage &&  this.state.viewState.page.skipPage ?
                Utils.deepCompareJson( prevState.viewState.page.skipPage , this.state.viewState.page.skipPage ) :
                prevState.viewState.page.skipPage === this.state.viewState.page.skipPage;

            if( !currentPageCompare || !totalPageCompare || !skipPageCompare ){
                this._isShowRemarkBtn();
                this._updateSelectInfo();
            }

            if( prevState.viewState.fileid != this.state.viewState.fileid ||  prevState.viewState.remarkText !== this.state.viewState.remarkText ){
                this._isShowRemarkBtn();
            }

            if( prevState.viewState.dynamicPptVolume !== this.state.viewState.dynamicPptVolume ){
                if( !this.pageVolumeSlidering && this.pageVolumeSlider && typeof this.pageVolumeSlider.setProgress === 'function' ){
                    this.pageVolumeSlider.setProgress( this.state.viewState.dynamicPptVolume );
                }
            }
        }
        if( prevState.tempDisabledDrag !== this.state.tempDisabledDrag ){
            if( this.documentToolbarRoadofDrag && typeof this.documentToolbarRoadofDrag.updateDisabled ){
                this.documentToolbarRoadofDrag.updateDisabled( this.state.tempDisabledDrag );
            }
        }

        if( prevState.viewState.documentType !== this.state.viewState.documentType ||   prevState.viewState.fullScreen !== this.state.viewState.fullScreen ||   prevState.viewState.remark !== this.state.viewState.remark ){
            this._updateLanguage();
        }

        if( prevState.updateState !== this.state.updateState  ){
            this._isShowRemarkBtn();
        }

    };

    componentDidUpdateProps( prevProps ){
        if( prevProps.languageType !== this.props.languageType ){
            this._updateLanguage();
        }
        if( prevProps.isMobile !== this.props.isMobile ){
            this.elements.skipPageCurrpageElement.setAttribute('contenteditable',!this.props.isMobile);
            if( this.props.isMobile ){
                DomUtils.addClass( this.elements.documentToolbarViewRootElement , 'app-mobile')
            }else{
                DomUtils.removeClass( this.elements.documentToolbarViewRootElement , 'app-mobile')
            }
            if( this.elementsViewClass.selectPageView ){
                this.elementsViewClass.selectPageView.setProps({
                    isMobile:this.props.isMobile
                })
            }
        }
        if( prevProps.isDrag !== this.props.isDrag ){
            if( this.props.isDrag  ){
                this._addRoadofDrag() ;
            }else{
                if( this.documentToolbarRoadofDrag && typeof this.documentToolbarRoadofDrag.destroy === 'function' ){
                    this.documentToolbarRoadofDrag.destroy();
                    this.documentToolbarRoadofDrag = undefined ;
                }
            }
        }
        if(  !Utils.deepCompareJson( prevProps.initDragPosition , this.props.initDragPosition  )  ){
            if( this.documentToolbarRoadofDrag && typeof this.documentToolbarRoadofDrag.setPosition === 'function' ){
                let { left = 50 , top = 100 } = this.props.initDragPosition || {} ;
                this.documentToolbarRoadofDrag.setPosition(left , top) ;
            }
        }

        if( ( prevProps.isLoadRemark !== this.props.isLoadRemark || prevProps.canRemark !== this.props.canRemark ) && this.elements.remarkElement){
            this._isShowRemarkBtn();
        }

        if( prevProps.isLoadFullScreen !== this.props.isLoadFullScreen  && this.elements.fullScreenElement){
            DomUtils.updateStyle(this.elements.fullScreenElement   , {
                display: !this.props.isLoadFullScreen ? 'none' : ''
            });
        }

    };

    /*重新计算大小*/
    resize(){
        if( this.documentToolbarRoadofDrag && Utils.isFunction( this.documentToolbarRoadofDrag.resizeCallback ) ){
            this.documentToolbarRoadofDrag.resizeCallback();
        }
    }

    /*强制render*/
    forceRender(){
        this.setState({
            updateState:!this.state.updateState
        });
    }

    /*改变父亲节点*/
    changeParentNode( parentNode ){
        if( parentNode ){
            DomUtils.removeChild( this.elements.documentToolbarViewRootElement  , this.parentNode );
            this.parentNode = parentNode ;
            DomUtils.appendChild( this.parentNode , this.elements.documentToolbarViewRootElement );
        }
    }

    /*销毁视图*/
    destroyView(){
        for(let view of Object.values( this.elementsViewClass ) ){
            if( view && view.destroyView ){
                view.destroyView();
            }
        }
        this.elementsViewClass = {} ;
        DomUtils.removeChild(this.elements.documentToolbarViewRootElement , this.parentNode );
        for(let key in this.elements){
            this.elements[key] = undefined ;
            delete this.elements[key] ;
        }
    }

    /*接收动作指令*/
    receiveActionCommand(action , cmd){
        if( typeof cmd === 'object' && !Array.isArray(cmd) ){
            cmd = Object.deepAssign({} , cmd);
        }
        L.Logger.debug( '[DocumentToolbar]receive whiteboard view action command（action,cmd）:' , action , cmd );
        switch (action){
            case 'closeAllSelectBox':
                DomUtils.removeClass( this.elements.volumeElement  , 'open' );
                break;
            case 'viewStateUpdate':
                this.setState({
                    viewState: cmd.viewState
                });
                break;
        }
    }

    /*改变选中的页数*/
    changeSelectPageOnChange(currpage){
        this.skipPage( currpage );
    }

    /*Select是否显示下拉框*/
    changeSelectPageNoticeSelectExtendListShowOrHide(show){
        this.setState({
            tempDisabledDrag: show  //临时禁止拖拽
        })
    };

    /*上一页或者上一帧*/
    prevPage(){
        let { documentType } = this.state.viewState ;
        switch ( documentType ){
            case 'dynamicPPT':
                if( this.whiteBoardManagerInstance ){
                    this.whiteBoardManagerInstance.prevStep(this.instanceId);
                }
                break ;
            default:
                if( this.whiteBoardManagerInstance ){
                    this.whiteBoardManagerInstance.prevPage(this.instanceId);
                }
                break;
        }
        return false ;
    };

    /*下一页或者下一帧*/
    nextPage(){
        let { documentType } = this.state.viewState ;
        switch ( documentType ){
            case 'dynamicPPT':
                if( this.whiteBoardManagerInstance ){
                    this.whiteBoardManagerInstance.nextStep(this.instanceId);
                }
                break ;
            default:
                if( this.whiteBoardManagerInstance ){
                    this.whiteBoardManagerInstance.nextPage(this.instanceId);
                }
                break;
        }
        return false ;
    };

    /*白板加页*/
    addPage(){
        if( this.whiteBoardManagerInstance ){
            this.whiteBoardManagerInstance.addPage(this.instanceId);
        }
        return false ;
    };

    /*全屏功能*/
    fullScreen(){
        if( this.whiteBoardManagerInstance ){
            if( !this.state.viewState.fullScreen ){
                this.whiteBoardManagerInstance.fullScreen(this.instanceId);
            }else{
                this.whiteBoardManagerInstance.exitFullScreen(this.instanceId);
            }
        }
        return false ;
    }

    openDynamicPptVolumeOnClick(){
        if( DomUtils.hasClass( this.elements.volumeElement , 'open' ) ){
            DomUtils.removeClass( this.elements.volumeElement  , 'open' );
        }else{
            DomUtils.addClass( this.elements.volumeElement  , 'open' );
        }
        return false ;
    }

    closeDynamicPptVolumeOnMouseLeave(){
        DomUtils.removeClass( this.elements.volumeElement  , 'open' );
        return false ;
    }

    /*开启或者关闭课件备注*/
    openOrCloseRemarkOnClick(){
        let { remark } = this.state.viewState ;
        if( this.whiteBoardManagerInstance ){
            if( !remark ){
                this.whiteBoardManagerInstance.openDocumentRemark(this.instanceId);
            }else{
                this.whiteBoardManagerInstance.closeDocumentRemark(this.instanceId);
            }
        }
    }

    /*动态PPT音量改变*/
    changeDynamicPptVolume(volume){
        if( this.whiteBoardManagerInstance && typeof this.whiteBoardManagerInstance.changeDynamicPptVolume === 'function' ){
            this.whiteBoardManagerInstance.changeDynamicPptVolume( volume, this.instanceId);
        }
    };

    /*跳到指定页*/
    skipPage( toPage ){
        toPage = Number( toPage ) ;
        if( typeof toPage === 'number' ){
            if( this.whiteBoardManagerInstance ){
                this.whiteBoardManagerInstance.skipPage( toPage, this.instanceId);
            }
        }
        return false ;
    };

    /*发送动作指令
    * XXX 此处直接获取了主白板实例且直接操作了主白板的方法*/
    sendActionCommand( action , cmd ){
        if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.whiteboardViewMap
            && this.whiteBoardManagerInstance.whiteboardViewMap.has(this.instanceId) ){
            let whiteboardView = this.whiteBoardManagerInstance.whiteboardViewMap.get( this.instanceId ) ;
            if( whiteboardView && whiteboardView.sendActionCommand ){
                whiteboardView.sendActionCommand( action , cmd );
            }
        }
    };

    /*正在跳转页数中*/
    changePageOnFocus(event){
        Global.isSkipPageing = true ;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    }

    changePageOnClick(){
        this.elements.skipPageCurrpageElement.setAttribute('contenteditable',!this.props.isMobile);
        this.elements.skipPageCurrpageElement.focus(); //TODO 支详为什么要加上失去焦点？
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    }

    /*失去焦点执行翻页*/
    changePageOnBlur(event){
        Global.isSkipPageing = false ;
        this._changePage();
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    };

    /*回车键执行翻页*/
    changePageOnKeyDown( event ){
        switch ( event.keyCode ){
            case 13:
                if(this.elements.skipPageCurrpageElement && typeof this.elements.skipPageCurrpageElement.blur === 'function'){
                    this.elements.skipPageCurrpageElement.setAttribute('contenteditable',false);
                    this.elements.skipPageCurrpageElement.blur();
                }else{
                    this._changePage();
                }
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return false ;
                break;
        }
    }

    /*放大文档*/
    enlargeWhiteboard(){
        if( this.whiteBoardManagerInstance ){
            this.whiteBoardManagerInstance.enlargeWhiteboard(this.instanceId);
        }
        return false ;
    };

    /*缩小文档*/
    narrowWhiteboard(){
        if( this.whiteBoardManagerInstance ){
            this.whiteBoardManagerInstance.narrowWhiteboard(this.instanceId);
        }
        return false ;
    };

    /*接收动态PPT的iframe消息*/
    receiveWindowMessageEvent(event){
        // 通过origin属性判断消息来源地址
        let whiteboardView = {};
        if (this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.whiteboardViewMap.has(this.instanceId)) {
            whiteboardView = this.whiteBoardManagerInstance.whiteboardViewMap.get(this.instanceId);
        }
        if( event.data ){
            let data = undefined;
            let recvData = undefined ;
            try{
                recvData =  JSON.parse(event.data) ;
                data = recvData.data ;
            }catch (e){
                L.Logger.warning(  "document tool bar receive iframe message data can't be converted to JSON , iframe data:" , event.data ) ;
                return ;
            }
            if(recvData.source === "ys_dynamicPPT" && whiteboardView.getDynamicPptInstanceByID && typeof whiteboardView.getDynamicPptInstanceByID === "function") {
                //判断消息来源是否是当前实例id对应的iframe
                if (whiteboardView.getDynamicPptInstanceByID().dynamicPptIframeElement
                    && event.source === whiteboardView.getDynamicPptInstanceByID().dynamicPptIframeElement.contentWindow) {
                    L.Logger.debug("[document tool bar]receive remote iframe data form "+ event.origin +":",  event );
                    const ALLVIDEOANDAUDIO = "allVideoAndAudio";
                    switch (data.action) {
                        case ALLVIDEOANDAUDIO:
                            this.setState({
                                dynamicPptAVSize:data.allVideoAndAudioLength !== undefined ? data.allVideoAndAudioLength : 0
                            });
                            break;
                    };
                }
            }
        }
    }

    /*停止事件*/
    stopEvent( event ){
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    }


    /*改变页数*/
    _changePage(){
        let toPage = Number( this.elements.skipPageCurrpageElement.innerHTML );
        let { page = {} } = this.state.viewState ;
        let { totalPage = 1 , currentPage = 1 } = page ;
        if( typeof toPage === 'number' && !isNaN(toPage) ){
            if( toPage === currentPage ){
                return ;
            }
            if( toPage < 1  ||  toPage >  totalPage ){
                let action = 'skipPageFailureBouncedNotice' ;
                let cmd = {
                    type:'overPageRange' ,
                    currentPage ,
                    totalPage ,
                    toPage ,
                };
                this.sendActionCommand( action , cmd );
                this.elements.skipPageCurrpageElement.innerHTML = currentPage ;
            }else{
                this.skipPage( toPage );
            }
        }else{
            let action = 'skipPageFailureBouncedNotice' ;
            let cmd = {
                type:'pageTypeNotNumber' ,
                currentPage ,
                totalPage ,
                toPage: this.elements.skipPageCurrpageElement.innerHTML ,
            };
            this.sendActionCommand( action , cmd );
            this.elements.skipPageCurrpageElement.innerHTML = currentPage ;
        }
    }

    /*创建所需节点*/
    _createConnectElements(){
        const that = this ;
        this.elements.documentToolbarViewRootElement = DomUtils.createElement('article' , this.instanceId+'DocumentToolViewRoot' , 'roadofcloud-sdk-whiteboard '+ this.instanceId+' document-toolbar-root '+( this.props.isMobile ? 'app-mobile ' : ' ' ) , {
            zIndex:5
        }); //翻页工具根节点

        this.elements.previousPageElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudPreviousPage' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn previous-page-btn' , {
        }); //上一页或者上一帧节点

        this.elements.skipPageElement =  DomUtils.createElement('div' , this.instanceId+'RoadofcloudSkipPage' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-select skip-page-select' , {
        }); //skip到某一页的容器节点

        this.elements.nextPageElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudNextPage' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn next-page-btn' , {

        }); //下一页或者下一帧节点

        this.elements.addPageElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudAddPage' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn add-page-btn' , {
            display:'none' ,
        }); //加页节点

        this.elements.fullScreenElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudFullScreen' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn full-screen-btn' , {
            display: !this.props.isLoadFullScreen ? 'none' : ''
        }); //全屏节点

        this.elements.volumeElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudVolume' ,  'roadofcloud-sdk-whiteboard '+ this.instanceId+' document-toolbar-btn volume-btn' , {
            display: !this.props.isLoadVolume ? 'none' : ''
        }); //音量节点

        this.elements.remarkElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudRemark' ,  'roadofcloud-sdk-whiteboard '+ this.instanceId+' document-toolbar-btn remark-btn' , {
            display: !this.props.isLoadRemark || !this.props.canRemark ? 'none' : ''
        }); //备注节点

        this.elements.enlargeWhiteboardElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudZoomBig' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn zoom-big-btn' , {
        }); //放大节点

        this.elements.narrowWhiteboardElement =  DomUtils.createElement('button' , this.instanceId+'RoadofcloudZoomSmall' ,  'roadofcloud-sdk-whiteboard  '+ this.instanceId+' document-toolbar-btn zoom-small-btn' , {
        }); //缩小节点

        this.elements.volumeElement.innerHTML = `
            <span class="volume-slider-container" onclick="return false;" id="${this.instanceId}PageVolumeSlider" ></span>
        ` ;

        this.elements.skipPageElement.innerHTML = `
            <div class="page-info-container" > 
                <span contenteditable="${!this.props.isMobile}" class="curr-page">1</span><em>/</em><span class="total-page">1</span>
            </div>
        `;

        this.elements.skipPageCurrpageElement = this.elements.skipPageElement.getElementsByClassName('curr-page')[0];
        this.elements.skipPageTotalpageElement = this.elements.skipPageElement.getElementsByClassName('total-page')[0];
        /*修复bug roadof-5246,输入框做限制,徐志宏 2018-10-31*/
        this.elements.skipPageCurrpageElement.oninput=function (e) {
            var value = e.target.innerHTML;
            if(!Number(value) || value.length > 5){
                e.target.innerHTML = value.substr(0,5)
                return;
            }
        }
        this.elements.skipPageCurrpageElement.onclick = this.changePageOnClick.bind(this);
        this.elements.skipPageCurrpageElement.onfocus = this.changePageOnFocus.bind(this);
        this.elements.skipPageCurrpageElement.onblur = this.changePageOnBlur.bind(this);
        this.elements.skipPageCurrpageElement.onkeydown = this.changePageOnKeyDown.bind(this);
        this.elements.previousPageElement.onclick = this.prevPage.bind(this);
        this.elements.nextPageElement.onclick = this.nextPage.bind(this);
        this.elements.addPageElement.onclick = this.addPage.bind(this);
        this.elements.fullScreenElement.onclick = this.fullScreen.bind(this);
        this.elements.volumeElement.onclick = this.openDynamicPptVolumeOnClick.bind(this);
        this.elements.volumeElement.getElementsByClassName('volume-slider-container')[0].onclick = this.stopEvent.bind(this);
        this.elements.volumeElement.onmouseleave = this.closeDynamicPptVolumeOnMouseLeave.bind(this);
        this.elements.remarkElement.onclick = this.openOrCloseRemarkOnClick.bind(this);
        this.elements.enlargeWhiteboardElement.onclick = this.enlargeWhiteboard.bind(this);
        this.elements.narrowWhiteboardElement.onclick = this.narrowWhiteboard.bind(this);

        this.elementsViewClass.selectPageView = new SelectDumb(this.elements.skipPageElement , {
            parentNode:this.parentNode ,
            isMobile:this.props.isMobile ,
            onChange:this.changeSelectPageOnChange.bind(this) ,
            noticeSelectExtendListShowOrHide:this.changeSelectPageNoticeSelectExtendListShowOrHide.bind(this) ,
        });

        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.previousPageElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.skipPageElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.nextPageElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.addPageElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.enlargeWhiteboardElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.narrowWhiteboardElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.fullScreenElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.volumeElement ) ;
        DomUtils.appendChild( this.elements.documentToolbarViewRootElement ,    this.elements.remarkElement ) ;
        DomUtils.appendChild( this.parentNode , this.elements.documentToolbarViewRootElement ) ;

        if( window.RoadofSlider ){
            this.pageVolumeSlider =  new window.RoadofSlider({
                sliderContainer:{//slider整个组件容器的的设置
                    id:that.instanceId+'PageVolumeSlider',//必传!!!!
                    direction:'vertikal'//方向（水平(默认：horizontal||垂直：vertikal）
                },
                onBeforeChange:function (value) {
                    that.pageVolumeSlidering = true ;
                },
                onAfterChange:function(value){
                    that.pageVolumeSlidering = false ;
                    that.changeDynamicPptVolume(value);
                }
            });
        }

        this._addRoadofDrag();
    };

    /*添加拖拽*/
    _addRoadofDrag(){
        if( this.props.isDrag && window.RoadofDrag && this.elements.documentToolbarViewRootElement  ){
            if( this.documentToolbarRoadofDrag && typeof this.documentToolbarRoadofDrag.destroy === 'function'){
                this.documentToolbarRoadofDrag.destroy();
                this.documentToolbarRoadofDrag = undefined ;
            }
            let { left = 50 , top = 100 } = this.props.initDragPosition || {} ;
            this.documentToolbarRoadofDrag = new window.RoadofDrag( this.elements.documentToolbarViewRootElement , {
                containerData:{
                    left:left ,
                    top:top
                },
            });
        }
    }

    /*更新语言*/
    _updateLanguage(){
        let { languageType = 'ch' } = this.props ;
        let {  remark  ,  fullScreen , documentType  } = this.state.viewState ;

        if( !( languageType === 'ch' || languageType === 'tw' || languageType === 'en' || languageType === 'ja')  ){
            languageType = 'ch' ;
        }
        let { prevPage , nextPage , prevStep , nextStep , addPage , enlargeWhiteboard , narrowWhiteboard  ,  pptVolume , onRemark , offRemark
            , onGeneralDocumentFullScreen , offGeneralDocumentFullScreen  , onDynamicPPTFullScreen , offDynamicPPTFullScreen  , onH5DocumentFullScreen , offH5DocumentFullScreen  } = RoadofLanguage.get( languageType ).documentToolbar ;
        let fullScreenTitle = fullScreen ? offGeneralDocumentFullScreen : onGeneralDocumentFullScreen ;
        if( documentType === 'dynamicPPT' ){
            fullScreenTitle = fullScreen ? offDynamicPPTFullScreen : onDynamicPPTFullScreen ;
        }else if ( documentType === 'h5Document' ){
            fullScreenTitle = fullScreen ? offH5DocumentFullScreen : onH5DocumentFullScreen ;
        }
        this.elements.previousPageElement.title =  ( documentType === 'dynamicPPT' ?  prevStep : prevPage ) ;
        this.elements.nextPageElement.title =  ( documentType === 'dynamicPPT' ?  nextStep : nextPage );
        this.elements.addPageElement.title =  addPage ;
        this.elements.fullScreenElement.title = fullScreenTitle ;
        this.elements.volumeElement.title = pptVolume ;
        this.elements.remarkElement.title =  remark ? offRemark : onRemark ;
        this.elements.enlargeWhiteboardElement.title =  enlargeWhiteboard ;
        this.elements.narrowWhiteboardElement.title =  narrowWhiteboard ;
    }

    /*更新select选择框信息*/
    _updateSelectInfo( ){
        if( this.elementsViewClass.selectPageView ){
            let {  page = {} } = this.state.viewState ;
            let { totalPage = 1 , currentPage = 1 , skipPage = {} } = page  ;
            let selectOptions = [] ;
            if( totalPage < 1 ){
                totalPage = 1 ;
            }
            if( currentPage < 1 ){
                currentPage = 1 ;
            }
            for( let index = 1 ; index <= totalPage ; index++ ){
                selectOptions.push({
                    label:index ,
                    value:index
                });
            }
            this.elementsViewClass.selectPageView.setProps({
                selectOptions:selectOptions ,
                currentValue:currentPage ,
                disabled:skipPage.disabled ,
                isMobile:this.props.isMobile
            });
            this.elements.skipPageCurrpageElement.innerHTML = currentPage ;
            this.elements.skipPageTotalpageElement.innerHTML = totalPage ;
        }
    }

    /*是否显示课件备注btn*/
    _isShowRemarkBtn(){
        if(  this.elements.remarkElement ){
            let isShowRemark =  this.props.isLoadRemark  && this.props.canRemark && this.state.viewState.remarkText ;
            DomUtils.updateStyle(this.elements.remarkElement   , {
                display: !isShowRemark ? 'none' : ''
            });
        }
    }

    render(){
        let {  page = {} , zoom = {} , documentType , fullScreen , remark , fileid  } = this.state.viewState ;
        let { prevPage = {} , nextPage = {} , prevStep = {} , nextStep = {} , addPage = {} , skipPage = {} , currentPage = 1  } = page  ;
        let { zoom_big = {} , zoom_small = {} } = zoom ;
        this.elements.previousPageElement.disabled =  documentType === 'dynamicPPT' ?  prevStep.disabled : prevPage.disabled ;
        this.elements.nextPageElement.disabled =  documentType === 'dynamicPPT' ?  nextStep.disabled : nextPage.disabled  ;
        this.elements.addPageElement.disabled =   addPage.disabled   ;
        this.elements.enlargeWhiteboardElement.disabled =   zoom_big.disabled   ;
        this.elements.narrowWhiteboardElement.disabled =   zoom_small.disabled   ;

        if( skipPage.disabled ){
            DomUtils.addClass( this.elements.skipPageElement ,  'disabled') ;
        }else{
            DomUtils.removeClass( this.elements.skipPageElement ,  'disabled') ;
        }

        DomUtils.updateStyle(this.elements.nextPageElement , {
            display: !addPage.disabled ? 'none':''
        });
        DomUtils.updateStyle(this.elements.addPageElement , {
            display: addPage.disabled ? 'none':''
        });
        if( fullScreen ){
            DomUtils.addClass(this.elements.fullScreenElement , 'yes');
        }else {
            DomUtils.removeClass(this.elements.fullScreenElement ,'yes');
        }
        DomUtils.updateStyle(this.elements.volumeElement   , {
            display: this.props.isLoadVolume && documentType === 'dynamicPPT' && this.state.dynamicPptAVSize > 0 ? '' : 'none'
        });

        if( remark ){
            DomUtils.addClass(this.elements.remarkElement , 'yes');
        }else{
            DomUtils.removeClass(this.elements.remarkElement ,'yes');
        }
    }
}

window.RoadofDocumentToolbar = RoadofDocumentToolbar ;
export {RoadofDocumentToolbar} ;
export default  RoadofDocumentToolbar ;
