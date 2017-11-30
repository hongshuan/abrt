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
    console.log('connected');
}

browser.runtime.onConnect.addListener(connected);

function handleMessage(m) {
    if (m.message) {
        showMessage(m.message);
    }
    if (m.output) {
        showOutput(m.output);
    }
}

function start(license, center, date, cls) {
    var info = {
        licenseNum: license,
        testCenter: center,
        testDate:   date,
        testClass:  cls
    };

    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "start", info: info});
    }
}

function stop() {
    /**
     * sends messages to the content script
     */
    if (portFromCS) {
        portFromCS.postMessage({type: "stop"});
    }
}

var showMessage;
var showOutput;

function setCallbacks(message, output) {
    showMessage = message;
    showOutput = output;
}
