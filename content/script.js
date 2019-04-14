const DEBUG = 1;

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

/**
 * connect to the background script
 */
var backgrnd = browser.runtime.connect({name:"abrt-content-script"});

/**
 * listen for messages from background
 */
backgrnd.onMessage.addListener(handleMessage);

var email = "zhuyf2000@gmail.com";
var interval = 5000;
var working = false;
var licenseNum;
var expiryDate;
var startDate;
var endDate;
var testClass;

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

/**
 * autoClick()
 */
function start() {
    if (working) {
        return;
    }
    working = true;
    setTimeout(autoClick, interval);
}

function stop() {
    working = false;
}

function autoClick() {
    if (!working) {
        return;
    }

    getAvailDates();

    var selectedTestCenter = $('#dtc-list-details li a.selected')
    if (selectedTestCenter) {
        clickIt(selectedTestCenter);
    }

    setTimeout(autoClick, interval);
}

function getAvailDates() {
    //var oshawa = $("a[id='9583']")
    var monthYear = $('.calendar-header h3').textContent;
    var cells = $all('.date-cell-contents a.date-link');

    var dateStart = Date.parse(startDate + ' 00:00:00');
    var dateEnd   = Date.parse(endDate   + ' 00:00:00');

    var avail = false;
    var dates = [];

    for (var i=0; i<cells.length; i++) {
        var info = {
            day: 0,
            description: ""
        };

        info.day = cells[i].attributes["title"].value;

        if (cells[i].classList.contains('disabled')) {
            info.description = "FULL";
        } else {
            info.description = "OPEN";
            var theDate = Date.parse(info.day + ' ' + monthYear + ' 00:00:00');
            if (theDate >= dateStart && theDate <= dateEnd) {
                avail = true;
            }
        }

        dates.push(info);
    }

    showDates(dates);

    if (avail) {
        beep();
    }
}

/**
 * simulate mouse click
 */
function clickIt(element) {
    var evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    element.dispatchEvent(evt);
}

/**
 * beep()
 */
var audioCtx = new AudioContext() // browsers limit the number of concurrent audio contexts, so you better re-use'em

function beep(freq, duration, vol) {
    freq = freq || 400
    duration = duration || 200
    vol = vol || 100
    v = audioCtx.createOscillator()
    u = audioCtx.createGain()
    v.connect(u)
    v.frequency.value = freq
    v.type = "square"
    u.connect(audioCtx.destination)
    u.gain.value = vol*0.01
    v.start(audioCtx.currentTime)
    v.stop(audioCtx.currentTime + duration*0.001)
}

/**
 * helpers
 */
function $id(id) { return document.getElementById(id) }
function $(s)    { return document.querySelector(s) }
function $$(s)   { return document.querySelectorAll(s) }
function $all(s) { return document.querySelectorAll(s) }

document.body.addEventListener("keyup", function(e) {
    if (e.keyCode === 27) {
        fillForm();
        cleanPage();
    }
});

function fillForm() {
    var e = $id("emailAddress");
    if (e) {
        e.value = email + '*';

        e = $id("confirmEmailAddress");
        if (e) e.value = email + '*';

        e = $id("licenceNumber");
        if (e) e.value = licenseNum + '*';

        e = $id("licenceExpiryDate");
        if (e) e.value = expiryDate + '*';
    }
}

function cleanPage() {
    var e = $id('dtc-map');
    if (e) {
        e.remove(); // delete the map

        // Oshawa/Lindsay/PortUnion/Newmarket
        var testCenters = [ '9583', '9575', '9592', '9552' ];

        var lis = $all("#dtc-list-details ul li");
        for (var li of lis) {
            var id = li.firstElementChild.id;
            if (!testCenters.includes(id)) {
                li.remove();
            }
        }

        e = $id('dtc-list-details');
        if (e) {
            e.style.height = "300px";
            e.style.width = "300px";
        }

        e = $('#dtc-list-details .dtc_listings');
        if (e) {
            e.style.height = "300px";
            e.style.width = "300px";
        }

        e = $('.transaction-number-container');
        if (e) { e.remove(); }

        e = $('.location_header');
        if (e) { e.remove(); }

        e = $id('booking-location');
        if (e) {
            e.style.position = "fixed";
            e.style.right = "0";
        }

        e = $('.dtc-filter-options');
        if (e) { e.remove(); }

        e = $('.pageFooter');
        if (e) { e.remove(); }

        e = $('.booking_separator');
        if (e) { e.remove(); }
    }
}
