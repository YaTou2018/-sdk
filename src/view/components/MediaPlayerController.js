/**
 * MediaPlayerControllerDumb 媒体播放器控制器
 * @module MediaPlayerControllerDumb
 * @description   提供 媒体播放器的控制器
 * @author 邱广生
 * @date 2018/05/011
 */
import RoadofcloudReact from '../components/RoadofcloudReact';
import DomUtils from '../../utils/DomUtils';
import Utils from '../../utils/Utils';

class MediaPlayerControllerDumb extends RoadofcloudReact{
    constructor(parentNode  = document.body , instanceId = 'default', whiteBoardManagerInstance,  props = {}  ){
        super(props);
        this.parentNode = parentNode ;
        this.instanceId = instanceId;
        this.whiteBoardManagerInstance = whiteBoardManagerInstance ;
        this.elements = {};
        this.videoDumb = undefined ;
        this._createElements();
        this._connectElements();
        this.render();
    }

    shouldComponentUpdateProps( prevProps ){
        if( prevProps.streamInfo !== this.props.streamInfo ){
            if(  prevProps.streamInfo &&  this.props.streamInfo && prevProps.streamInfo.attributes && this.props.streamInfo.attributes ){
                let isRender = false;
                for (let [key,value] of Object.entries(this.props.streamInfo.attributes)) {
                    if (key !== 'position' && value !== prevProps.streamInfo.attributes[key]) {
                        isRender = true;
                        break ;
                    }
                }
                if(prevProps.streamInfo.attributes.position !== this.props.streamInfo.attributes.position && !isRender){
                    return true ;
                }
            }
        }
        return false;
    }

    componentDidUpdateProps(prevProps){
        if( prevProps.streamInfo !== this.props.streamInfo ){
            let isStart = prevProps.streamInfo === undefined && this.props.streamInfo ; //播放器刚开始播放
            let isEnd =  !this.props.streamInfo ; //播放器已停止播放
            let isChangePosition =  prevProps.streamInfo &&  this.props.streamInfo && prevProps.streamInfo.attributes && this.props.streamInfo.attributes
                    && prevProps.streamInfo.attributes.position !== this.props.streamInfo.attributes.position  ; //进度改变
            if(  isStart || isEnd || isChangePosition ){
                let nowTime =  new Date().getTime();
                if( !this.updateTime || ((nowTime - this.updateTime) > 500) ){
                    this.updateTime = nowTime ;
                    clearTimeout(this._updateProgressTimer);
                    this._updateProgress();
                }else{
                    clearTimeout(this._updateProgressTimer);
                    this._updateProgressTimer = setTimeout( () => {
                        nowTime = new Date().getTime() ;
                        this.updateTime = nowTime;
                        this._updateProgress();
                    } , 750) ;
                }
            }
        }
        if( prevProps.volume !== this.props.volume ){
            if( this.volumeSlider && typeof this.volumeSlider.setProgress === 'function' ){
                typeof this.volumeSlider.setProgress( this.props.volume );
            }
        }
        if( prevProps.muteVolume !== this.props.muteVolume ){
            if( this.volumeSlider && typeof this.volumeSlider.setProgress === 'function' ){
                typeof this.volumeSlider.setProgress( this.props.muteVolume ? 0 : this.props.volume );
            }
        }
        if( prevProps.isPlayback !== this.props.isPlayback ){
            if( this.props.isPlayback ){
                DomUtils.addClass( this.elements.mediaTotalControlElement , 'ys-playback' ) ;
            }else{
                DomUtils.removeClass( this.elements.mediaTotalControlElement , 'ys-playback' ) ;
            }
        }

        if(  prevProps.myUserId !== this.props.myUserId || (  prevProps.streamInfo !== this.props.streamInfo && !prevProps.streamInfo && this.props.streamInfo )  ){
            this._updateControlByPermissions();
        }

        if( Utils.deepCompareJson(  prevProps.controlPermissions , this.props.controlPermissions ) ){
            this._updateControlByPermissions();
        }

    };

    /*销毁视图*/
    destroyView(){
        DomUtils.removeChild( this.elements.mediaTotalControlElement , this.parentNode );
        for(let key in this.elements){
            this.elements[key] = undefined ;
            delete this.elements[key] ;
        }
    };
    
    /*播放暂停*/
    playOrPauseClick(){
        if( typeof this.props.onPlayOrPauseClick === 'function' ){
            this.props.onPlayOrPauseClick() ;
        }
    }
    
    /*关闭点击事件处理*/
    closeClick(){
        if( typeof this.props.onCloseClick === 'function' ){
            this.props.onCloseClick();
        }
    }

    /*全屏点击事件处理*/
    fullScreenClick(){
        if( typeof this.props.onFullScreenClick === 'function' ){
            this.props.onFullScreenClick();
        }
    }


    /*静音点击事件处理*/
    volumeMuteClick(){
        if( typeof this.props.onVolumeMuteClick === 'function' ){
            this.props.onVolumeMuteClick( );
        }
    };
    
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

