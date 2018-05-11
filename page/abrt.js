/**
 * domReady
 */
document.addEventListener('DOMContentLoaded', domReady);

function domReady() {
    getE("start").addEventListener("click", start);
    getE("stop").addEventListener("click", stop);
    getE("empty").addEventListener("click", empty);

//  getE("openModal").addEventListener("click", showModal);
    getE("licensenum").addEventListener("click", showModal);
    getE("closeModal").addEventListener("click", closeModal);

    getE("search").addEventListener("keyup", licenseFilter);

    getE("tablink1").addEventListener("click", function(e) { openTab(e, "tab2") });
    getE("tablink2").addEventListener("click", function(e) { openTab(e, "tab1") });
    getE("tablink3").addEventListener("click", function(e) { openTab(e, "tab3") });

    fillCenterList();

    flatpickr("#startdate", {});
    flatpickr("#enddate", {});

    var btns = document.querySelectorAll("td span.w3-btn");
    for (var btn of btns) {
        btn.onclick = selectDriver;
    }
}

var backgroundPage = browser.extension.getBackgroundPage();

function getE(id) {
    return document.getElementById(id);
}

function start() {
    // console.log(backgroundPage);
    backgroundPage.start(document);
}

function stop() {
    backgroundPage.stop();
}

function empty() {
    getE("messages").innerHTML = '';
}

function showModal() {
    getE('md01').style.display = 'block';
    getE("tablink1").click();
}

function closeModal() {
    getE('md01').style.display = 'none';
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
    input = document.getElementById("search");
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

function selectDriver(e) {
    var el = e.target;
    while (el.nodeName != 'TR') {
        el = el.parentNode;
    }

    var driverName  = el.cells[0].innerText;
    var licenseNum  = el.cells[1].innerText;
    var licenseType = el.cells[2].innerText;
    var expiryDate  = el.cells[3].innerText;

    getE("expiry").value = expiryDate;
    getE("licensenum").value = licenseNum;

    closeModal();
}

function fillCenterList() {
    var dropdown = getE("testcenter");

    var centers = [ 'Oshawa', 'Lindsay', 'Guelph', 'Barrie', 'Brampton', 'London', 'Newmarket' ];
    for (var i = 0; i < centers.length; i++) {
        var option = document.createElement("option");
        option.text = centers[i];
        option.value = option.text;

        dropdown.add(option);
    }
}
