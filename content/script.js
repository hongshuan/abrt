/**
 * Send a message to the background page.
 */
function notifyExtension(e) {
  console.log("content script sending message");
  browser.runtime.sendMessage({"url": "clicked"});
}

/**
 * Add notifyExtension() as a listener to click events.
 */
window.addEventListener("click", notifyExtension);

var timer;

function start() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(query, 1000);
    query();
}

function stop() {
    clearInterval(timer);
    timer = null;
}

function query() {
    console.log("executing query...");
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

    var dateParts = date.split('-');
    var year = dateParts[0];
    var month = dateParts[1];
    var day = dateParts[2];

    // serviceId is not working, don't know why?
    var svcid = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking/" + svcid + "?month=" + month + "&year=" + year;

    fetch(url, {
        method: "GET",
        credentials: "same-origin"
    })
    .then(function(response) {
        console.log(response);
        return response.json();
    })
    .then(function(json) {
        for (var i = 0; i < json.availableBookingDates.length; i++) {
            var abd = json.availableBookingDates[i];
            if (abd.description == 'UNAVAILABLE' || abd.description == 'FULL') {
                //continue;
            }
            console.log(year + '-' + month + '-' + abd.day + ' ' + abd.description);
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
        for (var i = 0; i < json.availableBookingTimes.length; i++) {
            var abt = json.availableBookingTimes[i];
            console.log(date + ' ' + abt.timeslot);
        }
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

function holdBooking(testCenter, testClass, time) {
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
        console.log('Error on holdBooking: ' + error.message);
    });
}

console.log('--injected--');
console.log(getServiceId('Oshawa', 'G'));
getAvailBookingDates('2017-11-29', 'Oshawa', 'G');
