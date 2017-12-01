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
    // console.log('connected');
}

browser.runtime.onConnect.addListener(connected);

function handleMessage(m) {
    if (m.message) {
        writeln(m.message);
    }
    if (m.output) {
        println(m.output);
    }
    if (m.beep) {
        beep();
    }
    if (m.sound) {
        sound();
    }
}

var abrtPage;
var outputElement;
var messageElement;

function start(page) {
    abrtPage = page;

    outputElement  = abrtPage.getElementById("output");
    messageElement = abrtPage.getElementById("messages");

    var info = {
        licenseNum: abrtPage.getElementById("licensenum").value,
        testCenter: abrtPage.getElementById("testcenter").value,
        testDate:   abrtPage.getElementById("testdate").value,
        testClass:  abrtPage.querySelector('input[name="testclass"]:checked').value
    };

    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "start", info: info});
        println('start');
    } else {
        println('open drivetest.ca first');
    }

    //outputElement.innerHTML = getCalendar();
}

function stop() {
    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "stop"});
        println('stop');
    } else {
        println('drivetest.ca is not open');
    }
}

function print(text) {
    if (outputElement.innerHTML.length > 800) {
        outputElement.innerHTML = '';
    }
    outputElement.innerHTML += text;
}
function println(text) { print(text + '<br>'); }

function write(text) { messageElement.innerHTML += text; }
function writeln(text) { write(text + '<br>'); }

function beep() { playSound('beep.wav'); }
function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('/webres/' + file); audio.play(); }
