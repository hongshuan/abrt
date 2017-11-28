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

    var serviceId = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking/" + serviceId + "?month=" + month + "&year=" + year;

    fetch(url, { method: "GET" })
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            for (var i = 0; i < json.availableBookingDates.length; i++) {
                var abd = obj.availableBookingDates[i];
                if (abd.description == 'UNAVAILABLE' || abd.description == 'FULL') {
                    //continue;
                }
                console.log(year + '-' + month + '-' + abd.day + ' ' + abd.description);
            }
        })
}

function getAvailBookingTimes(date, testCenter, testClass) {

    var serviceId = getServiceId(testCenter, testClass);

    var url = "https://drivetest.ca/booking/v1/booking?date=" + date + "&is=" + serviceId;

    fetch(url, { method: "GET" })
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            for (var i = 0; i < json.availableBookingTimes.length; i++) {
                var abt = obj.availableBookingTimes[i];
                console.log(date + ' ' + abt.timeslot);
            }
        })
}

function getStatusToken(licenseNum) {
    var url = "https://drivetest.ca/booking/v1/status";

    fetch(url, {
        method: "POST",
        body: JSON.stringify({ licenseNumber: licenseNum })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        console.log(json.statusToken);
    })
}

function holdBooking(testCenter, testClass, time) {
    var url = "https://drivetest.ca/booking/v1/booking/hold";

    var serviceId = getServiceId(testCenter, testClass);

    fetch(url, {
        method: "POST",
        body: JSON.stringify({
            serviceId: serviceId,
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
}
