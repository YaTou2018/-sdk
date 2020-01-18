/**
 * VideoPlayerView组件(视频播放器)
 * @module VideoPlayerView
 * @description   提供 VideoPlayer播放器所需组件
 * @author 邱广生
 * @date 2018/05/01
 */
import Global from '../../utils/Global';
import Utils from '../../utils/Utils';
import RoadofMediaPlayer from './MediaPlayer';

class RoadofVideoPlayer extends RoadofMediaPlayer{
    constructor(parentNode  = document.body , instanceId = 'default', whiteBoardManagerInstance  ,  props = {} , configration = {}  ) {
        let isVideoPlayer = true ;
        super(parentNode , instanceId , whiteBoardManagerInstance , props  , configration , isVideoPlayer );
        this.configration = configration ;
    }

    reveiveEventRoomUsermediaorfilestateChanged(recvEventData){
        let { type , userId , attributes = {}, published } = recvEventData.message ;
        if( ( type === 'media' || type === 'file' ) && attributes.audio && attributes.video ){ //只有mp4操作
            if(published){
                Global.isPlayVideoing = true ;
                this.setState({
                    streamInfo:undefined
                });
                this.setState({
                    streamInfo:{
                        userid: userId ,
                        streamType: type ,
                        audio:attributes.audio ,
                        video:attributes.video ,
                        attributes:attributes  ,
                    }
                });
                if (userId === this.props.myUserId) {
                    if( type === 'file' ){
                        if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate() && this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface() ){
                            this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().pauseShareMediaFile(false); //play
                            this.whiteBoardManagerInstance.getRoomDelegate().getNativeInterface().seekMediaFile(0);
                        }
                    }
                }
                let { pause } =  attributes  ;
                this.sendMediaPlayerNoticeActionCommand( 'start'  , recvEventData);
                this.sendMediaPlayerNoticeActionCommand( pause ? 'pause' : 'play' ,  recvEventData );
                 if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.reveiveEventRoomReceiveActionCommand ){
                     this.whiteBoardManagerInstance.reveiveEventRoomReceiveActionCommand({
                         type:'room-receiveActionCommand',
                         message:{
                             action:'closeDynamicPptWebPlay'
                         }
                     });
                 }
            }else{
                Global.isPlayVideoing = false ;
                this.setState({
                    streamInfo:undefined
                });
                this.sendMediaPlayerNoticeActionCommand( 'end'  , recvEventData);
            }
        }
    };

    reveiveEventRoomUsermediaorfileattributesUpdate(recvEventData){
        let { type , attributes = {}, updateAttributes = {} } = recvEventData.message ;
        if( ( type === 'media' || type === 'file' )  && attributes.audio && attributes.video ){ //只有mp4操作
            if( this.state.streamInfo ){
                this.setState({
                    streamInfo:Object.deepAssign({} , this.state.streamInfo , {
                        attributes:updateAttributes
                    })
                });
                if( updateAttributes.pause !== undefined ){
                    this.sendMediaPlayerNoticeActionCommand( updateAttributes.pause ? 'pause' : 'play' ,  recvEventData );
                }
            }
        }
    };

    receiveEventRoomErrorNotice(recvEventData){
        let { errorCode } = recvEventData;
        switch (errorCode){
            case YS.ERROR_NOTICE.SHARE_MEDIA_FAILURE: //共享媒体文件失败
            case YS.ERROR_NOTICE.SHARE_FILE_FAILURE: //共享本地媒体文件失败
                Global.isPlayVideoing = false ;
                this.setState({
                    streamInfo:undefined
                });
                this.sendMediaPlayerNoticeActionCommand( 'startShareMediaFail' ,  recvEventData );
                break;
            case YS.ERROR_NOTICE.STOP_MEDIA_FAILURE: //停止共享媒体文件失败
            case YS.ERROR_NOTICE.STOP_FILE_FAILURE: //停止共享本地媒体文件失败
                this.sendMediaPlayerNoticeActionCommand( 'stopShareMediaFail' ,  recvEventData );
                break;
            case YS.ERROR_NOTICE.SUBSCRIBE_MEDIA_FAILURE: //订阅媒体文件失败
            case YS.ERROR_NOTICE.SUBSCRIBE_FILE_FAILURE: //订阅本地媒体文件失败
                Global.isPlayVideoing = false ;
                this.setState({
                    streamInfo:undefined
                });
                this.sendMediaPlayerNoticeActionCommand( 'subscribeShareMediaFail' ,  recvEventData );
                break;
            case YS.ERROR_NOTICE.UNSUBSCRIBE_MEDIA_FAILURE: //取消订阅媒体文件失败
            case YS.ERROR_NOTICE.UNSUBSCRIBE_FILE_FAILURE: //取消订阅本地媒体文件失败
                this.sendMediaPlayerNoticeActionCommand( 'unsubscribeShareMediaFail' ,  recvEventData );
                break;
        }
    };

    /*发送动作指令
     * XXX 此处直接获取了主白板实例且直接操作了主白板的方法*/
    sendMediaPlayerNoticeActionCommand( noticeType ,  recvEventData ){
        let { type , userId , attributes = {} } = recvEventData.message ;
        if( ( type === 'media' || type === 'file' )  && attributes.audio && attributes.video ) { //只有mp4操作
            if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.whiteboardViewMap && this.whiteBoardManagerInstance.whiteboardViewMap.has('default') ){
                let whiteboardView = this.whiteBoardManagerInstance.whiteboardViewMap.get( 'default' ) ;
                if( whiteboardView && whiteboardView.sendActionCommand ){
                    let action =  'mediaPlayerNotice' , cmd ;
                    let videoPlayerStreamInfo = {
                        playerType:'videoPlayer' ,
                        userid: userId ,
                        streamType: type ,
                        audio:attributes.audio ,
                        video:attributes.video ,
                        attributes:attributes ,
                    } ;
                    videoPlayerStreamInfo.isDynamicPptVideo = ( videoPlayerStreamInfo.attributes.source === 'dynamicPPT' || ( videoPlayerStreamInfo.playerType === 'videoPlayer' && videoPlayerStreamInfo.attributes.filename === '' ) ) ;
                    cmd =  Object.deepAssign({
                        type:noticeType ,
                        fileid:videoPlayerStreamInfo.attributes.fileid
                    } , videoPlayerStreamInfo ) ;
                    whiteboardView.sendActionCommand( action , cmd );
                    if( Utils.isFunction( whiteboardView.forceViewStateUpdate ) ){
                        whiteboardView.forceViewStateUpdate();
                    }
                }
            }
        }
    };

}

window.RoadofVideoPlayer = RoadofVideoPlayer ;
export {RoadofVideoPlayer} ;
export default RoadofVideoPlayer ;