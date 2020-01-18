/**
 * SDK常量
 * @class L.Constant
 * @description   提供常量存储对象
 * @author QiuShao
 * @date 2017/7/29
 */
'use strict';
var L = L || {};
L.Constant = (function () {
    return {
        clientType:{
            ios:'ios' ,
            android:'android' ,
		},
		IOS:'ios' ,
        ANDROID:'android' ,
        LOGLEVEL:{
            DEBUG:0, //debug 级别日志
            TRACE: 1, //trace 级别日志
            INFO: 2, //info 级别日志
            WARNING: 3, //warning 级别日志
            ERROR: 4, //error 级别日志
            NONE: 5 //不打印日志
        }
    };
}(L));
