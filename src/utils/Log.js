/**
 * 云枢开发使用的日志类
 * @module LogDevelopment
 * @description   提供 云枢开发使用的日志类
 * @author QiuShao
 * @date 2017/7/20
 */
import Utils from './Utils';

const LogDevelopment = window.Log || {
    error:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.error.apply(console, args);
    } ,
    log:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.log.apply(console, args);
    } ,
    info:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.info.apply(console, args);
    } ,
    warn:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.warn.apply(console, args);
    } ,
    warning:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.warn.apply(console, args);
    } ,
    trace:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.trace.apply(console, args);
    } ,
    debug:function(){
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
        }
        console.debug.apply(console, args);
    } ,
};
window.Log = LogDevelopment ;
export default LogDevelopment ;
