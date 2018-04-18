function Events(eventNames) {
    return {
        _eventHandlers: {},

        eventNames: eventNames,

        subscribe: function (eventName, handler) {
            if (typeof this._eventHandlers[eventName] === "undefined") {
                this._eventHandlers[eventName] = [];
            }
            this._eventHandlers[eventName].push(handler);
        },

        publish: function (eventName, args) {
            if (typeof this._eventHandlers[eventName] === "undefined") {
                return;
            }

            for (var i = 0; i < this._eventHandlers[eventName].length; i++) {
                var handler = this._eventHandlers[eventName][i];
                try {
                    handler.apply(null, args);
                }
                catch (e) {
                }
            }
        }
    };
}

function iterateProps(obj, callback, allProps) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) || allProps) {
            if (callback(prop, obj)) {
                return true;
            }
        }
    }
}

function clone(obj) {
    var result = {};

    iterateProps(obj, function (prop) {
        result[prop] = obj[prop];
    }, true);

    return result;
}


function merge(obj1, obj2) {
    var result = clone(obj1);

    iterateProps(obj2, function (prop) {
        if (typeof result[prop] === "undefined") {
            result[prop] = obj2[prop];
        }
    });

    return result;
}

function getDomainFromUrl(url) {
    if (!/https?:/.test(url)) {
        url = "http://" + url;
    }

    return (new URL(url)).hostname;
}

function generateRandomToken() {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }

    return hex;
}
