define(['jquery', 'vis', 'bootstrap', 'dtpicker', 'handlebars', 'app/model'],
       function($, vis, bs, dtpicker, Hb, model) {
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
        },
        convertTime = function(time) {
            if (time.indexOf(' AM') > -1) {
                var tparts = time.split(':');
                    if (tparts[0] === '12') {
                        tparts[0] = '00';
                    }
                return tparts[0] +':'+ tparts[1].replace(' AM', '');
            }
            else if (time.indexOf(' PM') > -1) {
                var tparts = time.split(':'),
                    hour = parseInt(tparts[0]),
                    newhour = 12 + hour,
                    newhour = (newhour < 24) ? newhour : 12;
                return newhour.toString() +':'+ tparts[1].replace(' PM', '');
            }
            return time.replace(' AM', '').replace(' PM', '');
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
            var dots = model.timeline(routeMatch[1]);
            for (var i = 0; i < dots.length; i++) {
                var dot = dots[i],
                    startParts = dot.start.split(' '),
                    endParts = (dot.end !== undefined) ? dot.end.split(' ') : null;
                    dot.startDate = startParts[0];
                    dot.startTime = (startParts.length > 1) ? startParts[1] : null;
                    if (endParts) {
                        dot.endDate = endParts[0];
                        dot.endTime = (endParts.length > 1) ? endParts[1] : null;
                    }
            }
            $('#content').html(
                hb_templates['t-edit']({
                    title: routeMatch[1],
                    id: routeMatch[1],
                    dots: dots
                })
            );
            for (var i = 0; i < dots.length; i++) {
                var dot = dots[i],
                    ctrlList = ['start', 'end'];
                for (var j = 0; j < ctrlList.length; j++) {
                    var ctrl = ctrlList[j];
                    $('#' +ctrl+ '-dtpicker-date-' +dot.id).datetimepicker({
                        viewMode: 'years',
                        format: 'YYYY-MM-DD',
                        ignoreReadonly: true
                    });
                    $('#' +ctrl+ '-dtpicker-time-' +dot.id).datetimepicker({
                        format: 'hh:mm A',
                        ignoreReadonly: true

                    });
                    $('input[name=' +ctrl+ '-specify-time-ctrl-' +dot.id+ ']').click(function(e) {
                        var $target = $(e.target),
                            prefix = $target.attr('name').split('-')[0],
                            tidSuffix = $target.attr('name').replace(prefix+'-specify-time-ctrl-', '');
                        if ($target.prop('checked')) {
                           $('#' +prefix+ '-time-ctrl-' +tidSuffix).removeClass('hidden');
                        }
                        else {
                            $('#' +prefix+ '-time-ctrl-' +tidSuffix).addClass('hidden');
                            $('#' +prefix+ '-time-ctrl-' +tidSuffix+ ' input').first().val('');
                        }
                    });
                    $('input[name=' +ctrl+ '-specify-end-ctrl-' +dot.id+ ']').click(function(e) {
                        var $target = $(e.target),
                            $dot = $($target.parent().parent()),
                            prefix = $target.attr('name').split('-')[0],
                            tidSuffix = $target.attr('name').replace(prefix+ '-specify-end-ctrl-', '');
                        if ($target.prop('checked')) {
                            $dot.find('.dtpicker.end').first().removeClass('hidden');
                        }
                        else {
                            $dot.find('.dtpicker.end').first().addClass('hidden');
                            $dot.find('.end input').val('');
                        }
                    });
                }
            }

            render(routeMatch[1]);
        },
        saveHandler: function(routeMatch) {
            var dots = [];
            $('.dots .dot').each(function(index, jq) {
                var $jq = $(jq), 
                    $content = $jq.find('.content').first(),
                    $startDate = $jq.find('.start .date input').first(),
                    $startTime = $jq.find('.start .time input').first(),
                    $endDate = $jq.find('.end .date input').first(),
                    $endTime = $jq.find('.end .time input').first(),
                    dot = {
                        id: $jq.attr('id').split('-')[1]
                    };
                if ($content.text().length > 0) 
                    dot.content = $content.text();
                if ($startDate.val().length > 0) 
                    dot.start = $startDate.val();
                if ($startTime.val().length > 0) 
                    dot.start += ' ' +convertTime($startTime.val());
                if ($endDate.val().length > 0)
                    dot.end = $endDate.val();
                    if ($endTime.val().length > 0)
                        dot.end += ' ' +convertTime($endTime.val());
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
