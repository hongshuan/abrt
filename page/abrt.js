/**
 * four buttons
 */
document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
document.getElementById("clear").addEventListener("click", clear);
document.getElementById("empty").addEventListener("click", empty);

function start() {
    println('Start');

    var licenseNum = document.getElementById("licensenum").value;
    var testCenter = document.getElementById("testcenter").value;
    var testDate   = document.getElementById("testdate").value;
    var testClass  = document.querySelector('input[name="testclass"]:checked').value;

    /*
    println("License=" + licenseNum);
    println("TestCenter=" + testCenter);
    println("TestDate=" + testDate);
    println("TestClass=" + testClass);
    */

    var backgroundPage = browser.extension.getBackgroundPage();
    // console.log(backgroundPage);
    backgroundPage.setBookingInfo(licenseNum, testCenter, testDate, testClass);

    // TODO: connect to content script?

    // TODO: send message to content script
}

function stop() {
    println('Stop');
    // TODO: send message to content script
}

function clear() {
    document.getElementById("output").innerHTML = '';
}

function empty() {
    document.getElementById("messages").innerHTML = '';
}

function print(text) { document.getElementById("output").innerHTML += text; }
function println(text) { print(text + '<br>'); }

function write(text) { document.getElementById("messages").innerHTML += text; }
function writeln(text) { show(text + '<br>'); }

function beep() { playSound('beep.wav'); }
function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('/webres/' + file); audio.play(); }