    /*创建所需节点*/
    _createElements(){
        this.elements.mediaTotalControlElement = DomUtils.createElement(
            'article' ,
            (this.instanceId + ( this.props.isVideoPlayer ? 'VideoPlayer' : 'MediaPlayer' ) + 'RoadofMediaPlayerTotalControl'),
            ( 'roadofcloud-sdk-whiteboard ys-media-player '+' ys-media-player-total-control '
                + ( this.props.isVideoPlayer ? 'video-player-control-container ' : 'audio-player-control-container '  )
                + ( this.props.isPlayback ? 'ys-playback ' : ' ' )
            )
        ); //媒体播放器所有控件节点
    };

    /*连接所有节点*/
    _connectElements(){
        let that = this ;
        DomUtils.appendChild( this.parentNode , this.elements.mediaTotalControlElement );
        let { attributes = {} } = this.props.streamInfo || {} ;
        let {filename = '' , position = 0 , duration = 0 , pause} = attributes ;
        if( this.elements.mediaTotalControlElement ){
            this.elements.mediaTotalControlElement.innerHTML =  ` 
                <article class="media-player-box clear-float " >
                    <span class="media-player-icon add-fl ${pause ? 'play' : 'pause'}" ></span>
                    <div class="media-player-control-container add-fl clear-float"> 
                        <button  class="play-pause-btn add-cursor-pointer add-fl ${pause ? 'play' : 'pause'}"  ></button>
                        <div class="media-player-info-container add-fl"> 
                            <div class="media-player-name-time-container clear-float"> 
                                <span class="media-player-name add-fl add-nowrap" >${filename}</span>
                                <span class="media-player-time-container add-fr" > 
                                    <em class="curr-time" >${this._formatTime(position/1000)}</em> / <em class="total-time" >${this._formatTime(duration/1000)}</em>
                                </span>
                            </div>
                            <div class="media-player-progress-container" id="${this.instanceId+( this.props.isVideoPlayer ? 'VideoPlayer' : 'MediaPlayer' ) }MediaPlayerProgressBar" >                              
                            </div>
                        </div>
                        <div class="volume-info-container add-fl clear-float" > 
                            <button  class="volume-icon add-cursor-pointer add-fl" ></button>
                            <div class="volume-bar-container add-fl"  id="${this.instanceId+( this.props.isVideoPlayer ? 'VideoPlayer' : 'MediaPlayer' ) }MediaPlayerVolumeBar" ></div>
                        </div>
                        <button  class="close-btn add-cursor-pointer add-fl" ></button>
                        <button  class="full-screen-btn add-cursor-pointer add-fl" ></button>
                    </div>
                </article> 
            `;
            this.elements.playPauseBtnElement = this.elements.mediaTotalControlElement.getElementsByClassName('play-pause-btn')[0] ;
            this.elements.playPauseIconElement = this.elements.mediaTotalControlElement.getElementsByClassName('media-player-icon')[0] ;
            this.elements.volumeMuteBtnElement = this.elements.mediaTotalControlElement.getElementsByClassName('volume-icon')[0] ;
            this.elements.closeBtnElement = this.elements.mediaTotalControlElement.getElementsByClassName('close-btn')[0] ;
            this.elements.fullScreenBtnElement = this.elements.mediaTotalControlElement.getElementsByClassName('full-screen-btn')[0] ;
            this.elements.filenameElement = this.elements.mediaTotalControlElement.getElementsByClassName('media-player-name')[0] ;
            this.elements.currTimeElement = this.elements.mediaTotalControlElement.getElementsByClassName('curr-time')[0] ;
            this.elements.totalTimeElement = this.elements.mediaTotalControlElement.getElementsByClassName('total-time')[0] ;
            this.elements.mediaPlayerProgressElement = this.elements.mediaTotalControlElement.getElementsByClassName('media-player-progress-container')[0] ;
            this.elements.playPauseBtnElement.onclick = this.playOrPauseClick.bind(this);
            this.elements.volumeMuteBtnElement.onclick = this.volumeMuteClick.bind(this);
            this.elements.closeBtnElement.onclick = this.closeClick.bind(this);
            this.elements.fullScreenBtnElement.onclick = this.fullScreenClick.bind(this);

            if( window.RoadofSlider ){
                this.progressSlider = new window.RoadofSlider({
                    sliderContainer:{//slider整个组件容器的的设置
                        id:that.instanceId + ( that.props.isVideoPlayer ? 'VideoPlayer' : 'MediaPlayer' ) +'MediaPlayerProgressBar',//必传!!!!
                        direction:'horizontal'//方向（水平(默认：horizontal||垂直：vertikal）
                    },
                    onBeforeChange:function(progress){
                        that.mediaPlayerProgressSlidering = true ;
                    },
                    onAfterChange:function(progress){
                        that.mediaPlayerProgressSlidering = false ;
                        if( typeof that.props.onChangeProgress === 'function' ){
                            that.props.onChangeProgress( progress );
                        }
                        that._updateProgress();
                        that.tempStopUpdatePosition = true ;
                        setTimeout( ()=>{
                            that.tempStopUpdatePosition = false ;
                        } , 500 ) ;
                    }
                });

                this.volumeSlider = new window.RoadofSlider({
                    sliderContainer:{//slider整个组件容器的的设置
                        id:that.instanceId+ ( that.props.isVideoPlayer ? 'VideoPlayer' : 'MediaPlayer' ) +'MediaPlayerVolumeBar',//必传!!!!
                        direction:'horizontal'//方向（水平(默认：horizontal||垂直：vertikal）
                    },
                    onAfterChange:function(volume){
                        if( typeof that.props.onChangeVolume === 'function' ){
                            that.props.onChangeVolume( volume );
                        }
                    }
                });
            }

            this._updateControlByPermissions();
        }
    }

