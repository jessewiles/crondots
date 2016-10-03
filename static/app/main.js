require(['jquery', 'bootstrap', 'app/router', 'app/handlers', 'app/model', 'app/utils'],
         function($, bs, router, handlers, model, utils) {
    var routing = router.router({
            '#/home': handlers.homeHandler,
            '#/view/(.*)': handlers.viewHandler,
            '#/edit/(.*)': handlers.editHandler,
            '#/save/(.*)': handlers.saveHandler,
            '#/add/(.*)': handlers.addHandler,
            '#/delete/(.*)': handlers.deleteHandler
        });

    $(document).ready(function() {
        $('#add-modal').on('shown.bs.modal', function(e) {
            $('#new-timeline-name').focus();
        });
        $('#save-new-timeline').on('click', function(e) {
            var $name = $('#new-timeline-name');
            model.timelines($name.text());
            $('#add-modal').modal('hide');
            $name.text('');
            utils.gohome();
        });
        $('#delete-timeline').click(function(e) {
            model.timeline($(e.target).data('tid')).delete();
            $('#delete-modal').modal('hide');
            utils.gohome();
        });
        window.onhashchange = function(e) {
            router.route(window.location.hash);
        }
        utils.gohome();
    });
});
