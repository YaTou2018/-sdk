/**
 * video Dumb组件
 * @module VideoDumb
 * @description   提供 Video显示区组件
 * @author xiagd
 * @date 2017/08/10
 */

'use strict';
import RoadofcloudReact from './RoadofcloudReact';
import DomUtils from '../../utils/DomUtils';

class VideoDumb extends RoadofcloudReact {
    constructor(parentNode = document.body, instanceId = 'default', whiteBoardManagerInstance, props = {}) {
        super(props);
        this.parentNode = parentNode;
        this.instanceId = instanceId;
        this.whiteBoardManagerInstance = whiteBoardManagerInstance;
        this.elements = {};
        this.userid = this.props.streamInfo ? this.props.streamInfo.userid : undefined;
        this.streamType = this.props.streamInfo ? this.props.streamInfo.streamType : undefined;
        this._createElements();
        this._connectElements();
        this._playAV();
    };

    /*props状态更新生命周期*/
    componentDidUpdateProps( prevProps ){
        if( this.props.volume !== prevProps.volume || this.props.muteVolume !== prevProps.muteVolume ){
            this._changeVolume( this.props.muteVolume ? 0 : this.props.volume ) ;
        }
    };

    /*销毁视图*/
    destroyView() {
        this._unplayAV();
        DomUtils.removeChild(this.elements.rootElement, this.parentNode);
        for (let key in this.elements) {
            this.elements[key] = undefined;
            delete this.elements[key];
        }
    };

    getElementId(){
       return this.elements.rootElement.id ;
    }

    _changeVolume(volume) {
        if (volume !== undefined && typeof volume === 'number' && this.props.streamInfo && this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate() ) {
            let {userid, streamType} = this.props.streamInfo || {};
            if (this.whiteBoardManagerInstance.getRoomDelegate().setVolume) {
                this.whiteBoardManagerInstance.getRoomDelegate().setVolume( userid , streamType , volume );
            }
        }
    }

    /*创建所需节点*/
    _createElements() {
        let {userid} = this.props.streamInfo || {};
        this.elements.rootElement = DomUtils.createElement('div', this.props.videoDumbElementIdPrefix + userid, 'ys-audio-or-video-player ' + ' ys-audio-player-video-dumb'); //根节点
    };

    /*连接所有节点*/
    _connectElements() {
        DomUtils.appendChild(this.parentNode, this.elements.rootElement);
    }

    /*播放视频*/
    _playAV() {
        if (this.props.streamInfo && this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate() && this.elements.rootElement && this.elements.rootElement.id) {
            let {userid, video, audio, streamType} = this.props.streamInfo || {};
            switch (streamType) {
                case 'media':
                    if (this.whiteBoardManagerInstance.getRoomDelegate().playRemoteMedia) {
                        let elementId = this.elements.rootElement.id;
                        this.whiteBoardManagerInstance.getRoomDelegate().playRemoteMedia(userid, elementId);
                    }
                    break;
                case 'file':
                    if (this.whiteBoardManagerInstance.getRoomDelegate().playRemoteMediaFile) {
                        let elementId = this.elements.rootElement.id;
                        this.whiteBoardManagerInstance.getRoomDelegate().playRemoteMediaFile(userid, elementId);
                    }
                    break;
            }
        }
        this._changeVolume( this.props.muteVolume ? 0 : this.props.volume);
    };

    /*取消播放视频*/
    _unplayAV() {
        if (this.whiteBoardManagerInstance && this.whiteBoardManagerInstance.getRoomDelegate()) {
            switch (this.streamType) {
                case 'media':
                    if (this.whiteBoardManagerInstance.getRoomDelegate().unplayRemoteMedia) {
                        this.whiteBoardManagerInstance.getRoomDelegate().unplayRemoteMedia(this.userid);
                    }
                    break;
                case 'file':
                    if (this.whiteBoardManagerInstance.getRoomDelegate().unplayRemoteMediaFile) {
                        this.whiteBoardManagerInstance.getRoomDelegate().unplayRemoteMediaFile(this.userid);
                    }
                    break;
            }
        }
    }

    render() {

    };
};

export  default  VideoDumb ;
