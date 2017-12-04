/**
 * connects to the background script, and stores the Port in a variable myPort
 */
var myPort = browser.runtime.connect({name:"port-from-cs"});

/**
 * listens for messages on myPort
 */
myPort.onMessage.addListener(handleMessage);

var timer;
var licenseNum;
var testCenter;
var testDate;
var testClass;

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

    case 'hold':
        hold(m.time);
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
    myPort.postMessage({type: 'sound' });
}

/**
 * sends messages to the background script, using myPort
 */
document.body.addEventListener("click", function() {
    // myPort.postMessage({output:'ping'});
    //fillForm();
});

function start() {
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(query, 1000);
    // query();
}

function stop() {
    clearTimeout(timer);
    timer = null;
}

function query() {
    getAvailBookingDates(testDate, testCenter, testClass);

    if (timer) {
        timer = setTimeout(query, 1000);
    }
}

function hold(time) {
    sendMessage('<b>HOLD ' + time.timeslot + '</b>');
    sound();
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
        sendDates(json.availableBookingDates);

        for (var i = 0; i < json.availableBookingDates.length; i++) {
            var abd = json.availableBookingDates[i];
            if (abd.description == 'UNAVAILABLE' || abd.description == 'FULL') {
                continue;
            }

            //console.log(year + '-' + month + '-' + abd.day + ' ' + abd.description);

            var dt = new Date(year, month-1, abd.day);
            var ymd = dt.toISOString().substring(0, 10);

            if (ymd <= testDate) {
                getAvailBookingTimes(ymd, testCenter, testClass);
                stop();
                break;
            }
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
        sendTimes(json.availableBookingTimes);

        if (json.availableBookingTimes.length > 0) {
            console.log(json.availableBookingTimes[0]);
            hold(json.availableBookingTimes[0]);
            stop();
        } else {
            start();
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
        console.log(json.statusToken);
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
        console.log(json.success);
    })
    .catch(function(error) {
        console.log('Error on holdAppointment: ' + error.message);
    });
}

// console.log('--injected--');
// console.log(getServiceId('Oshawa', 'G'));
// getAvailBookingDates('2017-11-29', 'Oshawa', 'G');

// document.addEventListener('DOMContentLoaded', fillForm);

function fillForm() {
    var e = document.getElementById("emailAddress");
    if (e) {
        e.value = "lihsca@gmail.com";
    }
    e = document.getElementById("confirmEmailAddress");
    if (e) {
        e.value = "lihsca@gmail.com";
    }
    e = document.getElementById("licenceNumber");
    if (e) {
        e.value = "Z3187-79607-06108";
    }
    e = document.getElementById("licenceExpiryDate");
    if (e) {
        e.value = "2020/01/29";
    }
}
