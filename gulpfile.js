var gulp = require( 'gulp' );
var ts = require( 'gulp-typescript' );
var tslint = require( 'gulp-tslint' );

const tsProject = ts.createProject( 'tsconfig.json' );

/**
 * Ensures the code quality is up to scratch
 */
gulp.task( 'tslint', [ 'ts-code' ], function() {
    return tsProject.src()
        .pipe( tslint( {
            configuration: 'tslint.json',
            formatter: 'verbose'
        }) )
        .pipe( tslint.report( {
            emitError: false
        }) )
});

// Builds each of the ts files into JS files in the output folder
gulp.task( 'ts-code', function() {

    var tsResult = tsProject.src()
        .pipe( tsProject() );

    return tsResult.js.pipe( gulp.dest( './dist' ) );
});

gulp.task( 'build', [ 'tslint', 'ts-code' ] );