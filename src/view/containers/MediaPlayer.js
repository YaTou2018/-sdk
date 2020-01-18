/**
 * MediaPlayerSmart组件(媒体播放器)
 * @module MediaPlayerSmart
 * @description   提供 MediaPlayer播放器所需组件
 * @author 邱广生
 * @date 2018/05/01
 */
import RoadofcloudReact from '../components/RoadofcloudReact';
import DomUtils from '../../utils/DomUtils';
import Utils from '../../utils/Utils';
import VideoDumb from '../components/VideoDumb';
import MediaPlayerControllerDumb from '../components/MediaPlayerController';

class RoadofMediaPlayer extends RoadofcloudReact{
    constructor(parentNode  = document.body , instanceId = 'default', whiteBoardManagerInstance  ,  props = {} , configration = {} , isVideoPlayer = false ){
        super(props);
        this.isVideoPlayer = isVideoPlayer ;
        this.parentNode = parentNode ;
        this.instanceId = instanceId;
        this.whiteBoardManagerInstance = whiteBoardManagerInstance ;
        this.configration = configration ;
        this.state = {
            streamInfo:undefined ,
            volume:100 ,
            muteVolume:false ,isFullScreen:false , //是否全屏
        };
        this.progressIntervalDuration = 1000 ; //设置进度条定时器时间间隔为1000ms
        this.elements = {};
        this.videoDumb = undefined ;
        this._createElements();
        this._connectElements();
        this.render();
    }

    shouldComponentUpdateState( prevState ){
        if( prevState.streamInfo !== this.state.streamInfo ){
            if(  prevState.streamInfo &&  this.state.streamInfo && prevState.streamInfo.attributes && this.state.streamInfo.attributes ){
                let isRender = false;
                for (let [key,value] of Object.entries( this.state.streamInfo.attributes)) {
                    if (key !== 'position' && value !== prevState.streamInfo.attributes[key]) {
                        isRender = true;
                        break ;
                    }
                }
                if(prevState.streamInfo.attributes.position !== this.state.streamInfo.attributes.position && !isRender){ //FIXME 如果同時更新position和其它狀態，會導致不render
                    return true ;
                }
            }
        }
        return false;
    }

