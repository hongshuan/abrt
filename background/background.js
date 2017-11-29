/**
 * open ABRT page when user click browser toolbar icon
 */
browser.browserAction.onClicked.addListener(() => {
  //browser.tabs.create({ url: "abrt.html" });
    browser.tabs.create({
        url: browser.runtime.getURL("page/abrt.html")
    });
});

var licenseNum;
var testCenter;
var testDate;
var testClass;

function setBookingInfo(license, center, date, cls) {
    licenseNum = license;
    testCenter = center;
    testDate   = date;
    testClass  = cls;

    // this doesn't work
    // console.log("License=" + licenseNum);
    // console.log("TestCenter=" + testCenter);
    // console.log("TestDate=" + testDate);
    // console.log("TestClass=" + testClass);

    portFromCS.postMessage({greeting: "from background in setBookingInfo!"});
}

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
    portFromCS.postMessage({greeting: "hi there content script!"});
    portFromCS.onMessage.addListener(function(m) {
        console.log("In background script, received message from content script")
        console.log(m.greeting);
    });
}

browser.runtime.onConnect.addListener(connected);

/**
 * sends messages to the content script, using portFromCS
 */
// portFromCS.postMessage({greeting: "they clicked the button!"});
