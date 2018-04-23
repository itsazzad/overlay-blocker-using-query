var utils = (function () {
    function hideElement(element) {
        styleImportant(element, "display", "none");
    }

    function styleImportant(element, cssProperty, cssValue) {
        element.style[cssProperty] = "";
        var cssText = element.style.cssText || "";
        if (cssText.length > 0 && cssText.slice(-1) != ";")
            cssText += ";";
        // Some pages are using !important on elements, so we must use it too
        element.style.cssText = cssText + cssProperty + ": " + cssValue + " !important;";
    }

    function isAnElement(node) {
        return node.nodeType == 1; // nodeType 1 mean element
    }

    function isParentOrSame(element, parent) {
        if (element === parent) {
            return true;
        }

        do {
            if (element.parentNode === parent) {
                return true;
            }
            element = element.parentNode;
        } while (element !== document && element !== document.body);

        return false;
    }

    function nodeListToArray(nodeList) {
        return Array.prototype.slice.call(nodeList);
    }

    function forEachElement(nodeList, functionToApply) {
        nodeListToArray(nodeList).filter(isAnElement).forEach(function (element) {
            functionToApply.call(this, element);
        });
    }

    function getStyles(element) {
        var elementStyles = window.getComputedStyle(element);
        var beforeStyles = window.getComputedStyle(element, ":before");
        var afterStyles = window.getComputedStyle(element, ":after");

        var styles = elementStyles;
        var height = parseInt(styles.height, 10);
        if (height === 0) {
            if (parseInt(beforeStyles.height, 10) !== 0) {
                styles = beforeStyles;
            } else {
                if (parseInt(afterStyles.height, 10) !== 0) {
                    styles = afterStyles;
                }
            }
        }

        return {
            zIndex: parseInt(styles.zIndex, 10),
            width: parseInt(styles.width, 10),
            height: parseInt(styles.height, 10),
            position: styles.position,
            display: styles.display
        };
    }

    // Calculate the number of DOM elements inside an element
    function getWeight(element, maxThreshold) {
        var grandTotal = 0;
        var nextElement = element;
        var nextGrandChildNodes = [];

        function calculateBreathFirst(element) {
            var total = 0;
            var nextChildElements = [];

            var childNodes = element.childNodes;
            total = childNodes.length;

            forEachElement(childNodes, function (childNode) {
                var grandChildNodes = nodeListToArray(childNode.childNodes);
                total += grandChildNodes.length;
                nextChildElements = nextChildElements.concat(grandChildNodes.filter(isAnElement));
            });
            return [total, nextChildElements];
        }

        while (nextElement) {
            var tuple_total_nextChildElements = calculateBreathFirst(nextElement);
            grandTotal += tuple_total_nextChildElements[0];
            nextGrandChildNodes = nextGrandChildNodes.concat(tuple_total_nextChildElements[1]);

            if (grandTotal >= maxThreshold) {
                break;
            } else {
                nextElement = nextGrandChildNodes.pop();
            }
        }

        return grandTotal;
    }

    function repeat(callback, delay, count) {
        var index = 0;
        var intervalId = setInterval(function () {
            if (callback()) {
                clearInterval(intervalId);
            }

            index++;

            if (index === count) {
                clearInterval(intervalId);
            }
        }, delay);
    }

    return {
        hideElement: hideElement,
        styleImportant: styleImportant,
        isAnElement: isAnElement,
        isParentOrSame: isParentOrSame,
        nodeListToArray: nodeListToArray,
        forEachElement: forEachElement,
        getStyles: getStyles,
        getWeight: getWeight,
        repeat: repeat
    };
})();

var clickTimeStamp = 0;
var checkedPopup = null;
document.addEventListener("click", function () {
    clickTimeStamp = Date.now();
}, true);

