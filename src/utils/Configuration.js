/**
 * sdk白板全局配置项对象
 * @class Configuration
 * @description   提供 所需的全局配置项
 * @author 邱广生
 * @date 2018-04-20
 */
'use strict';
const Configuration = {} ;
/*所有白板公有配置*/
Configuration.commonWhiteboard = {
    webAddress: /http:/.test( window.location.protocol ) ?  'http://api.roadofcloud.com:80' : 'https://api.roadofcloud.com:443'  , //php服务器地址(注：不提供给用户，自己内部使用)
    docAddress: /http:/.test( window.location.protocol ) ?  'http://api.roadofcloud.com:80' : 'https://api.roadofcloud.com:443'  , //文档服务器地址(注：不提供给用户，自己内部使用)
    backupDocAddressList:[], //备份文档域名列表(注：不提供给用户，自己内部使用)
    myUserId:undefined , //我的userID(注：不提供给用户，自己内部使用)
    myRole:undefined , //我的角色(注：不提供给用户，自己内部使用)
    myName:undefined ,  //我的名字(注：不提供给用户，自己内部使用)
    isConnectedRoom:false , //是否已经连接房间，默认false(注：不提供给用户，自己内部使用)
    isPlayback:false , //是否是回放,默认false(注：不提供给用户，自己内部使用)
    deviceType:undefined , //设备类型，phone , pad  , windowClient , macClient (注：不提供给用户，自己内部使用，并且只有移动端使用)
    clientType:undefined, //android , ios
};

