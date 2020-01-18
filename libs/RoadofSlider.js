/*Slider工具
 * @module RoadofSlider
 * @description  Slider工具
 * @author 李珂
 * @date 2018-05-05
 */
'use strict';
window.RoadofSlider = function (data){
    var that = {} ;
    var btn='',bar='',track='',txtValue='';
    var step='',mark='',rail='',can=false;
    var round=100,discrepancy=100;
    var sliderContainer=document.getElementById(data.sliderContainer.id);
    sliderContainer.classList.add('custom-ys-volume-slider-container');
    if(data.sliderContainer){
        if(data.sliderContainer.direction==='vertikal'){
            sliderContainer.classList.add('vertikal');
        }
    }
    bar=document.createElement('div');
    bar.classList.add('custom-ys-rc-slider','custom-ys-slider','custom-ys-detection-device')
    if(data.sliderContainer.direction==='vertikal'){
        bar.classList.add('vertikal');
    }
    rail=document.createElement('div');
    rail.classList.add('custom-ys-rc-slider-rail');
    if(data.sliderContainer.direction==='vertikal'){
        rail.classList.add('vertikal');
    }
    track=document.createElement('div');
    track.classList.add('custom-ys-rc-slider-track');
    if(data.sliderContainer.direction==='vertikal'){
        track.classList.add('vertikal');
    }
    step=document.createElement('div');
    step.classList.add('custom-ys-rc-slider-step');
    if(data.sliderContainer.direction==='vertikal'){
        step.classList.add('vertikal');
    }
    btn=document.createElement('div');
    btn.classList.add('custom-ys-rc-slider-handle');
    if(data.sliderContainer.direction==='vertikal'){
        btn.classList.add('vertikal');
    }
    mark=document.createElement('div');
    mark.classList.add('custom-ys-rc-slider-mark');
    if(data.sliderContainer.direction==='vertikal'){
        mark.classList.add('vertikal');
    }
    bar.appendChild(rail);
    bar.appendChild(track);
    bar.appendChild(step);
    bar.appendChild(btn);
    bar.appendChild(mark);
    sliderContainer.appendChild(bar);
    var g = document, b = window, m = Math;
    bar.onmousedown=function(e){
        can=true
        if (data.sliderContainer.direction === 'vertikal') {
            if (data.onBeforeChange) {
                data.onBeforeChange(discrepancy);
                // console.log('SVonBeforeChange',discrepancy)
            }
            var y = (e || b.event).clientY;
            var barheight = bar.offsetHeight;
            discrepancy = m.round(((bar.getBoundingClientRect().bottom - y) / barheight) * 100);
            if (discrepancy > 100) {
                discrepancy = 100;
            } else if (discrepancy < 0) {
                discrepancy = 0;
            }
            btn.style.bottom = discrepancy + '%';
            track.style.height = discrepancy + '%';
            bar.onmouseup = function (event) {
                if(can){
                    if (data.onAfterChange) {
                        data.onAfterChange(discrepancy);
                        // console.log('SVonAfterChange', discrepancy)
                    }
                }
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return false;
            };
        }
        else {
            if (data.onBeforeChange) {
                data.onBeforeChange(discrepancy);
                // console.log('SonBeforeChange', discrepancy)
            }
            var x = (e || b.event).clientX;
            var barwidth = bar.offsetWidth;
            discrepancy = m.round(((x - bar.getBoundingClientRect().left) / barwidth) * 100);
            if (discrepancy > 100) {
                discrepancy = 100;
            } else if (discrepancy < 0) {
                discrepancy = 0;
            }
            btn.style.left = discrepancy + '%';
            track.style.width = discrepancy + '%';
            bar.onmouseup = function () {
                if(can){
                    if (data.onAfterChange) {
                        data.onAfterChange(discrepancy);
                        // console.log('SonAfterChange', discrepancy)
                    }
                }

            };
        }
        if (e && e.stopPropagation) {
            e.stopPropagation()
        }
        else {
            window.event.cancelBubble = true;
        }

    }
    btn.onclick = function (e) {
        if ( e && e.stopPropagation ){
            e.stopPropagation()}
        else {
            window.event.cancelBubble = true;
        }
    }
    btn.onmousedown = function (e) {
        var canDrag=false
        if(data.sliderContainer.direction==='vertikal')
        {
            if(data.onBeforeChange){
                data.onBeforeChange(round);
                // console.log('BSVertikalonBeforeChange',round)
            }
            var y = (e || b.event).clientY;
            var l = btn.offsetTop;
            var barhidth = bar.offsetHeight;
            var btnhidth = btn.offsetHeight;
            var max = barhidth - btnhidth;
            var discrepancy = barhidth - max;
            document.onmousemove = function (e) {
                var thisY = (e || b.event).clientY;
                var to = m.min(max, m.max(-btnhidth, l + (thisY - y)));
                round=100-m.round(((to+discrepancy)/barhidth)*100);
                if(round>100){
                    round=100;
                }else if(round<0){
                    round=0;
                }

                btn.style.bottom = 'calc(('+round+ '%) - 3px)';
                track.style.height =round + '%';
                if(data.onChange){
                    data.onChange(round)
                    // console.log('BSVvertikalonChange',round)
                }
                //此句代码可以除去选中效果
                b.getSelection ? b.getSelection().removeAllRanges() : g.selection.empty();
                canDrag = true
            };
            //注意此处是document 才能有好的拖动效果
            document.onmouseup = function(){
                document.onmousemove=null;
                if(data.onAfterChange){
                    data.onAfterChange(round)
                    // console.log('BSVvertikonAfterChange', round)
                }
                document.onmouseup = null;
            };
        }
        else{
            if(data.onBeforeChange&&canDrag){
                data.onBeforeChange(round);
                // console.log('BSonBeforeChange',round)
            }
            var x = (e || b.event).clientX;
            var l = btn.offsetLeft;
            var barwidth = bar.offsetWidth;
            var btnwidth = btn.offsetWidth;
            var max = bar.offsetWidth - this.offsetWidth;
            var discrepancy = barwidth - max;
            document.onmousemove = function (e) {
                var thisX = (e || b.event).clientX;
                var to = m.min(max, m.max(-btnwidth, l + (thisX - x)));
                round=m.round(((to+discrepancy)/barwidth)*100);
                if(round>100){
                    round=100;
                }else if(round<0){
                    round=0;
                }
                btn.style.left = round+ '%';
                track.style.width =round + '%';
                if(data.onChange){
                    data.onChange(round);
                    // console.log('BSonChange',round)
                }
                //此句代码可以除去选中效果
                b.getSelection ? b.getSelection().removeAllRanges() : g.selection.empty();
                canDrag = true
            };
            //注意此处是document 才能有好的拖动效果
            document.onmouseup = function () {
                document.onmousemove = null;
                if (canDrag&&data.onAfterChange) {
                    data.onAfterChange(round)
                    // console.log('BSonAfterChange', round)
                }
                document.onmouseup = null;
            };

        }
        if ( e && e.stopPropagation ){
            e.stopPropagation()}
        else {
            window.event.cancelBubble = true;
        }

    };
    btn.ontouchstart = function (e) {
        can=false
        if(data.sliderContainer.direction==='vertikal') {
            if(data.onBeforeChange){
                data.onBeforeChange(round);
                // console.log('BTVertikalonBeforeChange',round)
            }
            var y = (e || b.event).touches[0].clientY;
            var l = btn.offsetTop;
            var barhidth = bar.offsetHeight;
            var btnhidth = btn.offsetHeight;
            var max = barhidth - btnhidth;
            var discrepancy = barhidth - max;
            document.ontouchmove = function (e) {
                var thisY = (e || b.event).touches[0].clientY;
                var to = m.min(max, m.max(-btnhidth, l + (thisY - y)));
                round=100-m.round(((to+discrepancy)/barhidth)*100);
                if(round>100){
                    round=100;
                }else if(round<0){
                    round=0;
                }
                btn.style.bottom = 'calc(('+round+ '%) - 3px)';
                track.style.height =round + '%';
                if(data.onChange){
                    data.onChange(round)
                    // console.log('BTVvertikalonChange',round)
                }
                // musicAudio.volume = round/100
                //此句代码可以除去选中效果
                b.getSelection ? b.getSelection().removeAllRanges() : g.selection.empty();
            };
            //注意此处是document 才能有好的拖动效果
            document.ontouchend = function(){
                document.ontouchmove=null;
                if(data.onAfterChange){
                    data.onAfterChange(round)
                    // console.log('BTVvertikalonAfterChange',round)
                }
                document.ontouchend = null;
            };
        }
        else{
            if(data.onBeforeChange){
                data.onBeforeChange(round);
                // console.log('BTonBeforeChange',round)
            }
            var x = (e || b.event).touches[0].clientX;
            var l = btn.offsetLeft;
            var barwidth = bar.offsetWidth;
            var btnwidth = btn.offsetWidth;
            var max = bar.offsetWidth - this.offsetWidth;
            var discrepancy = barwidth - max;
            btn.ontouchmove = function (e) {
                var thisX = (e || b.event).touches[0].clientX;
                var to = m.min(max, m.max(-btnwidth, l + (thisX - x)));
                round=m.round(((to+discrepancy)/barwidth)*100);
                if(round>100){
                    round=100;
                }else if(round<0){
                    round=0;
                }

                btn.style.left = round+ '%';
                track.style.width =round + '%';
                if(data.onChange){
                    data.onChange(round);
                    // console.log('BTonChange',round)
                }

                // musicAudio.volume = round/100
                //此句代码可以除去选中效果
                b.getSelection ? b.getSelection().removeAllRanges() : g.selection.empty();
            };
            //注意此处是document 才能有好的拖动效果
            document.ontouchend = function(){
                document.ontouchmove=null;
                if (data.onAfterChange) {
                        data.onAfterChange(round)
                        // console.log('BTonAfterChange', round)
                }
                    document.ontouchend = null;
                };

        }
        if ( e && e.stopPropagation ){
            e.stopPropagation()}
        else {
            window.event.cancelBubble = true;
        }
    };

    that.setProgress =function(volume){
        if(volume !== undefined){
            if (data.sliderContainer.direction === 'vertikal') {
                btn.style.bottom = volume + '%';
                track.style.height = volume + '%';
            }else{
                btn.style.left = volume + '%';
                track.style.width = volume + '%';
            }
        }
    };
    // that.setProgress( 0 );
    return that ;
};

