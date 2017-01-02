define(['jquery'], function($) {
    return {
        timelines: function(name) {
            if (true) {
                $.ajax({
                    url: '/timelines',
                    success: function(result) {
                        // do something
                    }
                })
            }
            else {
                try {
                    var timelines = JSON.parse(localStorage.getItem('timelines')) || [];
                    if (name !== undefined) {
                        timelines.push(name);
                        localStorage.setItem('timelines', JSON.stringify(timelines));
                        this.timeline(name, []);
                    }
                    else {
                        return timelines;
                    }
                }
                catch(e) {
                    return [];
                }
            }
        },
        timeline: function(name, value) {
            var iresult = {};
            if (true) {
                // TODO: get or set a timeline
                $.ajax({
                    url: '/timeline/' + name,
                    async: false,
                    success: function(result) {
                        iresult = result;
                    }
                });
            }
            else {
                if (name === undefined)
                    throw 'Must pass a name argument to this function';
                var oldTimelines = this.timelines();
                if (value !== undefined) {
                    localStorage.setItem(name, JSON.stringify(value));
                }
                try {
                    iresult = JSON.parse(localStorage.getItem(name));
                }
                catch(e) {
                    return iresult;
                }
            }
            iresult.getNewId = function() {
                if (true) {
                    var iresult = null;
                    $.ajax({
                        url: '/auuid',
                        async: false,
                        success: function(result) {
                            iresult = result;
                        }
                    });
                    return iresult;
                }
                else {
                    var possible = (iresult.length + 1) * 1000,
                        ids = {};
                    for (var i = 0; i < iresult.length; i++) {
                        ids[iresult[i].id] = true;
                    }
                    function verify() {
                        if (ids[possible] !== undefined) {
                            possible = possible + 9;
                            verify();
                        }
                    }
                    verify();
                    return 'x'+possible.toString();
                }
            };
            iresult.delete = function() {
                if (true) {
                    $.ajax({
                        url: '/timeline/' + name,
                        method: 'DELETE',
                        async: false,
                        success: function(result) {
                            // pass
                        }
                    });
                }
                else {
                    if (name !== undefined) {
                        var newTimelines = [];
                        localStorage.removeItem(name);
                        for (var i = 0; i < oldTimelines.length; i++) {
                            if (oldTimelines[i] !== name)
                                newTimelines.push(oldTimelines[i]);
                        }
                        localStorage.setItem('timelines', JSON.stringify(newTimelines));
                    }
                }
            };
            iresult.add = function(dot) {
                if (iresult !== undefined) {
                    iresult.push(dot);
                    if (true) {
                        $.ajax({
                            url: '/timeline/' +name,
                            method: 'PUT',
                            contentType: 'application/json',
                            data: JSON.stringify(iresult)
                        });
                    }
                    else {
                        if (dot !== undefined) {
                            localStorage.setItem(name, JSON.stringify(iresult));
                        }
                    }
                }
            };
            return iresult;
        }
    }
});
