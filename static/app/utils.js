define(['jquery'], function($) {
    return {
        gohome: function() {
            if (window.location.hash !== '')
                window.location.hash = '';
            window.location.hash = '#/home';
        },
        goedit: function(hashRoute) {
            if (window.location.hash !== '')
                window.location.hash = '';
            window.location.hash = hashRoute;
        }
    }
});
