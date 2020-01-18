/*sdk白板全局对象
 * @module Global
 * @description  提供sdk白板所需的全局变量
 * @author 邱广生
 * @date 2018-04-18
 */
'use strict';
import Utils from './Utils';

let Global = {};
Global.newpptVersions = 2017091401 ; //动态ppt的版本
Global.remoteNewpptUpdateTime = 2018032113 ; //远程动态PPT文件更新时间
// Global.forceUseDocAddress = undefined ; //强制使用的文档加载地址
Global.isSkipPageing = false ; //是否正在跳转翻页
Global.isPlayVideoing = false ; //是否正在播放视频
Global.allDocumentRemarkInfoMap = new Map(); //所有文档备注的Map
Global.docAddress = /http:/.test( window.location.protocol ) ?  'http://api.roadofcloud.com:80' : 'https://api.roadofcloud.com:443'  , //文档服务器地址
Global.laterAddressList = []; //不在sdk提供的文档地址列表里的地址列表
Global.backupDocAddressList = []; //备份文档地址列表
Global.docAddressList = [] ; //文档地址列表,下标0：正常文档地址 ，下标1：备份文档地址
Global.hasGetDocAddressIndexByLocalStorage = false ; //是否从本地存储中获取过文档地址索引
Global.docAddressKey = '' ;  //文档地址列表索引值
Global.localStorageDocAddressKey = '' ;  //本地缓存的文档地址列表索引值
Global.nowUseDocAddress = Utils.getItem(Global.docAddressList,Global.docAddressKey) ; //现在使用的文档地址
Global.showPageFromId = undefined; //翻页者的id
Global.preloadFile = null; // 课件预加载文件信息
Global.extendShowPageFromId = undefined; //扩展白板翻页者的id
Global.protocol = '';
Global.port = '';

window.WBGlobal= Global;
export default Global;