//TODO 动态PPT视频播放可能需要定义新的权限
/*默认白板配置项*/
Configuration.defaultWhiteboard = {
    sendH5DocumentRoomInfo:{},//发给H5课件的房间信息
    isBackEvent:false, //是否返回课件鼠标位置信息 会议版
    hasExtendDocument:false,//是否支持扩展文档
    showpageNotice:false , //翻页消息是否通知给原生程序(注：不提供给用户，自己内部使用)
    loadDynamicPptView:true , //加载动态ppt视图(注：不提供给用户，自己内部使用)
    loadH5DocumentView:true , //加载h5课件视图(注：不提供给用户，自己内部使用)
    isMobile:false , //是否是移动端 ， 默认false(注：不提供给用户，自己内部使用)
    mediaShareToID:undefined , //媒体共享给谁 ， 不指定则默认共享给所有人(注：不提供给用户，自己内部使用)
    associatedMsgID:undefined ,  //绑定的信令消息id (注：不提供给用户，自己内部使用)
    associatedUserID:undefined , //绑定的用户id (注：不提供给用户，自己内部使用)
    clientMediaShare:false , //是否是客户端共享媒体 , 默认false(注：不提供给用户，自己内部使用)
    mediaSharePauseWhenOver:false , //是否播放结束暂停不自动关闭 , 默认自动关闭不暂停(注：不提供给用户，自己内部使用)
    isLoadAudioPlayer:true , //是否加载音频播放器 ，默认true (注：不提供给用户，自己内部使用)
    isLoadVideoPlayer:true , //是否加载视频播放器 ，默认true  (注：不提供给用户，自己内部使用)
    isLoadDocumentRemark:true , //是否加载课件备注 ，默认true  (注：不提供给用户，自己内部使用)
    canRemark:false , //获取课件备注权限，默认false (注：不提供给用户，自己内部使用)
    secondaryColor:'#ffffff' ,  //填充颜色 ,默认 #ffffff(注：不提供给用户，自己内部使用,暂时无用)
    initWhiteboardProductionOptions:{} ,//初始化白板配置项，默认空对象(注：不提供给用户，自己内部使用)
    documentToolBarConfig:{ //文档工具条配置(注：不提供给用户，自己内部使用)
        parentNode:undefined , //父节点
        isDrag:true , //是否拖拽
        isLoadFullScreen:true ,   //是否加载全屏，false
        isLoadRemark:false ,   //是否加载文档备注，false
        isLoadVolume:false ,   //是否加载动态ppt音量设置，false
        initDragPosition:{ //初始化拖拽位置（百分比）
            left:50 ,
            top:98
        },
        fullScreenElementId:undefined , //全屏元素的id
    },
    documentRemarkConfig:{ //文档工具条配置(注：不提供给用户，自己内部使用)
        parentNode:undefined , //父节点
        isDrag:true , //是否拖拽
        initDragPosition:{ //初始化拖拽位置（百分比）
            left:50 ,
            top:98
        },
    },
    whiteboardToolBarConfig:{ //文档工具条配置(注：不提供给用户，自己内部使用)
        parentNode:undefined , //父节点
        isDrag:true , //是否拖拽
        pencilWidthScale:1 , //画笔宽度缩放比例
        eraserWidthScale:2 , //橡皮宽度缩放比例
        initDragPosition:{ //初始化拖拽位置（百分比）
            left:2 ,
            top:2
        },
        loadWhiteboardTools:{ //加载白板标注工具集合
            mouse:true , //鼠标
            laser:true , //激光笔
            pen:true , //画笔
            text:true , //文字
            shape:true , //图形
            eraser:true , //橡皮
            clear:true , //清除
            undo:true , //撤销操作
            redo:true , //恢复操作
            setting:true , //更多设置
        },
    },
    isShowReloadFileTip:true ,//是否显示重新加载文档的提示，默认true (注：不提供给用户，自己内部使用)
    pptVolumeSynchronization:false, //PPT音量是否同步，默认false(注：不提供给用户，自己内部使用)

    insertPictureRule:'default', //图片展示规则 , 默认'default'，可以取值：'default'表示图片根据比例最大程度进行缩放，‘relativeOriginalSize’表示保持图片原大小，如果图片原大小超出容器大小则进行缩放
    languageType: 'ch' ,// 语言类型，默认ch ,  languageType的值有 ch / tw / en  , ch:简体中文，tw:繁体中文 ， en:英文
    rootBackgroundColor:'transparent' ,  //整个白板界面的背景颜色 ,默认 transparent
    primaryColor:'#000000' ,  //画笔颜色 ,默认 #000000
    backgroundColor:'#ffffff' ,   //背景颜色 ,默认 #ffffff
    pencilWidth:5 , //画笔大小 , 默认5
    shapeWidth:5, //图形画笔大小 , 默认5
    eraserWidth:15 , //橡皮大小 ， 默认15
    fontSize:18 , //字体大小 ， 默认18
    fontFamily:"微软雅黑" , //使用的字体 ，默认"微软雅黑"
    showShapeAuthor:false , //是否显示画笔的操作者name ，默认false
    synchronization:true , //是否同步给其它用户, 默认true
    isOnlyUndoRedoClearMyselfShape:false , //是否只撤销、恢复、清除自己的画笔,默认false
    canDraw:true , //可画权限,默认true
    canPage:true ,   //翻页权限，默认true
    addPage:true ,   //加页权限，默认true(注：加页权限和翻页权限同时为true时才能加页)
    actionClick:true , //动态PPT、H5文档等动作点击权限，默认true
    defaultWhiteboardScale:16/9 , //默认的纯白板比例 ， 默认为16/9
    isUseKeyboardPage:true , //是否启用键盘翻页，默认true ，键盘的方向键操作翻页（左箭头：上一页，右箭头：下一页，上箭头：上一步-只在动态ppt起效 ，下箭头：下一步-只在动态ppt起效 ）
    isLoadDocumentToolBar:true , //加载文档工具条 ， 默认true
    isLoadWhiteboardToolBar:true , //加载白板标注工具条 ， 默认true
    isDisconnectedClearWhiteboardData:false , //是否失去连接就清除白板画笔数据,默认false
    isNativePlayAudio:false, // 是否原生播放MP3
    audioPlayerConfig:{ //音频播放器配置
        parentNode:undefined ,//父节点(注：不提供给用户，自己内部使用)
        controlCallback:{ //控制器操作的回调函数(注：不提供给用户，自己内部使用)
            play:undefined , //点击播放的回调函数 (注：不提供给用户，自己内部使用)
            pause:undefined ,//点击暂停的回调函数 (注：不提供给用户，自己内部使用)
        },
        isLoadControl:true , //是否加载控制器,默认true(注：不提供给用户，自己内部使用)
        controlPermissions:{ //控制器的相关控制权限
            hasPlayOrPause:true , //播放暂停权限,默认true
            hasChangeProgress:true , //改变进度权限，默认true
            hasClose:true , //关闭权限，默认true
        }
    },
    videoPlayerConfig:{ //视频播放器配置
        parentNode:undefined , //父节点(注：不提供给用户，自己内部使用)
        controlCallback:{ //控制器操作的回调函数(注：不提供给用户，自己内部使用)
            play:undefined , //点击播放的回调函数 (注：不提供给用户，自己内部使用)
            pause:undefined ,//点击暂停的回调函数 (注：不提供给用户，自己内部使用)
        },
        isLoadControl:true , //是否加载控制器,默认true(注：不提供给用户，自己内部使用)
        controlPermissions:{ //控制器的相关控制权限
            hasPlayOrPause:true , //播放暂停权限,默认true
            hasChangeProgress:true , //改变进度权限，默认true
            hasClose:true , //关闭权限，默认true
        },
    },
}; //白板默认配置项

export default Configuration ;
