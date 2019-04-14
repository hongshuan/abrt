const DEBUG = 1;

/**
 * connect to the background script
 */
var backgrnd = browser.runtime.connect({name:"port-from-cs"});

/**
 * listen for messages from background
 */
backgrnd.onMessage.addListener(handleMessage);

var email = "zhuyf2000@gmail.com";
var interval = 5;
var working = false;
var licenseNum;
var expiryDate;
var startDate;
var endDate;
var testClass;
var holdGuid;

function handleMessage(m) {
    switch (m.type) {
    case 'info':
        licenseNum = m.info.licenseNum;
        expiryDate = m.info.expiry;
        startDate  = m.info.startDate;
        endDate    = m.info.endDate;
        testClass  = m.info.testClass;
        break;

    case 'start':
        licenseNum = m.info.licenseNum;
        expiryDate = m.info.expiry;
        startDate  = m.info.startDate;
        endDate    = m.info.endDate;
        testClass  = m.info.testClass;
        start();
        break;

    case 'stop':
        stop();
        break;

    case 'speed':
        interval = m.interval*1000;
        break;
    }
}

/**
 * sends messages to the background script
 */
function showMessage(m) { backgrnd.postMessage({type: 'message', message: m}); }
function showDates(d)   { backgrnd.postMessage({type: 'dates',   dates: d}); }
function showTimes(t)   { backgrnd.postMessage({type: 'times',   times: t}); }

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

document.body.addEventListener("keyup", function(e) {
    if (e.keyCode === 27) {
        fillForm();
        cleanPage();
    }
});

function fillForm() {
    var e = document.getElementById("emailAddress");
    if (e) {
        e.value = email + '*';

        e = document.getElementById("confirmEmailAddress");
        if (e) e.value = email + '*';

        e = document.getElementById("licenceNumber");
        if (e) e.value = licenseNum + '*';

        e = document.getElementById("licenceExpiryDate");
        if (e) e.value = expiryDate + '*';
    }
}

function cleanPage() {
    var e = document.getElementById('dtc-map');
    if (e) {
        e.remove(); // delete the map

        var lis = document.querySelectorAll("#dtc-list-details ul li");
        for (var li of lis) {
            var id = li.firstElementChild.id;

            // Oshawa/Lindsay/PortUnion/Newmarket
            if (id == 9583 || id == 9575 || id == 9592 || id == 9552) continue;

            li.remove();
        }

        e = document.getElementById('dtc-list-details');
        if (e) {
            e.style.height = "300px";
            e.style.width = "300px";
        }

        e = document.querySelector('#dtc-list-details .dtc_listings');
        if (e) {
            e.style.height = "300px";
            e.style.width = "300px";
        }

        e = document.querySelector('.transaction-number-container');
        if (e) { e.remove(); }

        e = document.querySelector('.location_header');
        if (e) { e.remove(); }

        e = document.getElementById('booking-location');
        if (e) {
            e.style.position = "fixed";
            e.style.right = "0";
        }

        e = document.querySelector('.dtc-filter-options');
        if (e) { e.remove(); }

        e = document.querySelector('.pageFooter');
        if (e) { e.remove(); }

        e = document.querySelector('.booking_separator');
        if (e) { e.remove(); }
    }
}
