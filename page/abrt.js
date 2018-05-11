/**
 * four buttons
 */
document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
document.getElementById("empty").addEventListener("click", empty);

document.getElementById("openModal").addEventListener("click", showModal);
document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("myinput").addEventListener("keyup", licenseFilter);

document.getElementById("tablink1").addEventListener("click", function(e) { openTab(e, "tab2") });
document.getElementById("tablink2").addEventListener("click", function(e) { openTab(e, "tab1") });
document.getElementById("tablink3").addEventListener("click", function(e) { openTab(e, "tab3") });

document.addEventListener('DOMContentLoaded', domReady);

var backgroundPage = browser.extension.getBackgroundPage();

function start() {
    // console.log(backgroundPage);
    backgroundPage.start(document);
}

function stop() {
    backgroundPage.stop();
}

function empty() {
    document.getElementById("messages").innerHTML = '';
}

function showModal() {
    document.getElementById('md01').style.display = 'block';
    document.getElementsByClassName("tablink")[0].click();
}

function closeModal() {
    document.getElementById('md01').style.display = 'none';
}

function openTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].classList.remove("w3-light-grey");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.classList.add("w3-light-grey");
}

function licenseFilter() {
    var input, filter, table, tr, td, i;
    input = document.getElementById("myinput");
    filter = input.value.toUpperCase();
    table = document.getElementById("mytable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function domReady() {
    fillCenterList();
    flatpickr("#startdate", {});
    flatpickr("#enddate", {});
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
