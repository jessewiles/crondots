require(['jquery', 'vis', 'handlebars'], function($, vis, Hb) {
    var render = function(dotsid) {
            // DOM element where the Timeline will be attached
            var dots = JSON.parse(localStorage.getItem(dotsid));

            var container = $('#visualization');
            container.html('');
            
            // Create a DataSet (allows two way data-binding)
            var items = new vis.DataSet(dots);

            // Configuration for the Timeline
            var options = {};

            // Create a Timeline
            var timeline = new vis.Timeline(container[0], items, options);
        },
        stls = localStorage.getItem('tlitems'),
        tls = JSON.parse(stls);

    $('#index').html(function() {
        result = ['<ul>'];
        for (var i = 0; i < tls.length; i++) {
            result.push('<li><a class="inline" href="#/'+tls[i]+'">' +tls[i]+ '</a></li>');
        }
        result.push('</ul>');
        return result.join('\n');
    }());

    $(document).ready(function() {
        window.onhashchange = function(e) {
            switch(window.location.hash) {
                case '#/home':
                    var tmpl = Hb.compile($('#home').html());
                    $('#content').html(tmpl({}));
                    break;
                default:
                    render(window.location.hash.substring(2));
                    break;
            }
        }
        window.location.hash = '#/home';});
});