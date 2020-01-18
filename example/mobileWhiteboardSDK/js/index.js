window.onload = function () {
    var onPageFinshed = false ;
    var _onWindowResize = function () {
        var defalutFontSize = window.innerWidth / 15.6 ;  //5rem = defalutFontSize*'5px' ;
        var rootHtmls = document.getElementsByTagName('html') ;
        for(var i=0 ; i < rootHtmls.length ; i++){
            rootHtmls[i].style.fontSize =  defalutFontSize+ 'px';
        }
    };
    window.addEventListener("resize",function () { //窗口resize事件监听
        _onWindowResize();
        return false ;
    },false);
    _onWindowResize();

    var room = YS.MobileNativeRoom();  //房间实例化
    var ysWhiteBoardManagerInstance = new window.YSWhiteBoardManager(); //实例化白板管理器

    var parentNode = document.body; //挂载白板的节点
    var configration = {
        //rootBackgroundColor: '#cccccc',  //整个白板界面的背景颜色 ,默认 transparent
        isMobile:true ,  //是否是移动端
        isLoadAudioPlayer:false ,  //是否加载音频播放器
        isLoadVideoPlayer:false ,  //是否加载视频播放器
    };  //配置项
    var _receiveActionCommand = function (action, cmd) {
        if(typeof room.sendActionCommand === 'function'){
            room.sendActionCommand( action, cmd ); //指令转发给移动端原生程序
        }
    }; //接受白板的动作通知指令
    ysWhiteBoardManagerInstance.createMainWhiteboard(parentNode, configration, _receiveActionCommand);

    room.addEventListener('room-receiveActionCommand' , function ( receiveActionCommandData ) {
        if(!onPageFinshed){
            return ;
        }
        var action = receiveActionCommandData.message.action ;
        var cmd = receiveActionCommandData.message.cmd ;
        switch ( action ){
            case 'whiteboardSDK_changeWhiteBoardConfigration':
                ysWhiteBoardManagerInstance.changeWhiteBoardConfigration(cmd.updateConfiguration) ;
                break ;
            case 'whiteboardSDK_useWhiteboardTool':
                ysWhiteBoardManagerInstance.useWhiteboardTool(cmd.toolKey) ;
                break ;
            case 'whiteboardSDK_addPage':
                ysWhiteBoardManagerInstance.addPage() ;
                break ;
            case 'whiteboardSDK_nextPage':
                ysWhiteBoardManagerInstance.nextPage() ;
                break ;
            case 'whiteboardSDK_prevPage':
                ysWhiteBoardManagerInstance.prevPage() ;
                break ;
            case 'whiteboardSDK_skipPage':
                ysWhiteBoardManagerInstance.skipPage(cmd.toPage) ;
                break ;
            case 'whiteboardSDK_nextStep':
                ysWhiteBoardManagerInstance.nextStep() ;
                break ;
            case 'whiteboardSDK_prevStep':
                ysWhiteBoardManagerInstance.prevStep() ;
                break ;
            case 'whiteboardSDK_enlargeWhiteboard':
                ysWhiteBoardManagerInstance.enlargeWhiteboard() ;
                break ;
            case 'whiteboardSDK_narrowWhiteboard':
                ysWhiteBoardManagerInstance.narrowWhiteboard() ;
                break ;
            case 'whiteboardSDK_clear':
                ysWhiteBoardManagerInstance.clear() ;
                break ;
            case 'whiteboardSDK_undo':
                ysWhiteBoardManagerInstance.undo() ;
                break ;
            case 'whiteboardSDK_redo':
                ysWhiteBoardManagerInstance.redo() ;
                break ;
            case 'whiteboardSDK_fullScreen':
                ysWhiteBoardManagerInstance.fullScreen() ;
                break ;
            case 'whiteboardSDK_exitFullScreen':
                ysWhiteBoardManagerInstance.exitFullScreen() ;
                break ;
            case 'whiteboardSDK_updateWhiteboardSize':
                ysWhiteBoardManagerInstance.updateWhiteboardSize() ;
                break ;
            case 'whiteboardSDK_resetWhiteboardData':
                ysWhiteBoardManagerInstance.resetWhiteboardData() ;
                break ;
            case 'whiteboardSDK_resetPureWhiteboardTotalPage':
                ysWhiteBoardManagerInstance.resetPureWhiteboardTotalPage() ;
                break ;
            case 'whiteboardSDK_changeDynamicPptVolume':
                ysWhiteBoardManagerInstance.changeDynamicPptVolume(cmd.volume) ;
                break ;
            case 'whiteboardSDK_openDocumentRemark':
                ysWhiteBoardManagerInstance.openDocumentRemark() ;
                break ;
            case 'whiteboardSDK_closeDocumentRemark':
                ysWhiteBoardManagerInstance.closeDocumentRemark() ;
                break ;
        }
    });

    onPageFinshed = true ;
    room.onPageFinished();
};