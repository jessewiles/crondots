require(['jquery', 'bootstrap', 'app/router', 'app/handlers', 'app/model', 'app/utils'],
         function($, bs, router, handlers, model, utils) {
    var routing = router.router({
            '#/home': handlers.homeHandler,
            '#/view/(.*)': handlers.viewHandler,
            '#/edit/(.*)': handlers.editHandler,
            '#/save/(.*)': handlers.saveHandler,
            '#/add/(.*)': handlers.addHandler,
            '#/delete/(.*)': handlers.deleteHandler,
            '#/register': handlers.registerHandler
        });

    $(document).ready(function() {
        $('#new-modal').on('shown.bs.modal', function(e) {
            $('#new-timeline-name').focus();
        });
        $('#save-new-timeline').on('click', function(e) {
            var $name = $('#new-timeline-name');
            model.timelines($name.text());
            $('#new-modal').modal('hide');
            $name.text('');
            utils.gohome();
        });
        $('#delete-timeline').click(function(e) {
            model.timeline($(e.target).data('tid')).delete();
            $('#delete-modal').modal('hide');
            utils.gohome();
        });
        $('#save-new-dot').click(function(e) {
            var tid = $(e.target).data('tid');
            handlers.addClickHandler(tid);
            $('#add-modal').modal('hide');
            utils.goedit('#/edit/' +tid);
        });
        window.onhashchange = function(e) {
            router.route(window.location.hash);
        }
        utils.gohome();
    });
});
