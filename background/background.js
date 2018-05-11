const DEBUG = 1;

/**
 * open ABRT page when user click browser toolbar icon
 */
browser.browserAction.onClicked.addListener(() => {
  //browser.tabs.create({ url: "abrt.html" });
    browser.tabs.create({
        url: browser.runtime.getURL("page/abrt.html")
    });
});

/**
 * listens for connection attempts from the content script
 */
var portFromCS;

/**
 * when it receives a connection attempt:
 *   - stores the port in a variable named portFromCS
 *   - sends the content script a message using the port
 *   - starts listening to messages received on the port, and logs them
 */
function connected(p) {
    portFromCS = p;
    portFromCS.onMessage.addListener(handleMessage);
    portFromCS.onDisconnect.addListener((p) => { portFromCS = null; });
    dpr('content script connected');
}

browser.runtime.onConnect.addListener(connected);

function handleMessage(m) {
    switch (m.type) {
    case 'message':
        println(m.message);
        break;

    case 'dates':
        showDates(m.dates);
        break;

    case 'times':
        showTimes(m.times);
        break;

    case 'beep':
        beep();
        break;

    case 'sound':
        sound();
        break;
    }
}

var abrtPage;
var outputElement;
var messageElement;
var progressBar;
var calendar;
var counter = 0;

function start(page) {
    abrtPage = page;

    outputElement  = abrtPage.getElementById("output");
    messageElement = abrtPage.getElementById("messages");
    progressBar    = abrtPage.getElementById("progressbar");

    var info = {
        licenseNum: abrtPage.getElementById("licensenum").value,
        testCenter: abrtPage.getElementById("testcenter").value,
        startDate:  abrtPage.getElementById("startdate").value,
        endDate:    abrtPage.getElementById("enddate").value,
        testClass:  abrtPage.querySelector('input[name="testclass"]:checked').value,
        scanOnly:   abrtPage.querySelector('input[name="scanonly"]').checked
    };
    dpr(info);

    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "start", info: info});
        println('start');
    } else {
        errorln('open drivetest.ca first');
    }

    calendar = tableCalendar(info.startDate);
    outputElement.innerHTML = calendar;
}

function stop() {
    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "stop"});
        println('stop');
    } else {
        errorln('drivetest.ca is not open');
    }

    counter = 0;
}

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

function showDates(dates) {
    dpr(dates);

    progressBar.style.width = ++counter%100 + '%';
    progressBar.innerText = counter.toString();

    for (var i = 0; i < dates.length; i++) {
        var d = dates[i];
        var id = 'day' + d.day;
        var el = abrtPage.getElementById(id);
        el.classList.remove('some', 'most', 'open', 'unavailable');
        el.classList.add(d.description.toLowerCase());
        el.innerText = d.description;
    }
}

function showTimes(times) {
    dpr(times);

    //progressBar.style.width = ++counter%100 + '%';
    //progressBar.innerText = counter.toString();

    var list = '<ul style="margin:0;">'
    for (var i = 0; i < times.length; i++) {
        var t = times[i];
        list += '<li>' + t.timeslot + '</li>';
    }
    list += '</ul>';

    println(now() + list);
}

function now() {
    var d = new Date();
    d.setTime(d.getTime()-d.getTimezoneOffset()*60*1000);
    var s = d.toISOString();
    return s.substr(0, 10) + ' ' + s.substr(11, 8);
}

function tableCalendar(date) {
    var year, month, day;

    [ year, month, day ] = date.split('-');

    var now = new Date(year, month-1, day);

    year = now.getFullYear();
    month = now.getMonth();
    day = now.getDate();

    var days = getDays(month, year);

    var text = "";
    text += '<table border="0" cellspacing="0" class="w3-table w3-border w3-bordered">';
    for (var d = 1; d <= days; d++) {
        if (d%3 == 1) {
            text += '<tr>';
        }

        text += '<td>' + year + '-' + (month+1) + '-' + d + '</td>';
        text += '<td id="day' + d + '" width="25%"></td>';

        if (d%3 == 0) {
            text += '</tr>';
        }
    }
    text += '</table>'
    return text;
}

function print(text) { messageElement.innerHTML += text; }
function println(text) { print(text + '<br>'); }
function errorln(text) { println('<span style="color:red;">' + text + '</span>'); }

function beep() {
    var testClass = abrtPage.querySelector('input[name="testclass"]:checked').value;
    if (testClass == 'G) {
        playSound('BikeHorn.mp3');
    } else {
        playSound('TwoTone.mp3');
    }
}

function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('/assets/' + file); audio.play(); }