    /*根据权限更新控制器*/
    _updateControlByPermissions(){
        let isRemoteLocalShareMedia = false ; //是否是远程的本地电影共享
        let { streamType , userid } = this.props.streamInfo || {} ;
        if( streamType === 'file' &&  userid != this.props.myUserId ){
            isRemoteLocalShareMedia = true ;
        }
        DomUtils.updateStyle(this.elements.playPauseBtnElement , {
            display:!this.props.controlPermissions.hasPlayOrPause || isRemoteLocalShareMedia ? 'none':''
        });
        this.elements.playPauseBtnElement.disabled = !this.props.controlPermissions.hasPlayOrPause || isRemoteLocalShareMedia ;

        DomUtils.updateStyle(this.elements.closeBtnElement , {
            display:!this.props.controlPermissions.hasClose ? 'none':''
        });
        this.elements.closeBtnElement.disabled = !this.props.controlPermissions.hasClose ;

        if(this.progressSlider &&  Utils.isFunction(this.progressSlider.updateDisabled) ){
            this.progressSlider.updateDisabled( !this.props.controlPermissions.hasChangeProgress || isRemoteLocalShareMedia );
        }
        if( !this.props.controlPermissions.hasChangeProgress || isRemoteLocalShareMedia ){
            DomUtils.addClass( this.elements.mediaPlayerProgressElement , 'disabled' );
        }else{
            DomUtils.removeClass( this.elements.mediaPlayerProgressElement , 'disabled' );
        }
    }

    /*更新进度*/
    _updateProgress(){
        if( this.props.streamInfo ){
            if( !this.mediaPlayerProgressSlidering && !this.tempStopUpdatePosition && this.progressSlider && typeof this.progressSlider.setProgress === 'function' ){
                let progress = 0 ;
                let { position = 0 , duration = 0 } = this.props.streamInfo && this.props.streamInfo.attributes ?  this.props.streamInfo.attributes : {} ;
                if( duration !== 0 ){
                    progress = ( position / duration ) * 100 ;
                    if( isNaN( progress ) ){
                        progress = 0 ;
                    }
                }
                if( progress < 0 ){
                    progress = 0 ;
                } else if( progress > 100 ){
                    progress = 100 ;
                }
                this.elements.currTimeElement.innerHTML = this._formatTime( position / 1000 ) ;
                this.progressSlider.setProgress( progress  );
            }
        }
    }

    render(){
        let { streamInfo = {} , muteVolume , isFullScreen } = this.props ;
        let { attributes = {} } = streamInfo ;
        let {filename = '' , position = 0 , duration = 0 , pause} = attributes ;
        this.elements.filenameElement.innerHTML = filename ;
        this.elements.currTimeElement.innerHTML = this._formatTime(position/1000) ;
        this.elements.totalTimeElement.innerHTML = this._formatTime(duration/1000) ;
        if( pause ){
            DomUtils.removeClass( this.elements.playPauseBtnElement , 'pause' ) ;
            DomUtils.addClass( this.elements.playPauseBtnElement , 'play' ) ;
            DomUtils.removeClass( this.elements.playPauseIconElement , 'pause' ) ;
            DomUtils.addClass( this.elements.playPauseIconElement , 'play' ) ;
        }else{
            DomUtils.removeClass( this.elements.playPauseBtnElement , 'play' ) ;
            DomUtils.addClass( this.elements.playPauseBtnElement , 'pause' ) ;
            DomUtils.removeClass( this.elements.playPauseIconElement , 'play' ) ;
            DomUtils.addClass( this.elements.playPauseIconElement , 'pause' ) ;
        }
        if( muteVolume ){
            DomUtils.addClass( this.elements.volumeMuteBtnElement , 'mute' ) ;
        }else{
            DomUtils.removeClass( this.elements.volumeMuteBtnElement , 'mute' ) ;
        }
        if( isFullScreen ){
            DomUtils.addClass( this.elements.fullScreenBtnElement , 'yes' ) ;
        }else{
            DomUtils.removeClass( this.elements.fullScreenBtnElement , 'yes' ) ;
        }
    }

} ;

export default MediaPlayerControllerDumb ;