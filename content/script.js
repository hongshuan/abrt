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
var interval = 500;
var stopped = true;
var licenseNum;
var expiryDate;
var testCenter;
var startDate;
var endDate;
var testClass;
var scanOnly;
var holdGuid;

function handleMessage(m) {
    switch (m.type) {
    case 'info':
        licenseNum = m.info.licenseNum;
        expiryDate = m.info.expiry;
        testCenter = m.info.testCenter;
        startDate  = m.info.startDate;
        endDate    = m.info.endDate;
        testClass  = m.info.testClass;
        scanOnly   = m.info.scanOnly;
        break;

    case 'start':
        licenseNum = m.info.licenseNum;
        expiryDate = m.info.expiry;
        testCenter = m.info.testCenter;
        startDate  = m.info.startDate;
        endDate    = m.info.endDate;
        testClass  = m.info.testClass;
        scanOnly   = m.info.scanOnly;
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
function showMessage(m) {
    backgrnd.postMessage({type: 'message', message: m});
}

function showDates(d) {
    backgrnd.postMessage({type: 'dates', dates: d});
}

function showTimes(t) {
    backgrnd.postMessage({type: 'times', times: t});
}

function beep() {
    backgrnd.postMessage({type: 'beep' });
}

function sound() {
    backgrnd.postMessage({type: 'sound' });
}

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

document.getElementById("emailAddress").addEventListener("blur", function(e) {
    // this doesn't work
    if (e.target.value != email) {
        e.target.value = email;
    }
});

function start() {
    if (stopped) {
        stopped = false;
        setTimeout(query, interval);
        // query();
    }
}

function stop() {
    stopped = true;
}

function query() {
    if (stopped) {
        return;
    }

    getAvailBookingDates(startDate, endDate, testCenter, testClass);
}

function hold(time) {
    showMessage('<b>HOLD ' + time.timeslot + '</b>');
    holdAppointment(testCenter, testClass, time.timeslot);
}

/**
 * call API
 */
function getServiceId(centerName, testClass) {
    var centers = {
        Oshawa:    { G2: 18295, G: 18382 },
        Lindsay:   { G2: 18264, G: 18373 },
        Guelph:    { G2: 18280, G: 18364 },
        Newmarket: { G2: 18290, G: 18377 },
        PortUnion: { G2: 18297, G: 18384 },
/*
        Barrie:    { G2: 18272, G: 18351 },
        Brampton:  { G2: 18273, G: 18353 },
        London:    { G2: 18287, G: 18374 },
*/
    };

    return centers[centerName][testClass];
}

// getServiceId('Oshawa', 'G2');
// getServiceId('Oshawa', 'G');
// getServiceId('Lindsay', 'G2');
// getServiceId('Lindsay', 'G');

function getAvailBookingDates(startDate, endDate, testCenter, testClass) {

    var year, month, day,

    [ year, month, day ] = endDate.split('-');

    // serviceId is not working, don't know why?
    var svcid = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking/" + svcid + "?month=" + month + "&year=" + year;

    fetch(url, {
        method: "GET",
        credentials: "same-origin"
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        showDates(json.availableBookingDates);

        for (var i = 0; i < json.availableBookingDates.length; i++) {
            var abd = json.availableBookingDates[i];
            if (abd.description == 'UNAVAILABLE' || abd.description == 'FULL') {
                continue;
            }

            var dt = new Date(year, month-1, abd.day);
            var ymd = dt.toISOString().substring(0, 10);

            //dpr(ymd + ' ' + abd.description);

            if (ymd >= startDate && ymd <= endDate) {
                getAvailBookingTimes(ymd, testCenter, testClass);
            }
        }

        if (!stopped) {
            setTimeout(query, interval);
        }
    })
    .catch(function(error) {
        console.log('Error on getAvailBookingDates: ' + error.message);
    });
}

function getAvailBookingTimes(date, testCenter, testClass) {

    var svcid = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking?date=" + date + "&is=" + svcid;

    fetch(url, {
        method: "GET",
        credentials: "same-origin"
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        if (json.availableBookingTimes.length > 0) {
            beep();
            showTimes(json.availableBookingTimes);
            if (scanOnly) {
                return;
            }
            hold(json.availableBookingTimes[0]);
        }
    })
    .catch(function(error) {
        // TODO: show error messaage in message window
        console.log('Error on getAvailBookingTimes: ' + error.message);
    });
}

function getStatusToken(licenseNum) {
    var url = "https://drivetest.ca/booking/v1/status";

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ licenseNumber: licenseNum })
    })
    .then(function(response) {
      //dpr(url);
        dpr('getStatusToken');
        dpr(response);
        return response.json();
    })
    .then(function(json) {
      //dpr(json);
        dpr(json.statusToken);
    })
    .catch(function(error) {
        console.log('Error on getStatusToken: ' + error.message);
    });
}

function holdAppointment(testCenter, testClass, time) {
    var url = "https://drivetest.ca/booking/v1/booking/hold";

    var svcid = getServiceId(testCenter, testClass);

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
            serviceId: svcid,
            time: time,
            licenceClass: testClass,
            frenchTest: false
        })
    })
    .then(function(response) {
      //dpr(url);
        dpr('holdAppointment');
        dpr(response);
        return response.json();
    })
    .then(function(json) {
      //dpr(json);
        if (json.success) {
            holdGuid = json.guid;
            payFee(testClass);
        }
    })
    .catch(function(error) {
        // TODO: show error messaage in message window
        console.log('Error on holdAppointment: ' + error.message);
    });
}

function payFee(testClass) {
    var url = "https://drivetest.ca/booking/v1/booking/fees";

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
            licenceClass: testClass,
            reschedule: false,
            existingAppointmentGuid: null
        })
    })
    .then(function(response) {
      //dpr(url);
        dpr('payFee');
        dpr(response);
        return response.json();
    })
    .then(function(json) {
        complete(testClass, holdGuid);
    })
    .catch(function(error) {
        // TODO: show error messaage in message window
        console.log('Error on payFee: ' + error.message);
    });
}

function complete(testClass, holdGuid) {
    var url = "https://drivetest.ca/booking/v1/booking/complete";

    var now = (new Date()).getTime();

    fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
            appointmentHoldGuid: holdGuid,
            confirmationNumber: "",
            timestamp: now,
            licenceClass: testClass
        })
    })
    .then(function(response) {
      //dpr(url);
        dpr('complete');
        dpr(response);
        return response.json();
    })
    .then(function(json) {
        dpr('<img src="data:image/png;base64,' + json.barcode + '" />');

        showMessage(json.displayId);
        showMessage('<img width="220" height="32" src="data:image/png;base64,' + json.barcode + '" />');
        stop();
        sound();
    })
    .catch(function(error) {
        // TODO: show error messaage in message window
        console.log('Error on complete: ' + error.message);
    });
}

function callFuncByName(functionName, context /*, args */) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for(var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    if (context[func] == undefined || typeof(context[func]) != 'function') {
        return;
    }
    return context[func].apply(context, args);
}

// console.log('--injected--');
// console.log(getServiceId('Oshawa', 'G'));
// getAvailBookingDates('2017-11-29', 'Oshawa', 'G');

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
