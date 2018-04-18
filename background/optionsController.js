var optionsController = {
    initialized: false,

    options: {
        enabled: true,
        whiteList: [
            "google.com",
            "chrome.google.com",
        ]
    },

    events: new Events({
        INITIALIZED: "INITIALIZED",
        SETTINGS_CHANGED: "SETTINGS_CHANGED"
    }),

    _load: function () {
        var self = this;
        chrome.storage.sync.get(null, function (options) {
            iterateProps(options, function (prop) {
                self.options[prop] = options[prop];
            });
            self.initialized = true;
            self.events.publish(self.events.eventNames.INITIALIZED);
        });
    },

    updateOptions: function (options) {
        this.options = merge(options, this.options);
        chrome.storage.sync.set(options, (function () {
            this.events.publish(this.events.eventNames.SETTINGS_CHANGED);
        }).bind(this));
    },

    addToWhiteList: function (domain) {
        var whiteList = this.options.whiteList.concat([domain]);
        this.updateOptions({whiteList: whiteList});
    },

    removeFromWhiteList: function (domain) {
        var index = this.options.whiteList.indexOf(domain);
        if (index !== -1) {
            var whiteList = this.options.whiteList.slice();
            whiteList.splice(index, 1);
            this.updateOptions({whiteList: whiteList});
        }
    },

    isUrlInWhiteList: function (url) {
        var siteDomain = getDomainFromUrl(url);
        return this.options.whiteList.indexOf(siteDomain) !== -1;
    }
};

optionsController._load();