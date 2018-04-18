var bp = chrome.extension.getBackgroundPage();
var optionsController = bp.optionsController;

$(function () {
    localize();
    updateWhiteList();
    optionsController.events.subscribe(optionsController.events.eventNames.SETTINGS_CHANGED, settingsChanged);
    $("#whiteList").on("click", "a.button", onRemoveFromWhiteListClick);
});

function updateWhiteList() {
    var whiteList = optionsController.options.whiteList;
    var $whiteList = $("#whiteList");
    var htmlContent = "";

    for (var i = 0; i < whiteList.length; i++) {
        htmlContent += '<tr><td>' + whiteList[i] + '</td><td><a class="button" href="#" ' + 'data-index="' + i + '">' + chrome.i18n.getMessage("remove") + '</a></td></tr>';
    }

    $whiteList.html(htmlContent);
}

function localize() {
    var nodeIterator = document.createNodeIterator(document, NodeFilter.SHOW_TEXT);
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

function onRemoveFromWhiteListClick() {
    var index = +$(this).data("index");
    optionsController.removeFromWhiteList(optionsController.options.whiteList[index]);
}

function settingsChanged() {
    updateWhiteList();
}