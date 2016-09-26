require(['jquery', 'vis', 'handlebars', 'app/model'], function($, vis, Hb, model) {
    var render = function(dotsid) {
            // DOM element where the Timeline will be attached
            var dots = JSON.parse(localStorage.getItem(dotsid));

            var container = $('.timeline').first();
            if (container !== null)
                container.html('');
            
            // Create a DataSet (allows two way data-binding)
            var items = new vis.DataSet(dots);

            // Configuration for the Timeline
            var options = {};

            // Create a Timeline
            var timeline = new vis.Timeline(container[0], items, options);
        };

    $(document).ready(function() {
        window.onhashchange = function(e) {
            switch(window.location.hash) {
                case '#/home':
                    var tmpl = Hb.compile($('#home-template').html());
                    $('#content').html(
                        tmpl({
                            timelines: model.timelines()
                        })
                    );
                    break;
                default:
                    var tmpl = Hb.compile($('#timeline-template').html());
                    $('#content').html(
                        tmpl({
                            title: window.location.hash.substring(2),
                            id: window.location.hash.substring(2)
                        })
                    );
                    render(window.location.hash.substring(2));

                    break;
            }
        }
        window.location.hash = '#/home';});
});