/*sdk白板常量对象
 * @module Constant
 * @description  提供sdk白板所需的常量
 * @author 邱广生
 * @date 2018-04-22
 */
'use strict';
window.WhiteboardGlobalShare = window.WhiteboardGlobalShare || {};
let Constant = {};
Constant.WHITEBOARD_SDK_VERSION = 'v2.1.0'; //白板sdk的版本号
Constant.WHITEBOARD_SDK_TIME = '2018102313'; //白板sdk更新时间
Constant.dynamicPptVersions = 2017091401 ; //动态ppt的版本
Constant.remoteDynamicPptUpdateTime = 2018042223 ; //远程动态PPT文件更新时间
Constant.dynamicPptDebugLog = false ; //动态ppt是否debug log
console.info('[whiteboard-sdk]whiteboard sdk version is '+Constant.WHITEBOARD_SDK_VERSION + ' , update time is '+Constant.WHITEBOARD_SDK_TIME);
export default Constant;