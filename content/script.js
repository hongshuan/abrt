const DEBUG = 1;

/**
 * connects to the background script, and stores the Port in a variable myPort
 */
var myPort = browser.runtime.connect({name:"port-from-cs"});

/**
 * listens for messages on myPort
 */
myPort.onMessage.addListener(handleMessage);

var stopped = true;
var licenseNum;
var testCenter;
var testDate;
var testClass;
var holdGuid;

function handleMessage(m) {
    switch (m.type) {
    case 'start':
        licenseNum = m.info.licenseNum;
        testCenter = m.info.testCenter;
        testDate   = m.info.testDate;
        testClass  = m.info.testClass;
        start();
        break;

    case 'stop':
        stop();
        break;
    }
}

function sendMessage(m) {
    myPort.postMessage({type: 'message', message: m});
}

function sendDates(d) {
    myPort.postMessage({type: 'dates', dates: d});
}

function sendTimes(t) {
    myPort.postMessage({type: 'times', times: t});
}

function beep() {
    myPort.postMessage({type: 'beep' });
}

function sound() {
    if (DEBUG) {
        beep();
        return;
    }
    myPort.postMessage({type: 'sound' });
}

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

/**
 * sends messages to the background script, using myPort
 */
document.body.addEventListener("click", function() {
    // myPort.postMessage({output:'ping'});
    //fillForm();
});

function start() {
    if (stopped) {
        dpr('start');
        stopped = false;
        setTimeout(query, 1000);
        // query();
    }
}

function stop() {
    stopped = true;
}

function query() {
    dpr('query 1');
    if (stopped) {
        return;
    }

    dpr('query 2');
    getAvailBookingDates(testDate, testCenter, testClass);
}

function hold(time) {
    sendMessage('<b>HOLD ' + time.timeslot + '</b>');
    holdAppointment(testCenter, testClass, time.timeslot);
}

/**
 * call API
 */
function getServiceId(centerName, testClass) {
    var centers = {
        Oshawa: {
            G2: 12694,
            G:  12695
        },
        Lindsay: {
            G2: 12576,
            G:  12577
        }
    };

    return centers[centerName][testClass];
}

// getServiceId('Oshawa', 'G2');
// getServiceId('Oshawa', 'G');
// getServiceId('Lindsay', 'G2');
// getServiceId('Lindsay', 'G');

function getAvailBookingDates(date, testCenter, testClass) {

    var year, month, day,

    [ year, month, day ] = date.split('-');

    // serviceId is not working, don't know why?
    var svcid = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking/" + svcid + "?month=" + month + "&year=" + year;

    fetch(url, {
        method: "GET",
        credentials: "same-origin"
    })
    .then(function(response) {
        //console.log(response);
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('getAvailDates');
        dpr(json);

        sendDates(json.availableBookingDates);

        var foundDate = false;

        for (var i = 0; i < json.availableBookingDates.length; i++) {
            var abd = json.availableBookingDates[i];
            if (abd.description == 'UNAVAILABLE' || abd.description == 'FULL') {
                continue;
            }

            dpr(year + '-' + month + '-' + abd.day + ' ' + abd.description);

            var dt = new Date(year, month-1, abd.day);
            var ymd = dt.toISOString().substring(0, 10);

            if (ymd <= testDate) {
                foundDate = ymd;
                break;
            }
        }

        if (foundDate) {
            getAvailBookingTimes(foundDate, testCenter, testClass);
        } else {
            setTimeout(query, 1000);
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
        //console.log(response);
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('getAvailTimes');
        dpr(json);

        sendTimes(json.availableBookingTimes);

        if (json.availableBookingTimes.length > 0) {
            dpr('HOLD ' + json.availableBookingTimes[0]);
            hold(json.availableBookingTimes[0]);
        } else {
            setTimeout(query, 1000);
        }

        //for (var i = 0; i < json.availableBookingTimes.length; i++) {
        //    var abt = json.availableBookingTimes[i];
        //    console.log(date + ' ' + abt.timeslot);
        //}
    })
    .catch(function(error) {
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
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('getStatusToken');
        dpr(json);

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
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('hold');
        dpr(json);

        if (json.success) {
            holdGuid = json.guid;
            payFee(testClass);
        } else {
            setTimeout(query, 1000);
        }
    })
    .catch(function(error) {
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
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('payfees');
        dpr(json);

        complete(testClass, holdGuid);
    })
    .catch(function(error) {
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
        return response.json();
    })
    .then(function(json) {
        dpr(url);
        dpr('complete');
        dpr(json);
        dpr('<img src="data:image/png;base64,' + json.barcode + '" />');

        sendMessage(json.displayId);
        sendMessage('<img width="220" height="32" src="data:image/png;base64,' + json.barcode + '" />');
        stop();
        sound();
    })
    .catch(function(error) {
        console.log('Error on complete: ' + error.message);
    });
}

// console.log('--injected--');
// console.log(getServiceId('Oshawa', 'G'));
// getAvailBookingDates('2017-11-29', 'Oshawa', 'G');

function fillForm() {
    var e = document.getElementById("emailAddress");
    if (e) e.value = "lihsca@gmail.com";

    e = document.getElementById("confirmEmailAddress");
    if (e) e.value = "lihsca@gmail.com";

    e = document.getElementById("licenceNumber");
    if (e) e.value = "Z3187-79607-06108";

    e = document.getElementById("licenceExpiryDate");
    if (e) e.value = "2020/01/29";
}
