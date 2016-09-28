define(function() {
    var __routes = {};
    return {
        router: function(routes) {
            __routes = routes;
        },
        route: function(hash) {
            for (var exp in __routes) {
                var regex = new RegExp(exp),
                    match = regex.exec(hash);
                if (match !== null) {
                    // execute the handler and pass the match
                    // first match wins
                    __routes[exp](match);
                    break;
                }
            }
        }
    }
});
