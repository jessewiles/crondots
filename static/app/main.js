require(['jquery','app/router', 'app/handlers'],
         function($, router, handlers) {
    var routing = router.router({
            '#/home': handlers.homeHandler,
            '#/view/(.*)': handlers.viewHandler,
            '#/edit/(.*)': handlers.editHandler
        });

    $(document).ready(function() {
        window.onhashchange = function(e) {
            router.route(window.location.hash);
        }
        if (window.location.hash !== '')
            window.location.hash = '';
        window.location.hash = '#/home';
    });
});
