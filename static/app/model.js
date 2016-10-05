define(function() {
    return {
        timelines: function(name) {
            try {
                var timelines = JSON.parse(localStorage.getItem('timelines'));
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
        },
        timeline: function(name, value) {
            if (name === undefined)
                throw 'Must pass a name argument to this function';
            var result = {},
                oldTimelines = this.timelines();
            if (value !== undefined) {
                localStorage.setItem(name, JSON.stringify(value));
            }
            try {
                result = JSON.parse(localStorage.getItem(name));
            }
            catch(e) {
                return result;
            }
            result.delete = function() {
                if (name !== undefined) {
                    var newTimelines = [];
                    localStorage.removeItem(name);
                    for (var i = 0; i < oldTimelines.length; i++) {
                        if (oldTimelines[i] !== name)
                            newTimelines.push(oldTimelines[i]);
                    }
                    localStorage.setItem('timelines', JSON.stringify(newTimelines));
                }
            };
            result.add = function(dot) {
                if (dot !== undefined) {
                    result.push(dot);
                    localStorage.setItem(name, JSON.stringify(result));
                }
            };
            return result;
        }
    }
});
