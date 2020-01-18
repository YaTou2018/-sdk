/*Drag工具
 * @module RoadofDrag
 * @description  拖拽工具
 * @author 支祥
 * @date 2018-05-05
 */
'use strict';
window.RoadofDrag=function(element,options){
    var that=this;
    options = options || {} ;
    options.containerData = options.containerData || {} ;
    that.flag=false;
    that.element = element ;
    that.leftPercent= options.containerData.left !== undefined ? options.containerData.left / 100 : 0 ;
    that.topPercent=  options.containerData.top !== undefined ? options.containerData.top / 100 : 0 ;
    that.disabled = options.disabled !== undefined ? options.disabled : false ;
    if( typeof element === 'string' ){
        that.element = document.getElementById(element);
    }
    if( !that.element ){
        console.error( 'parameter elementId cannot find a node!' );
        return ;
    }
    if(options.containerData.parentNodeID !== undefined){
        that.containerElement = options.containerData.parentNodeID ;
        if( typeof options.containerData.parentNodeID === 'string' ){
            that.containerElement = document.getElementById( options.containerData.parentNodeID );
        }
    }else{
        that.containerElement=that.element.parentNode;
    }

    if( that.containerElement ){
        that.containerElement.className = ( that.containerElement.className.replace('roadof-cloud-drag-parent-container' , '') +  ' roadof-cloud-drag-parent-container ')  ;
    }

    that.cur={x:0,y:0};

    that.updateDisabled = function (disabled) {
        that.disabled = disabled ;
    };
    that.destroy = function () {
        window.removeEventListener('resize' , that.resizeCallback , false);
        that.element.removeEventListener("mousedown",that.mousedownOrTouchstartCallback ,false);
        that.element.removeEventListener("touchstart" ,that.mousedownOrTouchstartCallback ,false);
        that.element.removeEventListener("touchmove",that.mousemoveOrTouchmoveEventCallback,false);
        that.element.removeEventListener("touchend",that.mouseupOrTouchendEventCallback,false);
        document.documentElement.removeEventListener("mousemove",that.mousemoveOrTouchmoveEventCallback,false);
        document.documentElement.removeEventListener("mouseup",that.mouseupOrTouchendEventCallback,false);
    };
    that.resize = function () {
        that.element.style.left=(that.containerElement.offsetWidth-that.element.offsetWidth)*that.leftPercent +"px";
        that.element.style.top=(that.containerElement.offsetHeight-that.element.offsetHeight)*that.topPercent+"px";
    };
    that.setPosition=function(left,top){
        that.leftPercent=left/100;
        that.topPercent=top/100;
        that.element.style.left=(that.containerElement.offsetWidth-that.element.offsetWidth)*that.leftPercent +"px";
        that.element.style.top=(that.containerElement.offsetHeight-that.element.offsetHeight)*that.topPercent+"px";
    };
    that.down=function(event){
        if( event.type === 'mousedown' ){
            document.documentElement.addEventListener("mousemove",that.mousemoveOrTouchmoveEventCallback,false);
            document.documentElement.addEventListener("mouseup",that.mouseupOrTouchendEventCallback,false);
        }

        // that.downTimer = setTimeout( function () {
            that.element.setAttribute('roadofDragState' , 'onBeforeDrag');
            if( that.containerElement ){
                that.containerElement.setAttribute('roadofDragParentState' , 'onBeforeDrag');
            }
            that.flag=true;
            var touch;
            if(event.touches){
                touch=event.touches[0];
            }else{
                touch=event;
            }
            that.cur.x=touch.clientX;
            that.cur.y = touch.clientY;
            that.dx = that.element.offsetLeft;
            that.dy = that.element.offsetTop;
        /*if(options.onBeforeDrag){
            options.onBeforeDrag(that.leftPercent*100,that.topPercent*100);
        }*/
        if( event.type === 'mousedown' ){
            if(options.onBeforeDrag){
                options.onBeforeDrag(that.leftPercent*100,that.topPercent*100);
            }
        }else if(event.type === 'touchstart') {
            that.flag = false;
            clearTimeout( that.downTimer );
            that.downTimer = setTimeout( function () {
                that.flag = true;
                that.element.style.pointerEvents = 'none';
                that.element.style.boxShadow = '0 0 0.2rem 0.05rem #222';
                that.element.style.transform = 'scale(1.05)';
                if(options.onBeforeDrag){
                    options.onBeforeDrag(that.leftPercent*100,that.topPercent*100);
                }
            } , 500 ) ;
        }
    };
    that.move=function( event ){
        if (event.type === 'touchmove') {
            var offsetX = Math.abs(event.touches[0].clientX - that.cur.x);
            var offsetY = Math.abs(event.touches[0].clientY - that.cur.y);
            if (Math.hypot(offsetX,offsetY) >= 40) { // 所有参数的平方和的平方根。
                clearTimeout(that.downTimer);
                that.downTimer = undefined ;
            }
        }
        if(that.flag){
            that.element.setAttribute('roadofDragState' , 'onDrag');
            if( that.containerElement ){
                that.containerElement.setAttribute('roadofDragParentState' , 'onDrag');
            }
            var touch ;
            if(event.touches){
                touch = event.touches[0];
            }else {
                touch = event;
            }
            if(options.onDrag){
                options.onDrag(that.leftPercent*100,that.topPercent*100);
            }
            //计算边界值
            var maxX=that.containerElement.offsetWidth-that.element.offsetWidth;
            var maxY=that.containerElement.offsetHeight-that.element.offsetHeight;
            that.nx = touch.clientX - that.cur.x;
            that.ny = touch.clientY - that.cur.y;
            var x = that.dx+that.nx;
            var y = that.dy+that.ny;
            var x = Math.min(Math.max(0,x),maxX);
            var y = Math.min(Math.max(0,y),maxY);

            that.element.style.left = x+"px";
            that.element.style.top = y +"px";
            //计算百分比定位
            that.leftPercent=x/(that.containerElement.offsetWidth-that.element.offsetWidth);
            that.topPercent=y/(that.containerElement.offsetHeight-that.element.offsetHeight);

        }
    };
    that.end=function(event){
        if( event.type === 'mouseup' ){
            document.documentElement.removeEventListener("mousemove",that.mousemoveOrTouchmoveEventCallback,false);
            document.documentElement.removeEventListener("mouseup",that.mouseupOrTouchendEventCallback,false);
        }
        if( event.type === 'touchend' ){
            clearTimeout( that.downTimer );
            that.downTimer = undefined ;
            that.flag = false;
            that.element.style.pointerEvents = 'auto';
            that.element.style.boxShadow = '0 0 0 0 #222';
            that.element.style.transform = 'scale(1)';
        }
        if( that.flag ){
            that.element.setAttribute('roadofDragState' , 'onAfterDrag');
            if( that.containerElement ){
                that.containerElement.setAttribute('roadofDragParentState' , 'onAfterDrag');
            }
            that.flag = false;
            if(options.onAfterDrag){
                options.onAfterDrag(that.leftPercent*100,that.topPercent*100);
            }
        }
    };
    that.resizeCallback = function(event){
        that.resize();
    };
    that.mousedownOrTouchstartCallback = function(event){
        if( !that.flag && that.disabled ){
            return ;
        }
        try{
            that.down(event);
        }catch (err){
            console.error(err);
        }
        return false;
    } ;
    that.mousemoveOrTouchmoveEventCallback = function(event){
        if( !that.flag && that.disabled ){
            return ;
        }
        try{
            that.move(event);
        }catch (err){
            console.error(err);
        }
        return false;
    };
    that.mouseupOrTouchendEventCallback =  function(event){
        if( !that.flag && that.disabled ){
            return ;
        }
        try{
            that.end(event);
        }catch (err){
            console.error(err);
        }
        return false;
    };
    window.addEventListener('resize' , that.resizeCallback , false);
    that.element.addEventListener("mousedown",that.mousedownOrTouchstartCallback ,false);
    that.element.addEventListener("touchstart" ,that.mousedownOrTouchstartCallback ,false);
    that.element.addEventListener("touchmove",that.mousemoveOrTouchmoveEventCallback,false);
    that.element.addEventListener("touchend",that.mouseupOrTouchendEventCallback,false);
    that.element.setAttribute( "roadofDrag" , 'true' );
    that.resize();
    return that;
};