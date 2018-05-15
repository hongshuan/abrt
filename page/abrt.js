/**
 * domReady
 */
document.addEventListener('DOMContentLoaded', domReady);

function domReady() {
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.attach(document);

    getE("start").addEventListener("click", start);
    getE("stop").addEventListener("click", stop);
    getE("empty").addEventListener("click", empty);

    var testBtn = getE("test");
    if (testBtn) {
        testBtn.addEventListener("click", test);
    }

    getE("licensenum").addEventListener("click", showModal);

    fillCenterList();

    flatpickr("#startdate", {});
    flatpickr("#enddate", {});
}

function getE(id) {
    return document.getElementById(id);
}

function start() {
    var backgroundPage = browser.extension.getBackgroundPage();
    // console.log(backgroundPage);

    if (getE('startdate').value.length == 0 || getE('enddate').value.length == 0) {
        return;
    }

    backgroundPage.start();
}

function stop() {
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.stop();
}

function empty() {
    getE("messages").innerHTML = '';
}

function showModal() {
    getE('md01').style.display = 'block';
    getE("closeModal").addEventListener("click", closeModal);

    getE("tablink1").addEventListener("click", function(e) { openTab(e, "tab2") });
    getE("tablink2").addEventListener("click", function(e) { openTab(e, "tab1") });
    getE("tablink3").addEventListener("click", function(e) { openTab(e, "tab3") });
    getE("tablink1").click();

    getE("search").addEventListener("keyup", licenseFilter);
    getE("save").addEventListener("click", saveLicense);

    loadLicenses();

    var btns = document.querySelectorAll("td span.w3-btn");
    for (var btn of btns) {
        btn.onclick = selectDriver;
    }
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

    var radios = document.querySelectorAll('input[name="testclass"]');
    if (licenseType == "G2") {
        radios[0].checked = true;
    } else if (licenseType == "G") {
        radios[1].checked = true;
    }

    closeModal();
}

function loadLicenses() {
    var licenses = JSON.parse(localStorage.getItem("licenses"));

    if (!licenses) {
        licenses = [];
    }

    var html = `<tr>
            <th>Name</th>
            <th>License#</th>
            <th>G2/G</th>
            <th>Expiry</th>
            <th>Action</th>
            </tr>`;

    for (var lic of licenses) {
        if (lic.licnum.length != 17 || lic.expiry.length != 10) {
            continue; // skip bad input
        }
        html += `<tr>
            <td>${lic.name}</td>
            <td>${lic.licnum}</td>
            <td>${lic.level}</td>
            <td>${lic.expiry}</td>
            <td><span class="w3-btn w3-tiny w3-blue">Copy</span></td>
            </tr>`;
    }

    document.getElementById("mytable").innerHTML = html;
}

function saveLicense() {
    var name = document.getElementById("name").value;
    var licnum = document.getElementById("licnum").value;
    var expire = document.getElementById("expire").value;
    var level = document.querySelector('input[name="level"]:checked').value;

    if (licnum.length != 17 || expire.length != 10) {
        return; // refuse bad input
    }

    var licenses = JSON.parse(localStorage.getItem("licenses"));

    if (!licenses) {
        licenses = [];
    }

    licenses.push({ name: name, licnum: licnum, expiry: expire, level: level });
    localStorage.setItem("licenses", JSON.stringify(licenses));

    closeModal();
}

function fillCenterList() {
    var dropdown = getE("testcenter");

    var centers = [ 'Oshawa', 'Lindsay' ];
    //  centers = [ 'Oshawa', 'Lindsay', 'Guelph', 'Barrie', 'Brampton', 'London', 'Newmarket' ];

    for (var i = 0; i < centers.length; i++) {
        var option = document.createElement("option");
        option.text = centers[i];
        option.value = option.text;

        dropdown.add(option);
    }
}

function test() {
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.test();
}
