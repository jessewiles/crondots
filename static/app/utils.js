define(['jquery'], function($) {
    return {
        gohome: function() {
            if (window.location.hash !== '')
                window.location.hash = '';
            window.location.hash = '#/home';
        }
    }
});
