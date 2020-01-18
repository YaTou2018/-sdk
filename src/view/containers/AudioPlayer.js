/**
 * AudioPlayerView组件(音频播放器)
 * @module AudioPlayerView
 * @description   提供 AudioPlayer播放器所需组件
 * @author 邱广生
 * @date 2018/05/01
 */
import RoadofMediaPlayer from './MediaPlayer';

class RoadofAudioPlayer extends RoadofMediaPlayer{
    constructor(parentNode  = document.body , instanceId = 'default', whiteBoardManagerInstance  ,  props = {} , configration = {}  ) {
        let isVideoPlayer = false ;
        super(parentNode , instanceId , whiteBoardManagerInstance , props  , configration , isVideoPlayer );
    }

    reveiveEventRoomUsermediaorfilestateChanged(recvEventData){
        let { type , userId , attributes = {}, published } = recvEventData.message ;
        if( ( type === 'media' || type === 'file' ) && attributes.audio && !attributes.video ){ //只有mp3操作
            if(published){
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
            }else{
                this.setState({
                    streamInfo:undefined
                });
                this.sendMediaPlayerNoticeActionCommand( 'end'  , recvEventData);
            }
        }
    };

    reveiveEventRoomUsermediaorfileattributesUpdate(recvEventData){
        let { type , attributes = {}, updateAttributes = {} } = recvEventData.message ;
        if( ( type === 'media' || type === 'file' )  && attributes.audio && !attributes.video ){ //只有mp3操作
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
        if( ( type === 'media' || type === 'file' )  && attributes.audio && !attributes.video ) { //只有mp3操作
            if( this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.whiteboardViewMap && this.whiteBoardManagerInstance.whiteboardViewMap.has('default') ){
                let whiteboardView = this.whiteBoardManagerInstance.whiteboardViewMap.get( 'default' ) ;
                if( whiteboardView && whiteboardView.sendActionCommand ){
                    let action =  'mediaPlayerNotice' , cmd ;
                    let audioPlayerStreamInfo = {
                        playerType:'audioPlayer' ,
                        userid: userId ,
                        streamType: type ,
                        audio:attributes.audio ,
                        video:attributes.video ,
                        attributes:attributes ,
                    } ;
                    audioPlayerStreamInfo.isDynamicPptVideo = false;
                    cmd =  Object.deepAssign({
                        type:noticeType ,
                        fileid:audioPlayerStreamInfo.attributes.fileid
                    } , audioPlayerStreamInfo ) ;
                    whiteboardView.sendActionCommand( action , cmd );
                }
            }
        }
    };

}

window.RoadofAudioPlayer = RoadofAudioPlayer ;
export {RoadofAudioPlayer} ;
export default RoadofAudioPlayer ;