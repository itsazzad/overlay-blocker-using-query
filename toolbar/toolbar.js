$(function () {
    $("#allowOnce").click(function () {
        chrome.runtime.sendMessage({command: "allowOnce"});
    });
    $("#allowAlways").click(function () {
        chrome.runtime.sendMessage({command: "addToWhiteList"});
    });
    $("#options").click(function () {
        chrome.runtime.sendMessage({command: "openOptions"});
    });

    localize();
});

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