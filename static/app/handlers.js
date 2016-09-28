define(['jquery', 'vis', 'handlebars', 'app/model'], function($, vis, Hb, model) {
    var hb_templates = function() {
            result = {};
            $("script[type = 'text/x-handlebars-template']").each(function(index, jq) {
                var $this = $(this);
                result[$this.attr('id')] = Hb.compile($this.text());
            });
            return result;
        }(),
        render = function(dotsid) {
            // DOM element where the Timeline will be attached
            var dots = model.timeline(dotsid);

            var container = $('.timeline').first();
            if (container !== null)
                container.html('');

            // Create a Timeline
            return new vis.Timeline(
                container[0],
                new vis.DataSet(dots),
                {}
            );
        };

    return {
        homeHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['t-home']({
                    timelines: model.timelines()
                })
            );
        },
        viewHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['t-timeline']({
                    title: routeMatch[1],
                    id: routeMatch[1] 
                })
            );
            render(routeMatch[1]);
        },
        editHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['t-edit']({
                    id: 'xxx'
                })
            );
        },
        HbTemplates: hb_templates
    }
});
