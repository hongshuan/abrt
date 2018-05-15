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
    var manifest = browser.runtime.getManifest();

    var info = {
        email:      manifest.author,
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
      //el.innerText = d.description;
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

var Calendar = function() {
    this.namesOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
    this.namesOfMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
    this.daysOfMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
};

Calendar.prototype.isLeap = function(y) {
    return (y % 100 == 0) && (y % 400 == 0) ? true : (y % 4 == 0 ? true : false);
};

Calendar.prototype.getDates = function(date) {
    var Y = date.getFullYear();
    var M = date.getMonth();

    if (this.isLeap(Y)) {
        this.daysOfMonths[1] = 29;
    }

    var totalDays = 7*6;

    var firstDay = new Date(Y, M, 1);
    var daysPrevMonth = firstDay.getDay() || 7;
    var daysThisMonth = this.daysOfMonths[M];
    var daysNextMonth = totalDays - daysThisMonth - daysPrevMonth;

    // Prev month
    var prevY, prevM;

    if (M == 0) {
        prevY = Y - 1;
        prevM = 11;
    } else {
        prevY = Y;
        prevM = M - 1;
    }
    var prevMax = this.daysOfMonths[prevM];

    // Next month
    var nextY, nextM;

    if (M == 11) {
        nextY = Y + 1;
        nextM = 0;
    } else {
        nextY = Y;
        prevM = M + 1;
    }

    var dates = [];

    // Add dates in prev month
    for (var i=daysPrevMonth; i>0; i--){
        dates.push({
            year:  prevY,
            month: prevM,
            day:   (prevMax - i + 1),
            id:    'prev' + (prevMax - i + 1),
            attr:  'prevmonth'
        });
    }

    // Add dates in this month
    for(var i=1; i<=daysThisMonth; i++){
        dates.push({
            year:  Y,
            month: M,
            day:   i,
            id:    'day' + i,
            attr:  'thismonth'
        });
    }

    // Add dates in next month
    for (var i=1; i<=daysNextMonth; i++){
        dates.push({
            year:  nextY,
            month: nextM,
            day:   i,
            id:    'next' + i,
            attr:  'nextmonth'
        });
    }

    return dates;
};

Calendar.prototype.getHtml = function(dateStr) {
    var y, m, d;
    [ y, m, d ] = dateStr.split('-');
    var date = new Date(y, m-1, 1);
    var days = this.getDates(date);

    var str = `<table class="w3-table w3-bordered" id="calendar">`;

    var monthYear = this.namesOfMonth[date.getMonth()] + ", " + date.getFullYear();
    str += `<caption><h3 style="margin-top:0;">${monthYear}</h3></caption>`;

    str += "<tr>";
    for(var i=0; i<7; i++) {
        str += `<th class="daysheader">${this.namesOfWeek[i]}</th>`;
    }
    str += "</tr>";

    for (var i=0; i<days.length; i++) {
        if ((i+1)%7 == 1) {
            str += "<tr>";
        }

        var d = days[i];

        str += `<td class="${d.attr}" id="${d.id}">${d.day}</td>`;
        if ((i+1)%7 == 0) {
            str += "</tr>";
        }
    }
    str += "</table>";

    return str;
};

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
