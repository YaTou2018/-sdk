/*dom工具类
 * @module DomUtils
 * @description  dom操作工具类
 * @author 邱广生
 * @date 2018-04-18
 */

 class DomUtils {

     /*创建节点
     * @params elementName:节点name , String
     * @params id:节点id , String
     * @params className:节点className , String
     * @params styleJson:节点style样式对象 , Json
     * */
     createElement( elementName ,  id , className , styleJson , attrsJson ){
        let ele = document.createElement(elementName) ;
        if(id !== undefined){
          ele.setAttribute('id' , id) ;
        }
         if(className !== undefined){
             ele.className = className ;
         }
         if(styleJson && typeof styleJson === 'object'){
             for(let [key,value] of Object.entries(styleJson) ){
                 ele.style[key] = value ;
             }
         }
         if(attrsJson && typeof attrsJson === 'object'){
             for(let [key,value] of Object.entries(attrsJson) ){
                 ele.setAttribute(key , value);
             }
         }
         return ele ;
     } ;
     
     /*添加子节点*/
     appendChild( fatherElement  , childElement ){
         try{
             if(fatherElement && childElement && fatherElement.appendChild){
                fatherElement.appendChild(childElement);
             }
         }catch (error){
             L.Logger.error('[sdk-whiteboard]DoomUtils.appendChild error ' , error);
         }
     }

     /*删除子节点*/
     removeChild( childElement , fatherElement  ){
         try{
             if(childElement){
                if(fatherElement && fatherElement.removeChild){
                    fatherElement.removeChild(childElement);
                }else if(childElement.parentNode && childElement.parentNode.removeChild ){
                    childElement.parentNode.removeChild(childElement);
                }
             }
         }catch (error){
             L.Logger.error('[sdk-whiteboard]DoomUtils.removeChild error ' , error);
         }
     }

     /*删除所有子节点*/
     removeAllChild(fatherElement){
         if(fatherElement){
             fatherElement.innerHTML = '' ;
         }
     }

     hasClass(element , className){
         if(element && typeof className === 'string'){
             return ( new RegExp(' '+className+' ').test(element.className) ||  new RegExp(' '+className).test(element.className) ||  new RegExp(className+' ').test(element.className) );
         }else{
             return false ;
         }
     }

     /*重置样式*/
     resetClass(element , className){
         if(element && typeof className === 'string'){
             element.className = ' '+className ;
         }
     }
     
     /*添加样式*/
     addClass(element , className){
         if(element){
             if(typeof className === 'string'){
                 if(!element.className){
                     element.className = ' '+className ;
                 }else{
                     element.className = ( element.className.replace(new RegExp(' '+className , 'g' ) , '').replace(new RegExp(className+' ' , 'g') , '') )+  ' ' + className ;
                 }
             }else if( Array.isArray(className) ){
                 for(let cls of className){
                     if(!element.className){
                         element.className = ' ' ;
                     }else{
                         element.className = ( element.className.replace(new RegExp(' '+cls , 'g' ) , '').replace(new RegExp(cls+' ' , 'g') , '') )+  ' ' + cls ;
                     }
                 }
             }
         }
     }
     
     /*添加样式*/
     removeClass(element , className){
         if(element){
             if(typeof className === 'string'){
                 if(!element.className){
                     element.className = ' ' ;
                 }else{
                     element.className = ( element.className.replace(new RegExp(' '+className , 'g' ) , '').replace(new RegExp(className+' ' , 'g') , '') ) ;
                 }
             }else if( Array.isArray(className) ){
                 for(let cls of className){
                     if(!element.className){
                         element.className = ' ' ;
                     }else{
                         element.className = ( element.className.replace(new RegExp(' '+cls , 'g' ) , '').replace(new RegExp(cls+' ' , 'g') , '') ) ;
                     }
                 }
             }
         }
     }

     /*更新style*/
     updateStyle(element , updateStyleJson){
         if(element && updateStyleJson && typeof updateStyleJson === 'object'){
             for(let [key,value] of Object.entries(updateStyleJson) ){
                 element.style[key] = value ;
             }
         }
     }

     show(element){
         if( Array.isArray(element) ){
             for(let ele of element){
                 this.updateStyle(ele , {
                     display:''
                 });
             }
         }else{
             this.updateStyle(element , {
                 display:''
             });
         }
     }

     hide(element){
         if( Array.isArray(element) ){
             for(let ele of element){
                 this.updateStyle(ele , {
                     display:'none'
                 });
             }
         }else{
             this.updateStyle(element , {
                 display:'none'
             });
         }
     }

 };

export default new DomUtils() ;