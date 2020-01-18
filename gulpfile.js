'use strict';

const fs = require('fs');
const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const header = require('gulp-header');
const browserify = require('browserify');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const cssmin = require('gulp-minify-css') ; //压缩css文件
const autoprefixer = require('gulp-autoprefixer') ;//给 CSS 增加前缀。解决某些CSS属性不是标准属性，有各种浏览器前缀的情况
const clean = require('gulp-clean');

const PKG = require('./package.json');
const BANNER = fs.readFileSync('banner.txt').toString().replace(/dateTemplate/g , dateFormat(new Date()));
const currentTarget = process.env.npm_lifecycle_event; // Detect how npm is run and branch based on that（当前 npm 运行）

gulp.task("clean", function(){
    return gulp.src([ 'dist/**/*.*' , 'src-es5/**/*.*' ])
        .pipe( clean({allowEmpty:true}) );
});

gulp.task('lint', () =>
{
	const src = [ 'gulpfile.js', '.eslintrc_roadofcloud.js', 'src/**/*.js' ];

	return gulp.src(src)
		.pipe(plumber())
		.pipe(eslint())
		//.pipe(eslint.format())
		;
});

gulp.task('babel', () =>
{
	return gulp
		.src([ 'src/**/*.js' ])
		.pipe(babel())
		.pipe(gulp.dest('src-es5'));
});

gulp.task('bundle', () =>
{
	return browserify(
		{
			entries      :  PKG.main,
			extensions   : [ '.js' ],
			// Required for sourcemaps (must be false otherwise).
			debug        :true,
			// Required for watchify (not used here).
			cache        : null,
			// Required for watchify (not used here).
			packageCache : null,
			// Required to be true only for watchify (not used here).
			fullPaths    : false,
		})
		.bundle()
		.on('error', (error) =>{
			gutil.log(gutil.colors.red(String(error)));
		})
		.pipe(source('yswhiteboardsdk.js') )
		.pipe(buffer())
		.pipe(header(BANNER, { pkg: PKG }))
		.pipe(rename('yswhiteboardsdk.js') )
		.pipe(gulp.dest('dist/'));

});

gulp.task('concatSourcecJsFile' , () => {
    return gulp.src(['libs/yslc_core.js','libs/RoadofSlider.js' , 'libs/RoadofDrag.js' , 'dist/yswhiteboardsdk.js'])
        .pipe(concat('yswhiteboardsdk.js'))
        .pipe(gulp.dest('dist/'));
} );

gulp.task('copyWhiteboardCore' , () => {
    return gulp.src(['libs/yslc_core.js','libs/RoadofSlider.js' , 'libs/RoadofDrag.js'])
        .pipe(concat('yslc_core.js'))
        .pipe(gulp.dest('dist/'))
        .pipe(uglify())
        .pipe(rename('yslc_core.min.js') )
        .pipe(gulp.dest('dist/'));
} );

gulp.task('concatSourcecCssFile' , () => {
    return gulp.src(['libs/yslc_core.css' , 'libs/RoadofSlider.css'  ,  'src/css/**/*.css'])
        .pipe(autoprefixer({
            browsers: ['last 20 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=15'],//last 2 versions- 主流浏览器的最新两个版本
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove:true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(concat('yswhiteboardsdk.css'))
        .pipe(gulp.dest('dist/'));
} );

gulp.task('uglifyJsFile' , () => {
    return gulp.src([ 'dist/yswhiteboardsdk.js'])
        .pipe(uglify())
        .pipe(rename('yswhiteboardsdk.min.js') )
        .pipe(gulp.dest('dist/'));
} );

gulp.task('cssminCssFile' , () => {
    return gulp.src([ 'dist/yswhiteboardsdk.css'])
        .pipe(cssmin())
        .pipe(rename('yswhiteboardsdk.min.css') )
        .pipe(gulp.dest('dist/'));
} );


gulp.task('babel_es5', gulp.series( 'clean' , 'lint', 'babel'));

gulp.task('build', gulp.series( 'clean' ,'lint', 'babel', 'bundle' , 'concatSourcecJsFile' , 'concatSourcecCssFile' , 'uglifyJsFile' , 'cssminCssFile'));

// 自动监控任务:在命令行使用 gulp auto_default 启动此任务
gulp.task('auto_build',  () => {
    // Watch changes in JS files.
    gulp.watch([ 'src/**/*.js' , 'src/css/**/*.css' , 'libs/**/*.js' ,  'libs/**/*.css' ], gulp.series(
        'clean' , 'lint', 'babel', 'bundle' , 'concatSourcecJsFile' , 'concatSourcecCssFile' , 'uglifyJsFile' , 'cssminCssFile'
    ));
});

gulp.task('dev', gulp.series( 'lint', 'babel', 'bundle', 'concatSourcecCssFile', 'copyWhiteboardCore' ));

// 自动监控任务:在命令行使用 gulp auto_default 启动此任务
gulp.task('auto_dev',  () => {
    // Watch changes in JS files.
    gulp.watch([ 'src/**/*.js' , 'src/css/**/*.css' , 'libs/**/*.js' ,  'libs/**/*.css' ], gulp.series(
        'lint', 'babel', 'bundle'  , 'concatSourcecCssFile' , 'copyWhiteboardCore'
    ));
});

/*==================内部函数start====================*/

/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
function dateFormat( date , fmt = "yyyy-MM-dd HH:mm:ss"  ){
	let o = {
		"M+" : date.getMonth()+1, //月份
		"d+" : date.getDate(), //日
		"h+" : date.getHours()%12 == 0 ? 12 : date.getHours()%12, //小时
		"H+" : date.getHours(), //小时
		"m+" : date.getMinutes(), //分
		"s+" : date.getSeconds(), //秒
		"q+" : Math.floor((date.getMonth()+3)/3), //季度
		"S" : date.getMilliseconds() //毫秒
	};
	let week = {
		"0" : "/u65e5",
		"1" : "/u4e00",
		"2" : "/u4e8c",
		"3" : "/u4e09",
		"4" : "/u56db",
		"5" : "/u4e94",
		"6" : "/u516d"
	};
	if(/(y+)/.test(fmt)){
		fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
	}
	if(/(E+)/.test(fmt)){
		fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[date.getDay()+""]);
	}
	for(let k in o){
		if(new RegExp("("+ k +")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
		}
	}
	return fmt;
}
/*==================内部函数end====================*/

/** .babelrc
{
	"plugins":[ "transform-es2015-modules-umd" , "transform-es2015-modules-amd" , "transform-es2015-modules-commonjs" , "transform-es2015-modules-systemjs" ],
	"presets": [ "env" , "stage-0"]
}

*/