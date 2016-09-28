define(function() {
    return {
        timelines: function() {
            try {
                return JSON.parse(localStorage.getItem('timelines'));
            }
            catch(e) {
                return [];
            }
        },
        timeline: function(name, value) {
            if (value !== undefined) {
                localStorage.setItem(name, JSON.stringify(value));
            }
            try {
                return JSON.parse(localStorage.getItem(name));
            }
            catch(e) {
                return {};
            }
        }
    }
});
