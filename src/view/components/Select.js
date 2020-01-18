/*Select下拉框组件
 * @module DocumentToolbarView
 * @description  sdk白板文档翻页等工具条
 * @author 邱广生
 * @date 2018-04-25
 */
'use strict';
import RoadofcloudReact from './RoadofcloudReact';
import DomUtils from '../../utils/DomUtils';

class SelectDumb extends RoadofcloudReact{
    constructor(parentNode , props = {} ){
        super(props);
        this.parentNode = parentNode ;
        this.elements = {};
        this.state = {
            extendShow:false ,
        };
        this.listDirection = 'down' ; //down , up
        this._createConnectElements();
        this.render() ;
    }

    componentDidUpdateState(prevState){
        if(prevState.extendShow !== this.state.extendShow){
            this._noticeSelectExtendListShowOrHide(this.state.extendShow);
        }
    };

    componentDidUpdateProps(prevProps){
        if( prevProps.selectOptions !== this.state.selectOptions ){
            let {  optionClassName , selectOptions = []  ,  disabled  , currentValue  } = this.props  ;
            DomUtils.removeAllChild( this.elements.selectListViewElement  );
            for(let index=0 ; index < selectOptions.length ; index++){
                let optionElement =  DomUtils.createElement('li' ,  undefined , "select-option "  + (optionClassName || ' ') + (currentValue === selectOptions[index].value ? ' selected':' ' ) ); //option 节点
                optionElement.innerHTML = selectOptions[index].value ;
                if(!disabled){
                    optionElement.onclick = this.optionOnClick.bind(this , selectOptions[index].value  , index) ;
                }else{
                    optionElement.onclick = undefined ;
                }
                DomUtils.appendChild( this.elements.selectListViewElement  ,  optionElement );
            }
        }
    }

    destroyView(){
        DomUtils.removeChild(this.elements.selectViewRootElement , this.parentNode );
        for(let key in this.elements){
            this.elements[key] = undefined ;
            delete this.elements[key] ;
        }
    };

    forceHideSelectExtendList(){
        this.setState({extendShow:false});
    }

    currentTextOnClick(event){
        if( this.props.disabled ){
            return false;
        }
        this.setState({extendShow:!this.state.extendShow});
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    };

    optionOnClick(selectValue , index , event){
        if( this.props.disabled ){
            return false;
        }
        if(selectValue !== this.props.currentValue){
            if(this.props.onChange && typeof this.props.onChange === 'function'){
                this.props.onChange(selectValue , index);
            }
        }
        this.setState({extendShow:false});
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    };

    selectContainerOnMouseLeave(event){
        this.setState({extendShow:false});
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        return false ;
    };

    _noticeSelectExtendListShowOrHide(extendShow){
        if(this.props.noticeSelectExtendListShowOrHide && typeof this.props.noticeSelectExtendListShowOrHide === 'function'){
            this.props.noticeSelectExtendListShowOrHide(extendShow);
        }
    };

    _getRect ( element ){
        let rect = element.getBoundingClientRect();
        let clientTop = document.documentElement.clientTop;
        let clientLeft = document.documentElement.clientLeft;
        return { // 兼容ie多出的两个px
            top : rect.top - clientTop, // 距离顶部的位置
            bottom : rect.bottom - clientTop, // 距离顶部加上元素本身的高度就等于bottom的位置
            left : rect.left - clientLeft, // 距离左边的位置
            right : rect.right - clientLeft , // 距离右边的位置就是 距离左边的位置加上元素本身的宽度
            width:rect.width , //元素宽度
            height:rect.height , //元素高度
        };
    };


    /*创建连接节点*/
    _createConnectElements(){
        this.elements.selectViewRootElement = DomUtils.createElement('article' , this.props.id , undefined , {}); //select根节点
        this.elements.currentSelectTextElement =  DomUtils.createElement('button' ,undefined ,  undefined , {}); //当前选中的文本节点
        this.elements.arrowElement =  DomUtils.createElement('span'); //箭头
        this.elements.arrowElement.innerHTML = '<em class="arrow "></em>';
        this.elements.selectListViewElement =  DomUtils.createElement('ol'); //select list 节点
        DomUtils.appendChild( this.elements.selectViewRootElement  ,  this.elements.currentSelectTextElement );
        DomUtils.appendChild( this.elements.selectViewRootElement  ,  this.elements.arrowElement );
        DomUtils.appendChild( this.elements.selectViewRootElement  ,  this.elements.selectListViewElement );
        DomUtils.appendChild( this.parentNode ,  this.elements.selectViewRootElement );

        this.elements.currentSelectTextElement.onclick = this.currentTextOnClick.bind(this) ;
        this.elements.selectViewRootElement.onmouseleave = this.selectContainerOnMouseLeave.bind(this) ;
    };

    render(){
        let { className  ,  disabled  , currentValue = ''  } = this.props  ;
        DomUtils.updateStyle( this.elements.selectListViewElement  , {
            display:disabled?'none':(this.state.extendShow?'block':'none') ,
        });
        this.listDirection = this.props.listDirection || this.listDirection ;
        DomUtils.resetClass( this.elements.selectViewRootElement ,   'roadofcloud-sdk-whiteboard '+' select-root ys-select-container clear-float '   + ( disabled?' disabled ':'  ') + (className || '')  + ( disabled ? ' hideExtendList':(this.state.extendShow?' showExtendList':' hideExtendList') ) ) ;
        DomUtils.resetClass( this.elements.currentSelectTextElement ,  'roadofcloud-sdk-whiteboard '+' select-btn current-select-text-btn ' + "current-select-text "+(disabled?'disabled ':' ') ) ;
        DomUtils.resetClass( this.elements.arrowElement ,  "arrow-container " +(disabled?'disabled ':' ') ) ;
        DomUtils.resetClass( this.elements.selectListViewElement ,  "select-extend-list-container " + (  this.props.isMobile ? ' ' : 'custom-scroll-bar' )   + (disabled?' disabled ':'  ')+ (disabled ? ' hide':(this.state.extendShow?' show':' hide') ) ) ;
        if(disabled){
            this.elements.currentSelectTextElement.setAttribute('disabled' , 'true') ;
        }else{
            this.elements.currentSelectTextElement.removeAttribute('disabled') ;
        }
        this.elements.currentSelectTextElement.value = currentValue;
        this.elements.currentSelectTextElement.innerText = currentValue;
        if( this.props.parentNode && this.state.extendShow && !this.props.disabled && !this.props.listDirection ){
            let parentNodeRect = this._getRect( this.props.parentNode );
            let selectListViewElementRect = this._getRect(this.elements.selectListViewElement );
            if( ( selectListViewElementRect.top - parentNodeRect.top ) > (parentNodeRect.height - selectListViewElementRect.height + 5 ) ){
                this.listDirection = 'up';
            }else{
                this.listDirection = 'down';
            }
            DomUtils.removeClass( this.elements.selectViewRootElement , ['down','up'] );
            DomUtils.removeClass( this.elements.selectListViewElement , ['down','up'] );
            DomUtils.addClass( this.elements.selectViewRootElement , this.listDirection );
            DomUtils.addClass( this.elements.selectListViewElement , this.listDirection );
        }else{
            DomUtils.removeClass( this.elements.selectViewRootElement , ['down','up'] );
            DomUtils.removeClass( this.elements.selectListViewElement , ['down','up'] );
            DomUtils.addClass( this.elements.selectViewRootElement , this.listDirection );
            DomUtils.addClass( this.elements.selectListViewElement , this.listDirection );
        }
    }

}

export default SelectDumb ;