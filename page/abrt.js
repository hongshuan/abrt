/**
 * four buttons
 */
document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
//document.getElementById("clear").addEventListener("click", clear);
document.getElementById("empty").addEventListener("click", empty);

document.addEventListener('DOMContentLoaded', domReady);

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

function domReady() {
    //fillDateList();
    fillCenterList();
    flatpickr("#startdate", {});
    flatpickr("#enddate", {});
}

function fillDateList() {
    var fillList = function(dropdown) {
        var today = new Date();
        for (var i = 0; i < 60; i++) {
            var d = new Date(today);
            d.setDate(today.getDate() + i);

            var option = document.createElement("option");
            option.text = d.toISOString().substring(0, 10);
            option.value = option.text;

            dropdown.add(option);
        }
    }

    var dropdown;

    dropdown = document.getElementById("startdate");
    fillList(dropdown);

    dropdown = document.getElementById("enddate");
    fillList(dropdown);
}

function fillCenterList() {
    var dropdown = document.getElementById("testcenter");

    var centers = [ 'Oshawa', 'Lindsay', 'Guelph', 'Barrie', 'Brampton', 'London', 'Newmarket' ];
    for (var i = 0; i < centers.length; i++) {
        var option = document.createElement("option");
        option.text = centers[i];
        option.value = option.text;

        dropdown.add(option);
    }
}