    componentDidUpdateState(prevState){
        if( prevState.streamInfo && !this.state.streamInfo ){
            let fullScreenElement = this.elements.rootElement ;
            if( Utils.getFullscreenElement() && Utils.getFullscreenElement().id === fullScreenElement.id ){
                Utils.exitFullscreen();
            }
        }
        if( this.elements.closeVideoPlayerElement && this.state.streamInfo ){
            let isRemoteLocalShareMedia = false ; //是否是远程的本地电影共享
            let { streamType , userid } = this.state.streamInfo || {} ;
            if( streamType === 'file' &&  userid != this.props.myUserId ){
                isRemoteLocalShareMedia = true ;
            }
            DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                display:!this.props.controlPermissions.hasClose || isRemoteLocalShareMedia? 'none':''
            });
            this.elements.closeVideoPlayerElement.disabled = !this.props.controlPermissions.hasClose || isRemoteLocalShareMedia;
        }

        if( this.state.streamInfo && this.state.streamInfo.attributes ){
            if( this.progressTimer && this.state.streamInfo.streamType === 'media' &&  ( this.state.streamInfo.userid == this.props.myUserId  || this.props.myRole == 0 ||  this.props.myRole == 1 ) ){ //如果是媒体文件共享且是发起者/老师/助教则不设置定时器（由服务器给进度信息）
                this._stopProgressTimer();
            }else{
                if( this.progressTimer  && this.state.streamInfo.attributes.pause  ){
                    this._stopProgressTimer();
                }else if( !this.progressTimer  && !this.state.streamInfo.attributes.pause  ){
                    this._startProgressTimer();
                }
            }
        }else{
            if( this.progressTimer ){
                this._stopProgressTimer();
            }
        }
        if( this.videoDumb ){
            if(  prevState.volume !== this.state.volume  ){
                this.videoDumb.setProps({
                    volume:this.state.volume
                });
            }
            if(  prevState.muteVolume !== this.state.muteVolume  ){
                this.videoDumb.setProps({
                    muteVolume:this.state.muteVolume
                });
            }
            if( prevState.streamInfo !== this.state.streamInfo ){
                this.videoDumb.setProps({
                    streamInfo:this.state.streamInfo
                });
            }
        }

        if( this.mediaPlayerControllerDumb){
            if(  prevState.streamInfo !== this.state.streamInfo  ){
                this.mediaPlayerControllerDumb.setProps({
                    streamInfo:this.state.streamInfo
                });
            }
            if(  prevState.volume !== this.state.volume  ){
                this.mediaPlayerControllerDumb.setProps({
                    volume:this.state.volume
                });
            }
            if(  prevState.muteVolume !== this.state.muteVolume  ){
                this.mediaPlayerControllerDumb.setProps({
                    muteVolume:this.state.muteVolume
                });
            }
            if(  prevState.isFullScreen !== this.state.isFullScreen ){
                this.mediaPlayerControllerDumb.setProps({
                    isFullScreen:this.state.isFullScreen
                });
            }
        }
    };

    componentDidUpdateProps(prevProps){
        if( prevProps.isLoadControl !== this.props.isLoadControl ){
            if( !this.mediaPlayerControllerDumb && this.props.isLoadControl ){
                this._loadMediaPlayerController();
            }else if( this.mediaPlayerControllerDumb && !this.props.isLoadControl ) {
                this.mediaPlayerControllerDumb.destroyView();
                this.mediaPlayerControllerDumb = undefined ;
            }
        }
        if(  this.elements.closeVideoPlayerElement &&  prevProps.controlPermissions.hasClose !== this.props.controlPermissions.hasClose ){
            let isRemoteLocalShareMedia = false ; //是否是远程的本地电影共享
            let { streamType , userid } = this.state.streamInfo || {} ;
            if( streamType === 'file' &&  userid != this.props.myUserId ){
                isRemoteLocalShareMedia = true ;
            }
            DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                display:!this.props.controlPermissions.hasClose || isRemoteLocalShareMedia? 'none':''
            });
            this.elements.closeVideoPlayerElement.disabled = !this.props.controlPermissions.hasClose || isRemoteLocalShareMedia;
        }
        if( this.mediaPlayerControllerDumb ){
            if( prevProps.myUserId !== this.props.myUserId ){
                this.mediaPlayerControllerDumb.setProps({
                    myUserId:this.props.myUserId
                });
            }
            if( prevProps.isPlayback !== this.props.isPlayback ){
                if( this.props.isPlayback ){
                    DomUtils.addClass( this.elements.rootElement , 'ys-playback' ) ;
                }else{
                    DomUtils.removeClass( this.elements.rootElement , 'ys-playback' ) ;
                }
                this.mediaPlayerControllerDumb.setProps({
                    isPlayback:this.props.isPlayback
                });
            }
            if( prevProps.controlPermissions !== this.props.controlPermissions ){
                this.mediaPlayerControllerDumb.setProps({
                    controlPermissions:this.props.controlPermissions
                });
            }
        }

        if( this.videoDumb ){
            if( prevProps.myUserId !== this.props.myUserId  ){
                this.videoDumb.setProps({
                    myUserId:this.props.myUserId
                });
            }
        }
    };

    /*销毁视图*/
    destroyView(){
        DomUtils.removeChild(this.elements.rootElement , this.parentNode );
        for(let key in this.elements){
            this.elements[key] = undefined ;
            delete this.elements[key] ;
        }
    };

    /*接受全屏改变事件*/
    receiveEventFullScreenChange( event ){
        if( Utils.isFullScreenStatus() ){
            let fullScreenElement = this.elements.rootElement ;
            if( Utils.getFullscreenElement() && Utils.getFullscreenElement().id === fullScreenElement.id ){
                this._changeFullScreenState( true );
            }else{
                this._changeFullScreenState( false );
            }
        }else{
            this._changeFullScreenState( false );
        }
    }

    /*暂停和播放控制*/
    onPlayOrPauseClick(){
        if( YS.SDKTYPE !== 'pc' ){
            return ;
        }
        if( this.state.streamInfo && this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate() ){
            let room = this.whiteBoardManagerInstance.getRoomDelegate() ;
            switch ( this.state.streamInfo.streamType ){
                case 'media':
                    if( this.state.streamInfo.attributes.pause ){
                        let { position = 0 , duration = 0 } = this.state.streamInfo.attributes ;
                        if(position >= duration ){
                            room.seekMedia(0);
                        }
                        room.pauseShareMedia(false); //play
                        DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                            display:''
                        });
                        if( this.props.controlCallback && this.props.controlCallback.play && Utils.isFunction( this.props.controlCallback.play ) ){
                            this.props.controlCallback.play();
                        }
                    }else{
                        room.pauseShareMedia(true); //pause
                        DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                            display:'none'
                        });
                        if( this.props.controlCallback && this.props.controlCallback.pause && Utils.isFunction( this.props.controlCallback.pause ) ){
                            this.props.controlCallback.pause();
                        }
                    }
                    break;
                case 'file':
                    if( this.state.streamInfo.userid === this.props.myUserId && room.getNativeInterface() ){
                        let nativeInterface = room.getNativeInterface();
                        if( this.state.streamInfo.attributes.pause ){
                            let { position = 0 , duration = 0 } = this.state.streamInfo.attributes ;
                            this._updateLocalFileStreamInfoPlayerPosition( () => {
                                if(position + 1000 >= duration ){ //FIXME position比duration少几百毫秒，需要c++查一下，暂时做+1000处理
                                    nativeInterface.seekMediaFile(0);
                                }
                                nativeInterface.pauseShareMediaFile(false); //play
                                if( this.props.controlCallback && this.props.controlCallback.play && Utils.isFunction( this.props.controlCallback.play ) ){
                                    this.props.controlCallback.play();
                                    DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                                        display:''
                                    });
                                }
                            } );
                        }else{
                            nativeInterface.pauseShareMediaFile(true); //pause
                            if( this.props.controlCallback && this.props.controlCallback.pause && Utils.isFunction( this.props.controlCallback.pause ) ){
                                this.props.controlCallback.pause();
                                DomUtils.updateStyle(this.elements.closeVideoPlayerElement , {
                                    display:'none'
                                });
                            }
                        }
                    }
                    break;
            }
        }
    }

    /*改变音量*/
    onChangeVolume( volume ){
        let changeState = {
            volume:volume
        } ;
        if( volume === 0 && !this.state.muteVolume ){
            changeState.muteVolume = true ;
        }else if( volume !== 0 && this.state.muteVolume ){
            changeState.muteVolume = false ;
        }
        this.setState( changeState );
    }

    /*改变播放的进度*/
    onChangeProgress( progress ){
        if( YS.SDKTYPE === 'mobile' ){
            return ;
        }
        if( this.state.streamInfo && this.state.streamInfo.attributes && this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate() ){
            switch ( this.state.streamInfo.streamType ){
                case 'media':
                    let positionPercentage = progress / 100 ;
                    if( positionPercentage < 0 ){
                        positionPercentage = 0 ;
                    }
                    if( positionPercentage > 1 ){
                        positionPercentage = 1 ;
                    }
                    let position = this.state.streamInfo.attributes.duration * positionPercentage;
                    this._updateStreamInfoAttributes( 'position' , position );
                    this.whiteBoardManagerInstance.getRoomDelegate().seekMedia(positionPercentage);
                    break;
                case 'file':
                    if( this.state.streamInfo.userid === this.props.myUserId && this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface() ){
                        let positionPercentage = progress / 100 ;
                        if( positionPercentage < 0 ){
                            positionPercentage = 0 ;
                        }
                        if( positionPercentage > 1 ){
                            positionPercentage = 1 ;
                        }
                        let position = this.state.streamInfo.attributes.duration * positionPercentage;
                        this._updateStreamInfoAttributes( 'position' , position );
                        this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().seekMediaFile(positionPercentage);
                    }
                    break;
            }
        }
    }
    
    /*改变静音*/
    onVolumeMuteClick(){
        let changeState = {
            muteVolume:!this.state.muteVolume
        } ;
        if( !changeState.muteVolume && this.state.volume <= 0 ){
            changeState.volume = 100 ;
        }
        this.setState(changeState);
    };

    /*关闭点击事件处理*/
    onCloseClick(){
        if( this.state.streamInfo && this.whiteBoardManagerInstance ){
            switch ( this.state.streamInfo.streamType ){
                case 'media':
                    this.whiteBoardManagerInstance.stopShareMedia();
                    break;
                case 'file':
                    this.whiteBoardManagerInstance.stopShareLocalMedia();
                    break;
            }
        }
    }

    /*全屏点击处理*/
    onFullScreenClick(){
        if( !this.state.isFullScreen ){
            if( Utils.isFullScreenStatus() ){
                Utils.exitFullscreen();
            }
            let fullScreenElement = this.elements.rootElement ;
            Utils.launchFullscreen( fullScreenElement ) ;
        }else{
            Utils.exitFullscreen();
        }
    }

    /*创建所需节点*/
    _createElements(){
        this.elements.rootElement = DomUtils.createElement(
            'section' ,
            ( this.instanceId+ ( this.isVideoPlayer ? 'VideoPlayer' : 'AudioPlayer' ) + 'RoadofMediaPlayerBox' ) ,
            ( 'roadofcloud-sdk-whiteboard ys-media-player '+' ys-media-player-container '
                + ( this.isVideoPlayer ? 'ys-video-player-container ' : 'ys-audio-player-container ' )
                + ( this.props.isPlayback ? 'ys-playback ' : ' ' )
            ) ,
            {
                display:!this.state.streamInfo ? 'none' : ''
            }
        ); //根节点

        this.elements.mediaSourceElement = DomUtils.createElement('article' , this.instanceId+ ( this.isVideoPlayer ? 'VideoPlayer' : 'AudioPlayer' ) + 'RoadofMediaPlayerSourceBox' , 'roadofcloud-sdk-whiteboard ys-media-player '+' ys-media-player-source' , {
            display:! this.isVideoPlayer ? 'none':''
        }); //音频播放器来源节点
        let isRemoteLocalShareMedia = false ; //是否是远程的本地电影共享
        let { streamType , userid } = this.state.streamInfo || {} ;
        if( streamType === 'file' &&  userid != this.props.myUserId ){
            isRemoteLocalShareMedia = true ;
        }
        if( this.isVideoPlayer ){
            this.elements.closeVideoPlayerElement = DomUtils.createElement('button' , undefined , 'roadofcloud-sdk-whiteboard add-cursor-pointer ys-video-player-close-btn ' , {
                display:!this.props.controlPermissions.hasClose || isRemoteLocalShareMedia ? 'none':''
            }); //视频播放器关闭按钮
        }

        this.elements.mediaTotalControlElement = DomUtils.createElement('article' , this.instanceId+ ( this.isVideoPlayer ? 'VideoPlayer' : 'AudioPlayer' ) + 'RoadofMediaPlayerTotalControlBox' , 'roadofcloud-sdk-whiteboard ys-media-player '+' ys-media-player-total-control-box' , {
        }); //音频播放器所有控件节点
        if (this.isVideoPlayer) {
            this.elements.rootElement.onmouseover = this._videoMouseover.bind(this);
            this.elements.rootElement.onmouseout = this._videoMouseout.bind(this);
            this.elements.rootElement.onclick = this._videoClick.bind(this);
            this.elements.mediaTotalControlElement.onmouseover = this._videoControlMouseover.bind(this);
            this.elements.mediaTotalControlElement.onclick = this._videoControlClick.bind(this);
        }
    };
    _videoMouseover() {
        DomUtils.addClass( this.elements.rootElement , 'show-controller' ) ;
        clearTimeout(this.showControllerTimer);
        this.showControllerTimer = setTimeout(()=>{
            DomUtils.removeClass( this.elements.rootElement , 'show-controller' ) ;
        },2000)
    };
    _videoMouseout() {
        DomUtils.removeClass( this.elements.rootElement , 'show-controller' ) ;
    };
    _videoClick(event) {
        let isAdd = this.elements.rootElement.classList.toggle('show-controller')
        if (isAdd) {
            clearTimeout(this.showControllerTimer);
            this.showControllerTimer = setTimeout(()=>{
                DomUtils.removeClass( this.elements.rootElement , 'show-controller' ) ;
            },2000)
        }
    };
    _videoControlMouseover(event) {
        clearTimeout(this.showControllerTimer);
        DomUtils.addClass( this.elements.rootElement , 'show-controller' ) ;
        event.stopPropagation();
    };
    _videoControlClick(event) {
        event.stopPropagation();
    };

    /*连接所有节点*/
    _connectElements(){
        DomUtils.appendChild( this.elements.rootElement , this.elements.mediaSourceElement );
        DomUtils.appendChild( this.elements.rootElement , this.elements.mediaTotalControlElement );
        if( this.elements.closeVideoPlayerElement ){
            DomUtils.appendChild( this.elements.rootElement , this.elements.closeVideoPlayerElement );
        }
        DomUtils.appendChild( this.parentNode , this.elements.rootElement );
        if( this.props.isLoadControl ){
            this._loadMediaPlayerController();
        }
        if( this.elements.closeVideoPlayerElement ){
            this.elements.closeVideoPlayerElement.onclick = this.onCloseClick.bind(this);
        }
    }

    /*加载媒体播放控制器*/
    _loadMediaPlayerController(){
        if( this.props.isLoadControl ){
            if( this.mediaPlayerControllerDumb ) {
                this.mediaPlayerControllerDumb.destroyView();
            }
            this.mediaPlayerControllerDumb = new MediaPlayerControllerDumb( this.elements.mediaTotalControlElement  , this.instanceId  , this.whiteBoardManagerInstance , {
                streamInfo:this.state.streamInfo ,
                volume:this.state.volume ,
                muteVolume:this.state.muteVolume ,
                isFullScreen:this.state.isFullScreen ,
                isPlayback:this.props.isPlayback ,
                myUserId:this.props.myUserId ,
                controlPermissions:this.props.controlPermissions ,
                isVideoPlayer:this.isVideoPlayer ,
                onCloseClick:this.onCloseClick.bind(this) ,
                onPlayOrPauseClick:this.onPlayOrPauseClick.bind(this) ,
                onChangeVolume:this.onChangeVolume.bind(this) ,
                onVolumeMuteClick:this.onVolumeMuteClick.bind(this) ,
                onChangeProgress:this.onChangeProgress.bind(this) ,
                onFullScreenClick:this.onFullScreenClick.bind(this) ,
            });
        }else{
            if( this.mediaPlayerControllerDumb ) {
                this.mediaPlayerControllerDumb.destroyView();
            }
        }
    }

    /*将时间格式化为分:秒*/
    _formatTime(data){
        let minute=parseInt(data/60);
        let second=Math.round(data%60);
        if(second === 60){
            minute+=1;
            second=0;
        }
        if( parseInt(minute/10) === 0 ){//时间个位数转十位数
            minute =  '0'+minute;
        }
        if( parseInt(second/10) === 0 ){//时间个位数转十位数
            second = '0'+second;
        }
        return minute+':'+second ;
    }

    /*开始定时设置进度*/
    _startProgressTimer(){
        if( this.props.isPlayback ){ //回放没有进度
            this._stopProgressTimer();
            return ;
        }
        this._stopProgressTimer();
        if( this.state.streamInfo ){
            if( this.state.streamInfo.streamType === 'media' &&  ( this.state.streamInfo.userid == this.props.myUserId  || this.props.myRole == 0 ||  this.props.myRole == 1 )  ){ //如果是媒体文件共享且是发起者/老师/助教则不设置定时器（由服务器给进度信息）
                this._stopProgressTimer();
                return ;
            }
            this.progressTimer = setInterval( ()=>{
                if( this.state.streamInfo ){
                    let { userid , streamType , attributes = {}  } =  this.state.streamInfo ;
                    switch( streamType ){
                        case 'media':
                            if( this.state.streamInfo.streamType === 'media' &&  ( this.state.streamInfo.userid == this.props.myUserId  || this.props.myRole == 0 ||  this.props.myRole == 1 )  ){ //如果是媒体文件共享且是发起者/老师/助教则不设置定时器（由服务器给进度信息）
                                this._stopProgressTimer();
                                return ;
                            }
                            let { position = 0 , duration = 0 } = attributes ;
                            position += this.progressIntervalDuration ;
                            if(position >  duration ){
                                position =  duration;
                                this._stopProgressTimer();
                            }
                            this._updateStreamInfoAttributes('position' , position);
                            break ;
                        case 'file':
                            if( userid !== this.props.myUserId ){
                                let { position = 0 , duration = 0 } = attributes ;
                                position += this.progressIntervalDuration ;
                                if(position >  duration ){
                                    position =  duration;
                                    this._stopProgressTimer();
                                }
                                this._updateStreamInfoAttributes('position' , position);
                            }else{
                                this._updateLocalFileStreamInfoPlayerPosition();
                            }
                            break ;
                    }
                }else{
                    this._stopProgressTimer();
                }
            } , this.progressIntervalDuration ) ;
        }
    };

    /*停止定时设置进度*/
    _stopProgressTimer(){
        clearInterval(this.progressTimer);
        this.progressTimer = null ;
    };


    /*更新流的attributes*/
    _updateStreamInfoAttributes( key , value ){
        if( this.state.streamInfo ){
            let updateAttributes = {} ;
            updateAttributes[key] = value ;
            this.setState({
                streamInfo:Object.deepAssign({} , this.state.streamInfo , {
                    attributes:updateAttributes
                })
            });
        }
    }

    /*更新本地媒体文件的播放进度(发起者的进度)*/
    _updateLocalFileStreamInfoPlayerPosition( callback ){
        if( this.state.streamInfo && this.state.streamInfo.streamType === 'file' ){
            if( this.state.streamInfo.userid === this.props.myUserId && this.whiteBoardManagerInstance
                && this.whiteBoardManagerInstance.getRoomDelegate() && this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface() ){
                this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().getMediaFileProgress( ( param ) => {
                    if( typeof param === 'object'){
                        let { position = 0 , duration = 0 } = param ;
                        if(position > duration){
                            position = duration ;
                            this._stopProgressTimer();
                        }
                        this._updateStreamInfoAttributes('position' , position ) ;
                        if( Utils.isFunction( callback ) ){
                            callback( param );
                        }
                    }
                });
            }
        }
    }


    /*改变全屏状态*/
    _changeFullScreenState( isFullScreen ){
        this.setState({
            isFullScreen:isFullScreen
        })
    }

    /**/
    getVideoDumbElementId(){
        if( this.videoDumb ){
            return this.videoDumb.getElementId();
        }
    }

    render(){
        if( this.state.streamInfo && !this.videoDumb ){
            this.videoDumb = new VideoDumb( this.elements.mediaSourceElement , this.instanceId , this.whiteBoardManagerInstance , {
                videoDumbElementIdPrefix:this.instanceId ,
                streamInfo: this.state.streamInfo ,
                volume:this.state.volume ,
                muteVolume:this.state.muteVolume ,
                myUserId:this.props.myUserId ,
            });
        }else if( !this.state.streamInfo && this.videoDumb){
            this.videoDumb.destroyView();
            this.videoDumb = undefined ;
        }
        DomUtils.updateStyle( this.elements.rootElement , {
            display:!this.state.streamInfo ? 'none' : ''
        });
    }

}

export default RoadofMediaPlayer ;