/*global L*/
'use strict';
/*
 * Class EventDispatcher provides event handling to sub-classes.
 * It is inherited from Publisher, Room, etc.
 */
var TK = TK || {};
TK.EventDispatcher = function (spec) {
    var that = {};
    var isArray = function (object){
        return  object && typeof object==='object' &&
            typeof object.length==='number' &&
            typeof object.splice==='function' &&
            //判断length属性是否是可枚举的 对于数组 将得到false
            !(object.propertyIsEnumerable('length'));
    }
    // Private vars
    spec.dispatcher = {};
    spec.dispatcher.eventListeners = {};
    spec.dispatcher.backupListerners = {};
    // Public functions

    // It adds an event listener attached to an event type.
    that.addEventListener = function (eventType, listener , backupid ) {
        if(eventType === undefined || eventType === null){
            return;
        }
        if (spec.dispatcher.eventListeners[eventType] === undefined) {
            spec.dispatcher.eventListeners[eventType] = [];
        }
        spec.dispatcher.eventListeners[eventType].push(listener);
        if(backupid){
            if (spec.dispatcher.backupListerners[backupid] === undefined) {
                spec.dispatcher.backupListerners[backupid] = [];
            }
            spec.dispatcher.backupListerners[backupid].push({eventType:eventType ,listener:listener });
        }
    };

    // It removes an available event listener.
    that.removeEventListener = function (eventType, listener) {
        var index;
		if(!spec.dispatcher.eventListeners[eventType]){ L.Logger.info('[tk-fake-sdk]not event type: ' +eventType);  return ;} ;
        index = spec.dispatcher.eventListeners[eventType].indexOf(listener);
        if (index !== -1) {
            spec.dispatcher.eventListeners[eventType].splice(index, 1);
        }
    };
	
    // It removes all event listener.
    that.removeAllEventListener = function (eventTypeArr) {
        if( isArray(eventTypeArr) ){
            for(var i in eventTypeArr){
                var eventType = eventTypeArr[i] ;
                delete spec.dispatcher.eventListeners[eventType] ;
            }
        }else if(typeof eventTypeArr === "string"){
			delete spec.dispatcher.eventListeners[eventTypeArr] ;  
		}else if(typeof eventTypeArr === "object"){
            for(var key in eventTypeArr){
                var eventType = key  , listener = eventTypeArr[key];
                that.removeEventListener(eventType , listener);
            }
		}		  
    };

    // It dispatch a new event to the event listeners, based on the type
    // of event. All events are intended to be TalkEvents.
    that.dispatchEvent = function (event , log ) {
        var listener;
        log = log!=undefined?log:true ;
        if(log){
            L.Logger.debug('[tk-fake-sdk]dispatchEvent , event type: ' + event.type);
        }
        for (listener in spec.dispatcher.eventListeners[event.type]) {
            if (spec.dispatcher.eventListeners[event.type].hasOwnProperty(listener)) {
                spec.dispatcher.eventListeners[event.type][listener](event);
            }
        }
    };

    that.removeBackupListerner = function (backupid) {
        if(backupid){
            if( spec.dispatcher.backupListerners[backupid] ){
                for(var i=0; i<spec.dispatcher.backupListerners[backupid].length ; i++){
                    var backupListernerInfo = spec.dispatcher.backupListerners[backupid][i] ;
                    that.removeEventListener(backupListernerInfo.eventType , backupListernerInfo.listener);
                }
                spec.dispatcher.backupListerners[backupid].length = 0 ;
                delete spec.dispatcher.backupListerners[backupid] ;
            }
        }
    };

    return that;
};

// **** EVENTS ****

/*
 * Class TalkEvent represents a generic Event in the library.
 * It handles the type of event, that is important when adding
 * event listeners to EventDispatchers and dispatching new events.
 * A TalkEvent can be initialized this way:
 * var event = TalkEvent({type: "room-connected"});
 */
TK.TalkEvent = function (spec) {
    var that = {};

    // Event type. Examples are: 'room-connected', 'stream-added', etc.
    that.type = spec.type;

    return that;
};

/*
 * Class RoomEvent represents an Event that happens in a Room. It is a
 * TalkEvent.
 * It is usually initialized as:
 * var roomEvent = RoomEvent({type:"room-connected", streams:[stream1, stream2]});
 * Event types:
 * 'room-connected' - points out that the user has been successfully connected to the room.
 * 'room-disconnected' - shows that the user has been already disconnected.
 */
TK.RoomEvent = function (spec , extraSpec) {
    var that = TK.TalkEvent(spec);

    // A list with the streams that are published in the room.
    that.streams = spec.streams;
    that.message = spec.message;
    that.user = spec.user;
    if(extraSpec && typeof extraSpec === 'object'){
        for(var key in extraSpec){
            that[key] = extraSpec[key];
        }
    }
    return that;
};

/*
 * Class StreamEvent represents an event related to a stream. It is a TalkEvent.
 * It is usually initialized this way:
 * var streamEvent = StreamEvent({type:"stream-added", stream:stream1});
 * Event types:
 * 'stream-added' - indicates that there is a new stream available in the room.
 * 'stream-removed' - shows that a previous available stream has been removed from the room.
 */
TK.StreamEvent = function (spec , extraSpec) {
    var that = TK.TalkEvent(spec);

    // The stream related to this event.
    that.stream = spec.stream;
    that.message = spec.message;
    that.bandwidth = spec.bandwidth;
    that.attrs = spec.attrs ;
    if(extraSpec && typeof extraSpec === 'object'){
        for(var key in extraSpec){
            that[key] = extraSpec[key];
        }
    }
    return that;
};

/*
 * Class PublisherEvent represents an event related to a publisher. It is a TalkEvent.
 * It usually initializes as:
 * var publisherEvent = PublisherEvent({})
 * Event types:
 * 'access-accepted' - indicates that the user has accepted to share his camera and microphone
 */
TK.PublisherEvent = function (spec , extraSpec) {
    var that = TK.TalkEvent(spec);
    if(extraSpec && typeof extraSpec === 'object'){
        for(var key in extraSpec){
            that[key] = extraSpec[key];
        }
    }
    return that;
};
TK.clientSdkEventManager = TK.EventDispatcher({});
TK.clientUICoreEventManager = TK.EventDispatcher({});
TK.mobileSdkEventManager = TK.EventDispatcher({});
TK.mobileUICoreEventManager = TK.EventDispatcher({});