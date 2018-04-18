(function () {
    optionsController.events.subscribe(optionsController.events.eventNames.INITIALIZED, optionsControllerInitialized);
    optionsController.events.subscribe(optionsController.events.eventNames.SETTINGS_CHANGED, settingsChanged);

    chrome.runtime.onInstalled.addListener(onInstalled);

    var messageHandlers = {
        "allowOnce": allowOnce,
        "addToWhiteList": addToWhiteList,
        "openOptions": openOptions,
        "getBlockMode": getBlockMode,
    };

    function optionsControllerInitialized() {
        chrome.tabs.onActivated.addListener(onTabActivated);
        chrome.webNavigation.onCompleted.addListener(onTabLoadCompleted);
        chrome.runtime.onMessage.addListener(onMessage);
        updateIcon();
    }

    function onTabActivated(info) {
        updateIcon();
    }

    function onTabLoadCompleted(info) {
        if (info.frameId !== 0) {
            return;
        }

        updateIcon();
    }

    function onMessage(message, sender, callback) {
        var handler = messageHandlers[message.command];

        if (handler) {
            handler(message, sender, callback);
        } else {
            console.warn("Handler for command '" + message.command + "' doesn't exist.");
        }
    }

    function updateIcon() {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs.length < 1) {
                return;
            }

            var inWhiteList = optionsController.isUrlInWhiteList(tabs[0].url);

            if (optionsController.options.enabled) {
                if (inWhiteList) {
                    chrome.browserAction.setIcon({path: {"38": "images/enable_in_list_128.png"}});
                } else {
                    chrome.browserAction.setIcon({path: {"38": "images/enable_in_list_128.png"}});
                }
            } else {
                if (inWhiteList) {
                    chrome.browserAction.setIcon({path: {"38": "images/disable_in_list_128.png"}});
                } else {
                    chrome.browserAction.setIcon({path: {"38": "images/disable_in_list_128.png"}});
                }
            }
        });
    }

    function allowOnce(message, sender) {
        chrome.tabs.sendMessage(sender.tab.id, {command: "showOverlays"});
        chrome.tabs.sendMessage(sender.tab.id, {command: "closeToolbar"});
    }

    function addToWhiteList(message, sender) {
        chrome.tabs.sendMessage(sender.tab.id, {command: "showOverlays"});
        chrome.tabs.sendMessage(sender.tab.id, {command: "closeToolbar"});

        var domain = getDomainFromUrl(sender.tab.url);
        optionsController.addToWhiteList(domain);
    }

    function openOptions(){
        window.open(chrome.extension.getURL("options/options.html"));
    }

    function getBlockMode(message, sender, callback) {
        var inWhiteList = optionsController.isUrlInWhiteList(sender.url);
        var mode = "NORMAL";

        if (inWhiteList || !optionsController.options.enabled) {
            mode = "DISABLED";
        }

        callback({mode: mode});
    }

    function settingsChanged() {
        updateIcon();
    }

    function onInstalled(details) {
        if (details.reason === "install") {
            var id = generateRandomToken();
            chrome.tabs.create({url: chrome.runtime.getURL("install/install.html")});
        }
    }
})();