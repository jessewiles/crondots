define(function() {
    return {
        timelines: function() {
            try {
                return JSON.parse(localStorage.getItem('timelines'));
            }
            catch(e) {
                return [];
            }
        }
    }
});