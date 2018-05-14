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
    outputElement.innerHTML = calendar.renderHtml(info.startDate);
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
        email:      manifest.email,
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
    this.DaysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
    this.Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

    var d = new Date();

    this.CurrentMonth = d.getMonth();
    this.CurrentYear = d.getFullYear();
};

Calendar.prototype.renderHtml = function(dateStr) {
    var y, m, d;

    [ y, m, d ] = dateStr.split('-');

    var date = new Date(y, m-1, d);

    this.CurrentYear = y = date.getFullYear();
    this.CurrentMonth = m = date.getMonth();

    // 1st day of the selected month
    var firstDayOfCurrentMonth = new Date(y, m, 1).getDay();

    // Last date of the selected month
    var lastDateOfCurrentMonth = new Date(y, m+1, 0).getDate();

    // Last day of the previous month
    var lastDateOfLastMonth = m == 0 ? new Date(y-1, 11, 0).getDate() : new Date(y, m, 0).getDate();

    // Write selected month and year. This HTML goes into <div id="month"></div>
    var monthYear = this.Months[m] + ', ' + y;

    var html = '<table class="w3-table w3-bordered" id="calendar">';

    html += '<caption><h3 style="margin-top:0;">' + monthYear + '</h3></caption>';

    // Write the header of the days of the week
    html += '<tr>';
    for(var i = 0; i < 7; i++) {
        html += '<th class="daysheader">' + this.DaysOfWeek[i] + '</th>';
    }
    html += '</tr>';

    var p = dm = 1;

    var cellvalue;

    for (var d, i=0, z0=0; z0<6; z0++) {
        html += '<tr>';

        for (var z0a = 0; z0a < 7; z0a++) {
            d = i + dm - firstDayOfCurrentMonth;

            if (d < 1){
                // Dates from prev month
                cellvalue = lastDateOfLastMonth - firstDayOfCurrentMonth + p++;
                cellvalue = '';
                html += '<td class="prevmonth">' + (cellvalue) + '</td>';
            } else if (d > lastDateOfCurrentMonth){
                // Dates from next month
                cellvalue = p;
                cellvalue = '';
                html += '<td class="nextmonth">' + (cellvalue) + '</td>';
                p++;
            } else {
                // Current month dates
                html += '<td class="thismonth" id="day' + d + '">' + (d) + '</td>';
                p = 1;
            }

            if (i % 7 == 6 && d >= lastDateOfCurrentMonth) {
                z0 = 10; // no more rows
            }

            i++;
        }

        html += '</tr>';
    }

    html += '</table>';

    return html;
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
