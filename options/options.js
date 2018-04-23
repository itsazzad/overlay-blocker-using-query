var defaultValue = 'modal-hide';

function getModalHide(){
    return document.getElementById('modal-hide');
}
// Saves options to chrome.storage
function form_save_options() {
    var modalHide = getModalHide().value;
    save_options(modalHide);
}
function save_options(modalHide) {
    chrome.storage.sync.set({
        modalHide: modalHide ? modalHide : defaultValue,
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get(['modalHide'], function (items) {
        getModalHide().value = items.modalHide ? items.modalHide : defaultValue;
    });
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

document.addEventListener('DOMContentLoaded', restore_options);
$(function () {
    localize();
    document.getElementById('save').addEventListener('click', form_save_options);
});
