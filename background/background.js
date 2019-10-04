const DEBUG = 1;

/**
 * open ABRT page when user click browser toolbar icon
 */
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({
        url: browser.runtime.getURL("page/abrt.html")
    });
});

/**
 * listens for connection attempts from the content script
 */
var contentScript = null;

browser.runtime.onConnect.addListener(function(port) {
    contentScript = new ContentScript(port);
    contentScript.init();

    port.onMessage.addListener(handleMessage);
    port.onDisconnect.addListener((port) => { contentScript = null; });
});

class ContentScript {
    constructor(port) {
        this.port = port;
    }

    init() {
        var info = getInfo();
        this.port.postMessage({type: "init", info });
    }

    start() {
        var info = getInfo();
        this.port.postMessage({type: "start", info });
    }

    stop() {
        this.port.postMessage({type: "stop"});
    }

    speed(secs) {
        this.port.postMessage({type: "speed", interval: secs});
    }
}

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
    }
}

var abrtPage;
var vuedata;
var counter = 0;

function attach(page, data) {
    abrtPage = page;
    vuedata = data;
}

function getInfo() {
    var info = {
        email:      vuedata.email,
        licenseNum: vuedata.driver.licnum,
        expiry:     vuedata.driver.expiry,
        startDate:  vuedata.startdate,
        endDate:    vuedata.enddate,
        testLevel:  vuedata.level,
    };
    return info;
}

function start(data) {
    vuedata = data;

    if (contentScript) {
        contentScript.start();
        println('start');
    } else {
        errorln('open drivetest.ca first');
    }

    var calendar = new Calendar();
    var calendarBox = abrtPage.getElementById("calendarbox");
    calendarBox.innerHTML = calendar.getHtml(data.startdate);
}

function stop() {
    if (contentScript) {
        contentScript.stop();
        println('stop');
    } else {
        errorln('drivetest.ca is not open');
    }
    // counter = 0;
}

function setSpeed(secs) {
    if (contentScript) {
        contentScript.speed(secs);
        println('speed: ' + secs);
    }
}

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

function showDates(dates) {
    //dpr(dates);

    var progressBar = abrtPage.getElementById("progressbar");
    progressBar.style.width = ++counter%100 + '%';
    progressBar.innerText = counter.toString();

    for (var i = 0; i < dates.length; i++) {
        var d = dates[i];
        var id = 'day' + d.day;
        var el = abrtPage.getElementById(id);
        el.classList.remove('some', 'most', 'open', 'unavailable');
        el.classList.add(d.description.toLowerCase());
      //el.innerText = d.description;
    }
}

function showTimes(times) {
    //dpr(times);

    //var progressBar = abrtPage.getElementById("progressbar");
    //progressBar.style.width = ++counter%100 + '%';
    //progressBar.innerText = counter.toString();

    var list = '<ul style="margin:0;">'
    for (var i = 0; i < times.length; i++) {
        var t = times[i].timeslot;
        list += '<li>' + t.substr(0, 10) + ' ' + t.substr(11, 5) + '</li>';
    }
    list += '</ul>';

    println('Found following times on ' + now() + list);
}

function now() {
    var d = new Date();
    d.setTime(d.getTime()-d.getTimezoneOffset()*60*1000);
    var s = d.toISOString();
    return s.substr(0, 10) + ' ' + s.substr(11, 8);
}

function println(text) { vuedata.messages.push(text); }
function errorln(text) { println('<span style="color:red;">' + text + '</span>'); }
