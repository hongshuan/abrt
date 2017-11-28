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
 * Log that we received the message.
 */
function notify(message) {
  console.log("background script received message", message);
}

/**
 * Assign `notify()` as a listener to messages from the content script.
 */
browser.runtime.onMessage.addListener(notify);

var licenseNum;
var testCenter;
var testDate;
var testClass;

function setBookingInfo(license, center, date, cls) {
    licenseNum = license;
    testCenter = center;
    testDate   = date;
    testClass  = cls;
}
