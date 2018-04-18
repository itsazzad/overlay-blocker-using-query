var bp = chrome.extension.getBackgroundPage();
var optionsController = bp.optionsController;
var getDomainFromUrl = bp.getDomainFromUrl;

$.fn.bootstrapSwitch.defaults.size = "mini";
$.fn.bootstrapSwitch.defaults.onColor = "danger";

$(function () {
    localize();

    var extensionEnabled = $("#extensionEnabled").bootstrapSwitch();
    extensionEnabled.bootstrapSwitch("state", optionsController.options.enabled, true);
    extensionEnabled.bootstrapSwitch("onText", chrome.i18n.getMessage("extensionEnabled_On"));
    extensionEnabled.bootstrapSwitch("offText", chrome.i18n.getMessage("extensionEnabled_Off"));
    extensionEnabled.bootstrapSwitch("labelText", chrome.i18n.getMessage("extensionEnabled_Label"));
    extensionEnabled.bootstrapSwitch("labelWidth", "70px");
    extensionEnabled.on("switchChange.bootstrapSwitch", onExtensionEnabledSwitch);

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var siteWhitelisted = $("#siteWhitelisted").bootstrapSwitch();
        var isWhitelisted = optionsController.isUrlInWhiteList(tabs[0].url);
        if (isWhitelisted) $("#addToWhiteList").addClass("menu__item-hidden");
        siteWhitelisted.bootstrapSwitch("state", isWhitelisted, true);
        siteWhitelisted.bootstrapSwitch("onText", chrome.i18n.getMessage("siteWhitelisted_On"));
        siteWhitelisted.bootstrapSwitch("offText", chrome.i18n.getMessage("siteWhitelisted_Off"));
        siteWhitelisted.bootstrapSwitch("labelText", chrome.i18n.getMessage("siteWhitelisted_Label"));
        siteWhitelisted.bootstrapSwitch("labelWidth", "50px");
        siteWhitelisted.on("switchChange.bootstrapSwitch", onSiteWhitelistedSwitch);
    });

    $("#addToWhiteList").on("click", onAddToWhiteListClick);
    $("#options").on("click", onOptionsClick);
});

function onExtensionEnabledSwitch(event, state) {
    optionsController.updateOptions({
        enabled: state
    });
}

function onSiteWhitelistedSwitch(event, state) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var siteDomain = getDomainFromUrl(tabs[0].url);

        if (state) {
            optionsController.addToWhiteList(siteDomain);
        } else {
            optionsController.removeFromWhiteList(siteDomain);
        }

        $("#addToWhiteList").toggleClass("menu__item-hidden");
    });
}

function localize() {
    var nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
    var currentNode;
    while (currentNode = nodeIterator.nextNode()) {
        var plainContent = currentNode.nodeValue;
        var localizedContent = plainContent.replace(/__MSG_(\w+)__/g, function (match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (localizedContent != plainContent) {
            currentNode.nodeValue = localizedContent;
        }
    }
}

function onAddToWhiteListClick() {
    $("#siteWhitelisted").bootstrapSwitch("state", true);
}

function onOptionsClick() {
    window.open(chrome.extension.getURL("options/options.html"));
}