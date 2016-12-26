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
        },
        textSelect = function(ev) {
            ev = ev || window.event;
            var $e = $(this),
                t = $e.text(),
                hl = function() {
                    var range, c, selection;

                    ev.stopPropagation();

                    $e.removeClass('wltext');
                    $e.addClass('wtext');

                    range = window.document.createRange();
                    c = $e.get(0).firstChild;

                    range.setStart(c, 0);
                    range.setEnd(c, c.data.length);

                    selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                };
            setTimeout(hl, 10, $e);
        },
        deleteDotHandler = function(ev) {
            ev = ev || window.event;
            var $e = $(this);
            $e.parent().remove();
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
        registerHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['register-template']({})
            );
            $('#submit-registration').on('click', function(e) {
                $.ajax({
                    url: '/register',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: $('#user-email').val(),
                        password: $('#user-password').val()
                    }),
                    error: function(request) {
                        if (request.status === 409) {
                            $('#user-email').val('').focus();
                            $('#user-password').val('');
                            $('#confirm-password').val('');
                            $('#content').find('.warning')
                                         .first()
                                         .text('User with this email already exists.')
                        }
                    },
                    success: function(result) {
                        document.location.hash = '#/home';
                    }
                })
            });
        },
        signinHandler: function(routeMatch) {
            $('#content').html(
                hb_templates['signin-template']({})
            );
            $('#submit-signin').on('click', function(e) {
                $.ajax({
                    url: '/signin',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: $('#user-email').val(),
                        password: $('#user-password').val()
                    }),
                    success: function(result) {
                        document.location.hash = '#/home';
                    },
                    error: function(request) {
                        $('#content').find('.warning').first().text('Invalid username/password combination.')
                        $('#user-password').val('').focus();
                    }
                });
            });
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
            $('.ctrl').focus(textSelect);
            $('.closer').click(deleteDotHandler);
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
            var dots = [],
                timelineName = $('.timeline-title span').first().text().trim();
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
            if (timelineName != routeMatch[1]) {
                model.timeline(routeMatch[1]).delete();
                model.timelines(timelineName);
            }
            model.timeline(timelineName, dots);
            document.location.hash = '#/view/' + timelineName;
        },
        addHandler: function(routeMatch) {
            $('#add-modal').modal('show');
            var ctrlList = ['start', 'end'];
            for (var j = 0; j < ctrlList.length; j++) {
                // ************************
                // TODO: Finish this shit
                // ************************
                var ctrl = ctrlList[j];
                $('#' +ctrl+ '-dtpicker-date-adder').datetimepicker({
                    viewMode: 'years',
                    format: 'YYYY-MM-DD',
                    ignoreReadonly: true
                });
                $('#' +ctrl+ '-dtpicker-time-adder').datetimepicker({
                    format: 'hh:mm A',
                    ignoreReadonly: true

                });
                $('input[name=' +ctrl+ '-specify-time-ctrl-adder]').click(function(e) {
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
                $('input[name=' +ctrl+ '-specify-end-ctrl-adder]').click(function(e) {
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
            $('.add-content').first().focus();
            $('#save-new-dot').attr('data-tid', routeMatch[1]);
        },
        addClickHandler: function(dotid) {
            var olddot = model.timeline(dotid),
                dot = {
                    id: olddot.getNewId(),
                    content: $('.add-content').first().text(),
                    start: $('.add-start').first().val()
                };
            if ($('.add-end').first().text().length > 0) {
                dot.end = $('.add-end').first().val();
            }
            else {
                dot.type = 'point';
            }
            $('.add-content').first().text('');
            $('.add-start').first().val('');
            model.timeline(dotid).add(dot);
        },
        deleteHandler: function(routeMatch) {
            $('#delete-modal').modal('show');
            $('#delete-timeline').attr('data-tid', routeMatch[1]);
        },
        HbTemplates: hb_templates
    }
});
