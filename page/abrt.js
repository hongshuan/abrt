/**
 * four buttons
 */
document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
document.getElementById("clear").addEventListener("click", clear);
document.getElementById("empty").addEventListener("click", empty);

var backgroundPage = browser.extension.getBackgroundPage();

function start() {
    // console.log(backgroundPage);
    backgroundPage.start(document);
}

function stop() {
    backgroundPage.stop();
}

function clear() {
    document.getElementById("output").innerHTML = '';
}

function empty() {
    document.getElementById("messages").innerHTML = '';
}
