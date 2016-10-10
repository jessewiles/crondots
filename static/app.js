// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    shim : {
        bootstrap : { deps :['jquery'] }
    },
    baseUrl: 'static/lib',
    paths: {
        jquery: 'jquery-3.1.1',
        handlebars: 'handlebars.amd',
        vis: 'vis.min',
        moment: 'moment',
        bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min',
        dtpicker: 'bootstrap-datetimepicker.min',
        app: '../app'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['app/main']);
