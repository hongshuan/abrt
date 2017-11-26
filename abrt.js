var timer;

document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
document.getElementById("clear").addEventListener("click", clear);
document.getElementById("empty").addEventListener("click", empty);

const OSHWA   = 12694;
const LINDSAY = 12577;

function getAvailBookingDates() {
  var url = "https://drivetest.ca/booking/v1/booking/" + testCenter + "?month=" + month + "&year=" + year;

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
          println(abd.day + ' ' + abd.description);
      }
  })
}

function getAvailBookingTimes(date, testCenter) {
  var url = "https://drivetest.ca/booking/v1/booking?date=" + date + "&is=" + testCenter;

  fetch(url, { method: "GET" })
  .then(function(response) {
      return response.json();
  })
  .then(function(json) {
      for (var i = 0; i < json.availableBookingTimes.length; i++) {
          var abt = obj.availableBookingTimes[i];
          println(date + ' ' + abt.timeslot);
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
      println(json.statusToken);
  })
}

function hold(testCenter, time, level) {
  var url = "https://drivetest.ca/booking/v1/booking/hold";

  fetch(url, {
      method: "POST",
      body: JSON.stringify({
          serviceId: textCenter,
          time: time,
          licenceClass: level,
          frenchTest: false
      })
  })
  .then(function(response) {
      return response.json();
  })
  .then(function(json) {
      println(json.success);
  })
}

function query() {
    var licenseNum = document.getElementById("licensenum").value;
    var testCenter = document.getElementById("testcenter").value;
    var testDate   = document.getElementById("testdate").value;
    var testLevel  = document.querySelector('input[name="testlevel"]:checked').value;

    println("License=" + licenseNum);
    println("TestCenter=" + testCenter);
    println("TestDate=" + testDate);
    println("TestLevel=" + testLevel);
}

function start() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(query, 1000);
    println('Start');
}

function stop() {
    clearInterval(timer);
    timer = null;
    println('Stop');
}

function clear() { document.getElementById("output").innerHTML = ''; }
function print(text) { document.getElementById("output").innerHTML += text; }
function println(text) { print(text + '<br>'); }

function empty() { document.getElementById("messages").innerHTML = ''; }
function show(text) { document.getElementById("messages").innerHTML += text; }
function showln(text) { show(text + '<br>'); }

function beep() { playSound('beep.wav'); }
function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('webres/' + file); audio.play(); }
