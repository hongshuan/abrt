const DEBUG = 1;

var dpr = DEBUG ? console.log : ()=>{};

/**
 * connect to the background script
 */
var backgrnd = browser.runtime.connect({name:"abrt-content-script"});

/**
 * listen for messages from background
 */
backgrnd.onMessage.addListener(handleBackgroundMessage);

var working = false;
var email = "zhuyf2000@gmail.com";
var licenseNum;
var expiryDate;
var testLevel;
var startDate;
var endDate;
var interval = 5000;

function getInfo(m) {
    if (m.info.email) {
        email = m.info.email;
    }
    licenseNum = m.info.licenseNum;
    expiryDate = m.info.expiry;
    startDate  = m.info.startDate;
    endDate    = m.info.endDate;
    testLevel  = m.info.testLevel;
}

function handleBackgroundMessage(m) {
    switch (m.type) {
    case 'init':
        getInfo(m);
        break;

    case 'start':
        getInfo(m);
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

    var selectedTestCenter = $('#dtc-list-details li a.selected');
    if (selectedTestCenter.length > 0) {
        clickIt(selectedTestCenter[0]);
    } else {
        beep(440, 200, 80, "square")
    }

    setTimeout(autoClick, interval);
}

function getAvailDates() {
    //var oshawa = $("a[id='9583']")
    var monthYear = $('.calendar-header h3').text();

    var dateStart = Date.parse(startDate + ' 00:00:00');
    var dateEnd   = Date.parse(endDate   + ' 00:00:00');

    var avail = false;
    var dates = [];

    $(".date-cell-contents a.date-link").each(function (index, value) {
        var info = { day: 0, description: "" };

        info.day = $(this).attr('title');

        if ($(this).hasClass('disabled')) {
            info.description = "FULL";
        } else {
            info.description = "OPEN";
            var theDate = Date.parse(info.day + ' ' + monthYear + ' 00:00:00');
            if (theDate >= dateStart && theDate <= dateEnd) {
                avail = true;
            }
        }

        dates.push(info);
    })

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

// play(440, 200, 80, "sine")
// play(440, 200, 80, "square")
// play(500, 550, 50, "sine")

function beep(freq, duration, vol, type) {
    freq = freq || 400
    duration = duration || 200
    vol = vol || 100
    type = type || "square"
    v = audioCtx.createOscillator()
    u = audioCtx.createGain()
    v.connect(u)
    v.frequency.value = freq
    v.type = type
    u.connect(audioCtx.destination)
    u.gain.value = vol*0.01
    v.start(audioCtx.currentTime)
    v.stop(audioCtx.currentTime + duration*0.001)
}

/**
 * Magic ESC key
 */
document.body.addEventListener("keyup", function(e) {
    if (e.keyCode === 27) {
        fillForm();
        cleanPage();
    }
});

function fillForm() {
    $("#emailAddress").sendkeys(email)
    $("#confirmEmailAddress").sendkeys(email);
    $("#licenceNumber").sendkeys(licenseNum);
    $("#licenceExpiryDate").sendkeys(expiryDate);
}

function cleanPage() {
    var e = $('#dtc-map');
    if (e.length) {
        e.remove(); // delete the map

        // Oshawa/Lindsay/PortUnion/Newmarket
        var testCenters = [ '9583', '9575', '9592', '9552' ];

        $("#dtc-list-details ul li").each(function (index, value) {
            var id = $(this).attr('id');
            if (!testCenters.includes(id)) {
                $(this).remove();
            }
        })

        $('#dtc-list-details').css({ "height": "400px", "width": "300px" });
        $('#dtc-list-details .dtc_listings').css({ "height": "400px", "width": "300px" });

        $('.transaction-number-container').remove();
        $('.location_header').remove();

        $('#booking-location').css({ "position": "fixed", "right": "0" });

        $('.dtc-filter-options').remove();
        $('.pageFooter').remove();
        $('.booking_separator').remove();
    }
}
