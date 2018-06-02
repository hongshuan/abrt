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
var contentScript = null;

browser.runtime.onConnect.addListener(function(port) {
    contentScript = new ContentScript(port);
    contentScript.info(getInfo());

    port.onMessage.addListener(handleMessage);
    port.onDisconnect.addListener((port) => { contentScript = null; });
});

class ContentScript {
    constructor(port) {
        this.port = port;
    }

    info(info) {
        this.port.postMessage({type: "info", info: info});
    }

    start(info) {
        this.port.postMessage({type: "start", info: info});
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
var counter = 0;

function attach(page) {
    abrtPage = page;

    outputElement  = abrtPage.getElementById("output");
    messageElement = abrtPage.getElementById("messages");
    progressBar    = abrtPage.getElementById("progressbar");
}

function start() {
    var info = getInfo();

    if (contentScript) {
        contentScript.start(info);
        println('start');
    } else {
        errorln('open drivetest.ca first');
    }

    var calendar = new Calendar();
    outputElement.innerHTML = calendar.getHtml(info.startDate);
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

function getInfo() {
    var info = {
        licenseNum: abrtPage.getElementById("licensenum").value,
        expiry:     abrtPage.getElementById("expiry").value,
        testCenter: abrtPage.getElementById("testcenter").value,
        startDate:  abrtPage.getElementById("startdate").value,
        endDate:    abrtPage.getElementById("enddate").value,
        testClass:  abrtPage.querySelector('input[name="testclass"]:checked').value,
        scanOnly:   abrtPage.querySelector('input[name="scanonly"]').checked
    };
    dpr(info);
    return info;
}

function setSpeed(secs) {
    if (contentScript) {
        contentScript.speed(secs);
        println('speed: ' + secs + secs > 1 ? ' seconds' : ' second');
    }
}

function dpr(arg) {
    if (DEBUG) {
        console.log(arg);
    }
}

function showDates(dates) {
    //dpr(dates);

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

function print(text) { messageElement.innerHTML += text; }
function println(text) { print(text + '<br>'); }
function errorln(text) { println('<span style="color:red;">' + text + '</span>'); }

function beep() {
    var testClass = abrtPage.querySelector('input[name="testclass"]:checked').value;
    if (testClass == 'G') {
        playSound('BikeHorn.mp3');
    } else if (testClass == 'G2') {
        playSound('TwoTone.mp3');
    }
}

function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('/assets/' + file); audio.play(); }

function test() {
    beep();
}
