/**
 * 云枢语言包
 * @module roadofLanguage
 * @description   提供 云枢中文语言包
 * @author QiuShao
 * @date 2017/09/01
 */

const RoadofLanguage = new Map();
const chLuanuage = {
    documentToolbar: {
        prevPage: '上一页' ,
        nextPage: '下一页' ,
        prevStep: '上一页'  ,
        nextStep: '下一页'  ,
        addPage: '加页'  ,
        enlargeWhiteboard: '放大'  ,
        narrowWhiteboard: '缩小' ,
        pptVolume: '音量'  ,
        onRemark: '打开备注' ,
        offRemark: '关闭备注'  ,
        onGeneralDocumentFullScreen: '绘制区域全屏' ,
        offGeneralDocumentFullScreen: '绘制区域取消全屏' ,
        onDynamicPPTFullScreen: 'PPT全屏' ,
        offDynamicPPTFullScreen: 'PPT取消全屏'  ,
        onH5DocumentFullScreen: 'H5课件全屏'  ,
        offH5DocumentFullScreen: 'H5课件取消全屏' ,
    },
    whiteboardToolbar: {
        fontFamily: {
            title: '文字样式' ,
            options: {
                Msyh: '微软雅黑' ,
                Ming: '宋体' ,
                Arial: 'Arial' ,
            }
        },
        fontSizeText: '号' ,
        pencilWidthTitle: '线条宽度' ,
        eraserWidthTitle: '橡皮擦大小' ,
        toolTextList: {
            tool_mouse: '鼠标' ,
            tool_laser: '激光笔' ,
            penList: '笔' ,
            tool_pencil:'铅笔' ,
            tool_highlighter:'荧光笔' ,
            tool_line:'线条' ,
            tool_arrow:'箭头' ,
            tool_text: '文字' ,
            shapeList: '形状' ,
            tool_rectangle_empty: '空心矩形' ,
            tool_rectangle: '矩形' ,
            tool_ellipse_empty: '空心椭圆' ,
            tool_ellipse: '椭圆' ,
            tool_eraser: '橡皮檫' ,
            action_undo: '撤销' ,
            action_redo: '恢复' ,
            action_clear: '清屏' ,
            settingList: '更多设置' ,
        }
    },
    documentRemark:{
        name:'备注' ,
        closeTitle:'关闭备注' ,
    }
};
const twLuanuage = {
    documentToolbar: {
        prevPage: '上壹頁' ,
        nextPage: '下壹頁' ,
        prevStep: '上壹頁'  ,
        nextStep: '下壹頁'  ,
        addPage: '加頁'  ,
        enlargeWhiteboard: '放大'  ,
        narrowWhiteboard: '縮小' ,
        pptVolume: '音量'  ,
        onRemark: '打開備註' ,
        offRemark: '關閉備註'  ,
        onGeneralDocumentFullScreen: '繪制區域全屏' ,
        offGeneralDocumentFullScreen: '繪制區域取消全屏' ,
        onDynamicPPTFullScreen: 'PPT全屏' ,
        offDynamicPPTFullScreen: 'PPT取消全屏'  ,
        onH5DocumentFullScreen: 'H5課件全屏'  ,
        offH5DocumentFullScreen: 'H5課件取消全屏' ,
    },
    whiteboardToolbar: {
        fontFamily: {
            title: '文字樣式' ,
            options: {
                Msyh: '微軟雅黑' ,
                Ming: '宋體' ,
                Arial: 'Arial' ,
            }
        },
        fontSizeText: '號' ,
        pencilWidthTitle: '線條寬度' ,
        eraserWidthTitle: '橡皮擦大小' ,
        toolTextList: {
            tool_mouse: '鼠標' ,
            tool_laser: '激光筆' ,
            penList: '筆' ,
            tool_pencil:'鉛筆' ,
            tool_highlighter:'熒光筆' ,
            tool_line:'線條' ,
            tool_arrow:'箭頭' ,
            tool_text: '文字' ,
            shapeList: '形狀' ,
            tool_rectangle_empty: '空心矩形' ,
            tool_rectangle: '矩形' ,
            tool_ellipse_empty: '空心橢圓' ,
            tool_ellipse: '橢圓' ,
            tool_eraser: '橡皮檫' ,
            action_undo: '撤銷' ,
            action_redo: '恢復' ,
            action_clear: '清屏' ,
            settingList: '更多設置' ,
        }
    },
    documentRemark:{
        name:'備註' ,
        closeTitle:'關閉備註' ,
    }
};
const enLuanuage = {
    documentToolbar: {
        prevPage: 'Previous Page' ,
        nextPage: 'Next Page' ,
        prevStep: 'Previous Page'  ,
        nextStep: 'Next Page'  ,
        addPage: 'Add Page'  ,
        enlargeWhiteboard: 'Zoom In'  ,
        narrowWhiteboard: 'Zoom Out' ,
        pptVolume: 'Volume'  ,
        onRemark: 'Open Courseware Remarks' ,
        offRemark: 'Close Courseware Remarks'  ,
        onGeneralDocumentFullScreen: 'Full Screen of Drawing Area' ,
        offGeneralDocumentFullScreen: 'Cancel Full Screen of Drawing Area' ,
        onDynamicPPTFullScreen: 'Full Screen  of PPT' ,
        offDynamicPPTFullScreen: 'Cancel Full Screen  of PPT'  ,
        onH5DocumentFullScreen: 'Full Screen  of Courseware'  ,
        offH5DocumentFullScreen: 'Cancel Full Screen  of Courseware' ,
    },
    whiteboardToolbar: {
        fontFamily: {
            title: 'Font Format' ,
            options: {
                Msyh: 'Microsoft YaHei' ,
                Ming: 'SimSun' ,
                Arial: 'Arial' ,
            }
        },
        fontSizeText: 'Font' ,
        pencilWidthTitle: 'Line Width' ,
        eraserWidthTitle: 'Eraser Size' ,
        toolTextList: {
            tool_mouse: 'Mouse' ,
            tool_laser: 'Laser Pen' ,
            penList: 'Pen' ,
            tool_pencil:'Pencil' ,
            tool_highlighter:'Highlighter' ,
            tool_line:'Line' ,
            tool_arrow:'Arrow' ,
            tool_text: 'Text Input' ,
            shapeList: 'Shape' ,
            tool_rectangle_empty: 'Square' ,
            tool_rectangle: 'Solid Square' ,
            tool_ellipse_empty: 'Circle' ,
            tool_ellipse: 'Solid Circle' ,
            tool_eraser: 'Eraser' ,
            action_undo: 'Undo' ,
            action_redo: 'Recover' ,
            action_clear: 'Clear Screen' ,
            settingList: 'More' ,
        }
    },
    documentRemark:{
        name:'Courseware Remarks' ,
        closeTitle:'Close Courseware Remarks' ,
    }
};
const jaLuanuage={
    documentToolbar: {
        prevPage: '前のページ' ,
        nextPage: '次のページ' ,
        prevStep: '前のページ'  ,
        nextStep: '次のページ'  ,
        addPage: 'ページを追加する'  ,
        enlargeWhiteboard: '拡大'  ,
        narrowWhiteboard: '縮小' ,
        pptVolume: 'ボリューム'  ,
        onRemark: '備考を開く' ,
        offRemark: '備考を閉じる'  ,
        onGeneralDocumentFullScreen: '描画領域全画面' ,
        offGeneralDocumentFullScreen: '手書き部分全画面表示の終了' ,
        onDynamicPPTFullScreen: 'PPT全画面' ,
        offDynamicPPTFullScreen: 'PPT全画面表示の終了'  ,
        onH5DocumentFullScreen: 'h5教材全画面'  ,
        offH5DocumentFullScreen: 'H5教材全画面の終了' ,
    },
    whiteboardToolbar: {
        fontFamily: {
            title: 'フォント様式' ,
            options: {
                Msyh: 'Microsoft　Yahei' ,
                Ming: '宋体' ,
                Arial: 'Arial' ,
            }
        },
        fontSizeText: '番号' ,
        pencilWidthTitle: '線の太さ' ,
        eraserWidthTitle: '消しゴムの大きさ' ,
        toolTextList: {
            tool_mouse: 'マウス' ,
            tool_laser: 'レーザーペン' ,
            penList: '鉛筆' ,
            tool_pencil:'鉛筆' ,
            tool_highlighter:'蛍光ペン' ,
            tool_line:'線' ,
            tool_arrow:'矢印' ,
            tool_text: '文字' ,
            shapeList: '形状' ,
            tool_rectangle_empty: '長方形（塗りつぶしなし）' ,
            tool_rectangle: '長方形' ,
            tool_ellipse_empty: '楕円（塗りつぶしなし）' ,
            tool_ellipse: '楕円' ,
            tool_eraser: '消しゴム' ,
            action_undo: 'キャンセル' ,
            action_redo: '元に戻す' ,
            action_clear: 'クリア' ,
            settingList: '詳細設定' ,
        }
    },
    documentRemark:{
        name:'備考' ,
        closeTitle:'关闭备注' ,
    }
}
RoadofLanguage.set( 'ch' , chLuanuage );
RoadofLanguage.set( 'tw' , twLuanuage );
RoadofLanguage.set( 'en' , enLuanuage );
RoadofLanguage.set( 'ja' , jaLuanuage );

export default RoadofLanguage ;