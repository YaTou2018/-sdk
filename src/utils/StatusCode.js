/**
 * SDK状态码
 * @class StatusCode
 * @description   提供状态码
 * @author QiuShao
 * @date 2018/06/08
 * */
'use strict';
window.TK = window.TK || {};

/*错误码*/
window.TK_ERR = {
    DEVICE_ERROR_UnknownError:10000 , //设备不可用错误码
    DEVICE_ERROR_NotFoundError:10001 , //没有找到设备错误码
    DEVICE_ERROR_NotAllowedError:10002 , //设备没有授权错误码
    DEVICE_ERROR_NotReadableError:10003 , //设备占用错误码
    DEVICE_ERROR_OverconstrainedError:10004 , //设备无法满足约束配置错误码
    DEVICE_ERROR_TypeError:10005 , //设备约束对象为空或者约束都设置为false错误码
    TIMEOUT_ERROR:10006, //超时错误码
};

/*视频mode常量*/
window.TK_VIDEO_MODE = {
    ASPECT_RATIO_CONTAIN:20001 , //视频默认模式（不裁剪）
    ASPECT_RATIO_COVER:20002 , //视频裁剪模式
};

/*角色常量*/
window.TK.ROOM_ROLE = {
    TEACHER:0 , //老师（主讲）
    ASSISTANT:1 , //助教
    STUDENT:2 , //学生
    AUDIT:3 , //旁听（直播用户）
    PATROL:4 , //巡检员（巡课）
    SYSTEM_ADMIN:10 , //系统管理员
    ENTERPRISE_ADMIN:11 , //企业管理员
    ADMIN:12 , //管理员
    PLAYBACK:-1 , //回放者
};

/*房间模式*/
window.TK.ROOM_MODE = {
    NORMAL_ROOM:'normalRoom',
    BIG_ROOM:'bigRoom',
};

/*错误通知*/
window.TK.ERROR_NOTICE = {
    PUBLISH_AUDIO_VIDEO_FAILURE:40001, //发布音视频失败
    SHARE_MEDIA_FAILURE:40003, //共享媒体文件失败
    SHARE_FILE_FAILURE:40004, //共享本地媒体文件失败
    SHARE_SCREEN_FAILURE:40005, //共享屏幕失败
    SUBSCRIBE_AUDIO_VIDEO_FAILURE:40007, //订阅音视频失败
    SUBSCRIBE_MEDIA_FAILURE:40008, //订阅媒体文件失败
    SUBSCRIBE_FILE_FAILURE:40009, //订阅本地媒体文件失败
    SUBSCRIBE_SCREEN_FAILURE:40010, //订阅屏幕共享失败
    UNSUBSCRIBE_AUDIO_VIDEO_FAILURE:40013, //取消订阅音视频失败
    UNSUBSCRIBE_MEDIA_FAILURE:40014, //取消订阅媒体文件失败
    UNSUBSCRIBE_FILE_FAILURE:40015, //取消订阅本地媒体文件失败
    UNSUBSCRIBE_SCREEN_FAILURE:40016, //取消订阅屏幕共享失败
    UNPUBLISH_AUDIO_VIDEO_FAILURE:40019, //取消发布音视频失败
    STOP_MEDIA_FAILURE:40020, //停止共享媒体文件失败
    STOP_FILE_FAILURE:40021, //停止共享本地媒体文件失败
    STOP_SCREEN_FAILURE:40022, //停止共享屏幕失败
    UDP_CONNECTION_FAILED:40023, //UDP连接失败（UDP不通）
    UDP_CONNECTION_INTERRUPT:40024, //UDP连接中断（UDP之前通信正常，之后中断了）
};