var overlayRemover = function (utils) {
    var MIN_POPUP_WEIGHT = 1;
    var MAX_POPUP_WEIGHT = 350;
    var MIN_POPUP_WIDTH = 300;
    var MIN_POPUP_HEIGHT = 200;
    var MAX_BACKGROUND_WEIGHT = 20;
    var BACKGROUND_SIZE_THRESHOLD = 0.9;
    var MAX_TIME_DELAY = 3 * 1000;

    var disable = false;
    var hiddenOverlays = [];

    function containersOverflowAuto() {
        var containers = [document.documentElement, document.body];
        containers.forEach(function (element) {
            var styles = window.getComputedStyle(element);
            if (styles.overflow === "hidden") {
                utils.styleImportant(element, "overflow", "auto");
                utils.styleImportant(element, "position", "static");
            }
            if (styles.overflowY === "hidden") {
                utils.styleImportant(element, "overflowY", "auto");
                utils.styleImportant(element, "position", "static");
            }
        });
    }

    function getPopup() {
        var lastRightOverlay = null;
        var overlay = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

        do {
            var weight = utils.getWeight(overlay, MAX_POPUP_WEIGHT);
            if (weight > MAX_POPUP_WEIGHT) {
                return lastRightOverlay;
            }

            var styles = utils.getStyles(overlay);
            var isPopup = styles.width > MIN_POPUP_WIDTH &&
                styles.height > MIN_POPUP_HEIGHT &&
                (styles.position === "absolute" ||
                styles.position === "fixed");

            if (isPopup) {
                lastRightOverlay = overlay;
            }

            overlay = overlay.parentNode;
        } while (overlay !== document && overlay !== document.body);

        var lastOverlayWeight = utils.getWeight(lastRightOverlay, MAX_POPUP_WEIGHT);
        return lastOverlayWeight > MIN_POPUP_WEIGHT ? lastRightOverlay : null;
    }

    function getBackground(popup) {
        var lastRightBackground = null;
        var overlay = document.elementFromPoint(5, 5);
        if (popup && utils.isParentOrSame(overlay, popup)) {
            overlay = popup;
        }

        var isParentOrSame = popup && utils.isParentOrSame(popup, overlay);
        var windowSize = window.innerWidth * window.innerHeight;

        do {
            if (!isParentOrSame) {
                var weight = utils.getWeight(overlay, MAX_BACKGROUND_WEIGHT);
                if (weight > MAX_BACKGROUND_WEIGHT) {
                    return lastRightBackground;
                }
            }

            var styles = utils.getStyles(overlay);
            var overlaySize = styles.width * styles.height;

            var isBackground = styles.zIndex > 0 &&
                (styles.position === "absolute" || styles.position === "fixed") &&
                overlaySize / windowSize > BACKGROUND_SIZE_THRESHOLD;

            if (isBackground) {
                lastRightBackground = overlay;
            }

            overlay = overlay.parentNode;
        } while (overlay !== document && overlay !== document.body);

        return lastRightBackground;
    }

    function isGoodPopup(popup) {
        var filterWords = ["slider", "spinner"];

        do {
            for (var i = 0; i < filterWords.length; i++) {
                var filterWord = filterWords[i];
                if (popup.id.indexOf(filterWord) > -1 || popup.className.indexOf(filterWord) > -1) {
                    return true;
                }
            }

            popup = popup.parentNode;
        } while (popup !== document && popup !== document.body);

        return false;
    }

    function saveOverlay(overlay) {
        var styles = utils.getStyles(overlay);
        hiddenOverlays.push({element: overlay, displayValue: styles.display});
    }

    function run() {
        chrome.storage.sync.get(['modalHide'], function (items) {
            let params = (new URL(document.location)).searchParams;
            let modalHide = params.get(items.modalHide ? items.modalHide : 'modal-hide');
            if(modalHide !== null && (modalHide.toLowerCase() !== 'false')){
                queriedRun();
            }
        });
        return;
    }

    function queriedRun() {
        if (disable) {
            return;
        }

        var popup = getPopup();
        if (popup === checkedPopup) {
            return;
        }

        var currentTimeStamp = Date.now();
        if (clickTimeStamp && ((currentTimeStamp - clickTimeStamp) < MAX_TIME_DELAY)) {
            checkedPopup = popup;
            return;
        }

        var background = getBackground(popup);
        var mustBeBlocked = popup && background && !isGoodPopup(popup) && popup.tagName !== "IFRAME";

        if (mustBeBlocked) {
            chrome.runtime.sendMessage({command: "getBlockMode"}, function (response) {
                switch (response.mode) {
                    case "DISABLED":
                        break;
                    case "NORMAL":
                        chrome.runtime.sendMessage({command: "blockOverlay"});

                        saveOverlay(popup);
                        utils.hideElement(popup);

                        if (popup === background) {
                            background = getBackground() || popup;
                        }

                        if (background !== popup) {
                            saveOverlay(background);
                            utils.hideElement(background);
                        }

                        containersOverflowAuto();
                        // showToolbar();
                        utils.repeat(containersOverflowAuto, 100, 3 * 10);
                        break;
                }
            });
        }
    }

    function showOverlays() {
        disable = true;
        for (var i = 0; i < hiddenOverlays.length; i++) {
            var hiddenOverlay = hiddenOverlays[i];
            if (hiddenOverlay.displayValue !== "none") {
                utils.styleImportant(hiddenOverlay.element, "display", hiddenOverlay.displayValue);
            }
        }
    }

    var closeToolbarTimeout;

    function showToolbar() {
        var toolbar = document.getElementById("overlayBlock-toolbar");
        if (toolbar) {
            clearTimeout(closeToolbarTimeout);
        } else {
            toolbar = document.createElement("iframe");
            toolbar.id = "overlayBlock-toolbar";
            toolbar.style.position = "fixed";
            toolbar.style.top = "0";
            toolbar.style.left = "calc(50% - 250px)";
            toolbar.style.width = "500px";
            toolbar.style.height = "50px";
            toolbar.style.border = "2px #D6D6D6 solid";
            toolbar.style.borderTop = "none";
            toolbar.style.zIndex = 2147483647;
            toolbar.src = chrome.runtime.getURL("toolbar/toolbar.html");

            document.body.appendChild(toolbar);
        }

        closeToolbarTimeout = setTimeout(function () {
            closeToolbar();
        }, 3000);
    }

    function closeToolbar(noWait) {
        var toolbar = document.getElementById("overlayBlock-toolbar");
        if (toolbar) {
            var closeNow = false;
            if (noWait) {
                closeNow = true;
            } else {
                var isHover = document.querySelector("#overlayBlock-toolbar:hover");
                closeNow = !isHover;
            }

            if (closeNow) {
                toolbar.parentNode.removeChild(toolbar);
            } else {
                setTimeout(closeToolbar, 100);
            }
        }
    }

    return {
        run: run,
        getBackground: getBackground,
        getPopup: getPopup,
        showOverlays: showOverlays,
        showToolbar: showToolbar,
        closeToolbar: closeToolbar
    };
};

overlayRemoverInstance = overlayRemover(utils);

window.addEventListener("load", function load() {
    overlayRemoverInstance.run();

    var observer = new MutationObserver(function () {
        overlayRemoverInstance.run();
    });

    var config = {attributes: true, childList: true, subtree: true, characterData: true};
    observer.observe(document, config);
}, false);


chrome.runtime.onMessage.addListener(onMessage);

function onMessage(request, sender, sendResponse) {
    switch (request.command) {
        case "showOverlays":
            overlayRemoverInstance.showOverlays();
            break;
        case "closeToolbar":
            overlayRemoverInstance.closeToolbar(true);
            break;
    }
}