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
                hb_templates['t-view']({
                    title: routeMatch[1],
                    id: routeMatch[1] 
                })
            );
            render(routeMatch[1]);
        },
        editHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['t-edit']({
                    title: routeMatch[1],
                    id: routeMatch[1],
                    dots: model.timeline(routeMatch[1])
                })
            );
            render(routeMatch[1]);
        },
        saveHandler: function(routeMatch) {
            var dots = [];
            $('.dots .dot').each(function(index, jq) {
                var $jq = $(jq), 
                    $content = $jq.find('.content').first(),
                    $start = $jq.find('.start').first(),
                    $end = $jq.find('.end').first(),
                    dot = {
                        id: $jq.attr('id').split('-')[1]
                    };
                if ($content.text().length > 0) 
                    dot.content = $content.text();
                if ($start.text().length > 0) 
                    dot.start = $start.text();
                if ($end.text().length > 0) 
                    dot.end = $end.text();
                else 
                    dot.type = 'point';
                if ($jq.attr('id').indexOf('add') === -1) 
                    dots.push(dot);
            });
            model.timeline(routeMatch[1], dots);
            document.location.hash = '#/view/' + routeMatch[1];
        },
        addHandler: function(routeMatch) {
            $('#add-modal').modal('show');
            $('.add-content').first().focus();
            $('#save-new-dot').attr('data-tid', routeMatch[1]);
        },
        addClickHandler: function(dotid) {
            var olddot = model.timeline(dotid),
                dot = {
                    id: ((olddot.length + 1) * 1000).toString(),
                    content: $('.add-content').first().text(),
                    start: $('.add-start').first().text()
                };
            if ($('.add-end').first().text().length > 0) {
                dot.end = $('.add-end').first().text();
            }
            else {
                dot.type = 'point';
            }
            model.timeline(dotid).add(dot);
        },
        deleteHandler: function(routeMatch) {
            $('#delete-modal').modal('show');
            $('#delete-timeline').attr('data-tid', routeMatch[1]);
        },
        HbTemplates: hb_templates
    }
});
