define(function() {
    var _email = '';
    return {
        email: function(value) {
            if (value !== undefined)
                _email = value;
            return _email;
        }
    };
});