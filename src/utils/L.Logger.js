/*global document, console*/
'use strict';
var L = L || {};
var TK = TK || {} ;
/*
 * API to write logs based on traditional logging mechanisms: debug, trace, info, warning, error
 */
L.Logger = (function (L) {
    var DEBUG = 0,
        TRACE = 1,
        INFO = 2,
        WARNING = 3,
        ERROR = 4,
        NONE = 5,
        enableLogPanel,
        setLogLevel,
        setOutputFunction,
        setLogPrefix,
        outputFunction,
        logPrefix = '',
        print,
        debug,
        trace,
        info,
        log,
        warning,
        error , 
		setLogDevelopment,
		developmentEnvironment = false;

    // By calling this method we will not use console.log to print the logs anymore.
    // Instead we will use a <textarea/> element to write down future logs
    enableLogPanel = function () {
        L.Logger.panel = document.createElement('textarea');
        L.Logger.panel.setAttribute('id', 'licode-logs');
        L.Logger.panel.setAttribute('style', 'position:fixed;left:0;top:0;width: 100%; height: 100%; display: none;z-index:9999;  user-select: text ;-webkit-user-select: text; -moz-user-select: text ; -ms-user-select: text ;');
        L.Logger.panel.setAttribute('rows', 20);
        L.Logger.panel.setAttribute('cols', 20);
        L.Logger.panel.setAttribute('readOnly', true);
        if(TK.SDKNATIVENAME === 'QtNativeClientRoom'){
            document.oncontextmenu = null ;
            document.oncontextmenu = function() {return true;};
        }
        var button = document.createElement('button');
        button.innerHTML = 'open log';
        button.setAttribute('style', 'position:fixed;left:0;top:0;z-index:10000;background:gold;');
        button.onclick = function () {
            if(button.innerHTML === 'open log'){
                L.Logger.panel.style.display = 'block';
                button.innerHTML = 'close log';
            }else{
                L.Logger.panel.style.display = 'none';
                button.innerHTML = 'open log';
            }
        };
        document.body.appendChild(button);
        document.body.appendChild(L.Logger.panel);
    };

    // It sets the new log level. We can set it to NONE if we do not want to print logs
    setLogLevel = function (level) {
        if (level > L.Logger.NONE) {
            level = L.Logger.NONE;
        } else if (level < L.Logger.DEBUG) {
            level = L.Logger.DEBUG;
        }
        L.Logger.logLevel = level;
    };
	
	setLogDevelopment = function(isDevelopmentEnvironment){
		developmentEnvironment = isDevelopmentEnvironment ;
	};
	
    outputFunction = function (args , level) {
        try{
            switch (level){
                case L.Logger.DEBUG:
                    developmentEnvironment ? console.warn.apply(console, args) : console.debug.apply(console, args)  ;
                    break;
                case L.Logger.TRACE:
                    console.trace.apply(console, args);
                    break;
                case L.Logger.INFO:
                    developmentEnvironment ? console.warn.apply(console, args) :  console.info.apply(console, args);
                    break;
                case L.Logger.WARNING:
                    console.warn.apply(console, args);
                    break;
                case L.Logger.ERROR:
                    console.error.apply(console, args);
                    break;
                case L.Logger.NONE:
					console.warn("log level is none!");
                    break;
                default:
                    developmentEnvironment ? console.warn.apply(console, args) : console.log.apply(console, args);
                    break;
            }
        }catch (e){
            console.log.apply(console, args);
        }
    };

    setOutputFunction = function (newOutputFunction) {
        outputFunction = newOutputFunction;
    };

    setLogPrefix = function (newLogPrefix) {
        logPrefix = newLogPrefix;
    };

    // Generic function to print logs for a given level:
    //  L.Logger.[DEBUG, TRACE, INFO, WARNING, ERROR]
    print = function (level) {
        var out = logPrefix;
        if (level < L.Logger.logLevel) {
            return;
        }
        if (level === L.Logger.DEBUG) {
            out = out + 'DEBUG('+new Date().toLocaleString()+')';
        } else if (level === L.Logger.TRACE) {
            out = out + 'TRACE('+new Date().toLocaleString()+')';
        } else if (level === L.Logger.INFO) {
            out = out + 'INFO('+new Date().toLocaleString()+')';
        } else if (level === L.Logger.WARNING) {
            out = out + 'WARNING('+new Date().toLocaleString()+')';
        } else if (level === L.Logger.ERROR) {
            out = out + 'ERROR('+new Date().toLocaleString()+')';
        }
        out = out + ':';
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        var tempArgs = args.slice(1);
        args = [out].concat(tempArgs);
        if (L.Logger.panel !== undefined) {
            var tmp = '';
            for (var idx = 0; idx < args.length; idx++) {
                tmp = tmp + (typeof args[idx] === 'object'?L.Utils.toJsonStringify( args[idx]) :  args[idx]);
            }
            L.Logger.panel.value = L.Logger.panel.value + '\n' + tmp;
            outputFunction.apply(L.Logger, [args , level] );
        } else {
            outputFunction.apply(L.Logger, [args , level] );
        }
    };

    // It prints debug logs
    debug = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        L.Logger.print.apply(L.Logger,[L.Logger.DEBUG].concat(args));
    };

    // It prints trace logs
    trace = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        L.Logger.print.apply(L.Logger,[L.Logger.TRACE].concat(args));
    };

    // It prints info logs
    info = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        L.Logger.print.apply(L.Logger,[L.Logger.INFO].concat(args));
    };

    // It prints warning logs
    warning = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        L.Logger.print.apply(L.Logger,[L.Logger.WARNING].concat(args));
    };

    // It prints error logs
    error = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        L.Logger.print.apply(L.Logger,[L.Logger.ERROR].concat(args));
    };

    return {
        DEBUG: DEBUG,
        TRACE: TRACE,
        INFO: INFO,
        WARNING: WARNING,
        ERROR: ERROR,
        NONE: NONE,
		setLogDevelopment:setLogDevelopment , 
        enableLogPanel: enableLogPanel,
        setLogLevel: setLogLevel,
        setOutputFunction: setOutputFunction,
        setLogPrefix: setLogPrefix,
        print:print ,
        debug: debug,
        trace: trace,
        info: info,
        warning: warning,
        error: error 
    };
}(L));


/*设置日志输出,通过配置项*/
TK.tkLogPrintConfig =  function (socketLogConfig , loggerConfig , adpConfig ) {
    loggerConfig = loggerConfig || {} ;
    socketLogConfig = socketLogConfig || {} ;
    adpConfig = adpConfig || {} ;
    var development = loggerConfig.development != undefined  ? loggerConfig.development : true;
    var logLevel =  loggerConfig.logLevel  != undefined  ? loggerConfig.logLevel  : 0;
    var debug = socketLogConfig.debug != undefined  ? socketLogConfig.debug  : true ;
    var webrtcLogDebug =  adpConfig.webrtcLogDebug!= undefined  ? adpConfig.webrtcLogDebug : true ;
    L.Logger.setLogDevelopment(development);
    L.Logger.setLogLevel(logLevel);
    if(L.Utils.localStorage){
        var debugStr =  debug ? '*' : 'none';
        L.Utils.localStorage.setItem('debug' ,debugStr );
    }
    window.webrtcLogDebug = webrtcLogDebug;
};


