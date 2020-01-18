/**
 * 云枢虚拟React
 * @module VideoPlayerSmart
 * @description   提供 VideoPlayer播放器所需组件
 * @author 邱广生
 * @date 2018/05/01
 */

class RoadofcloudReact{
    constructor(props){
        if( typeof props === 'object' && !Array.isArray(props) ){
            this.props = Object.shallowAssign({} , props) ;
        }else{
            this.props = {};
        }
        this.state = typeof this.state === 'object' && !Array.isArray(this.state) ? this.state : {};
    }

    setState(state){
        let prevState = Object.deepAssign({} , this.state);
        Object.shallowAssign(this.state , state);
        let isNotRender = false ;
        if( this.shouldComponentUpdateState && typeof this.shouldComponentUpdateState === 'function' ){
            isNotRender = this.shouldComponentUpdateState(prevState);
        }
        if( !isNotRender && this.render && typeof this.render === 'function'){
            this.render();
        }
        if( this.componentDidUpdateState && typeof this.componentDidUpdateState === 'function'){
            this.componentDidUpdateState(prevState);
        }
    }

    setProps(props){
        let prevProps = Object.deepAssign({} , this.props);
        Object.shallowAssign(this.props , props);
        let isNotRender = false ;
        if( this.shouldComponentUpdateProps && typeof this.shouldComponentUpdateProps === 'function' ){
            isNotRender = this.shouldComponentUpdateProps(prevProps);
        }
        if( !isNotRender && this.render && typeof this.render === 'function'){
            this.render();
        }
        if( this.componentDidUpdateProps && typeof this.componentDidUpdateProps === 'function'){
            this.componentDidUpdateProps(prevProps);
        }
    }

}

export default RoadofcloudReact ;