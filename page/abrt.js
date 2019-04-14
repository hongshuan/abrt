/**
 * Utils
 */
function $id(id) { return document.getElementById(id); }
function $(s)    { return document.querySelector(s); }
function $e(s)   { return document.querySelector(s); }
function $one(s) { return document.querySelector(s); }
function $all(s) { return document.querySelectorAll(s); }

/**
 * domReady
 */
document.addEventListener('DOMContentLoaded', domReady);

function domReady() {
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.attach(document);

    $id("start").addEventListener("click", start);
    $id("stop").addEventListener("click", stop);
    $id("empty").addEventListener("click", empty);

    var testBtn = $id("test");
    if (testBtn) {
        testBtn.addEventListener("click", test);
    }

    $id("licensenum").addEventListener("click", showModal);

    var btns = document.querySelectorAll('.speed');
    for (var btn of btns) {
        btn.addEventListener("click", setSpeed);
    }

    flatpickr("#startdate", {});
    flatpickr("#enddate", {});
}

function start() {
    var backgroundPage = browser.extension.getBackgroundPage();
    // console.log(backgroundPage);

    if ($id('startdate').value.length == 0 || $id('enddate').value.length == 0) {
        return;
    }

    backgroundPage.start();
}

function stop() {
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.stop();
}

function setSpeed(e) {
    var secs = Number.parseInt(e.target.innerText);
    var backgroundPage = browser.extension.getBackgroundPage();
    backgroundPage.setSpeed(secs);
    //e.target.parentNode.style.display = 'none';
}

function empty() {
    $id("messages").innerHTML = '';
}

function showModal() {
    $id('md01').style.display = 'block';
    $id("closeModal").addEventListener("click", closeModal);

    $id("tablink1").addEventListener("click", function(e) { openTab(e, "tab2") });
    $id("tablink2").addEventListener("click", function(e) { openTab(e, "tab1") });
    $id("tablink3").addEventListener("click", function(e) { openTab(e, "tab3") });
    $id("tablink1").click();

    $id("search").addEventListener("keyup", licenseFilter);
    $id("save").addEventListener("click", saveLicense);

    loadLicenses();
}

function closeModal() {
    $id('md01').style.display = 'none';

    $id("name").value = '';
    $id("licnum").value = '';
    $id("expire").value = '';
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

    $id("expiry").value = expiryDate;
    $id("licensenum").value = licenseNum;

    var radios = document.querySelectorAll('input[name="testclass"]');
    if (licenseType == "G2") {
        radios[0].checked = true;
    } else if (licenseType == "G") {
        radios[1].checked = true;
    }

    closeModal();
}

function loadLicenses() {
    browser.storage.local.get().then(
        function(value) {
            //console.log(value);
            if (!value.licenses) {
                value.licenses = [];
            }

            var html = `<tr>
                    <th>Name</th>
                    <th>License#</th>
                    <th>G2/G</th>
                    <th>Expiry</th>
                    <th>Action</th>
                    </tr>`;

            var licenses = value.licenses.reverse();
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

            var btns = document.querySelectorAll("td span.w3-btn");
            for (var btn of btns) {
                btn.onclick = selectDriver;
            }
        },
        function() { }
    );
}

function saveLicense() {
    var name = document.getElementById("name").value;
    var licnum = document.getElementById("licnum").value;
    var expire = document.getElementById("expire").value;
    var level = document.querySelector('input[name="level"]:checked').value;

    if (licnum.length != 17 || expire.length != 10) {
        return; // refuse bad input
    }

    browser.storage.local.get().then(
        function(value) {
            if (!value.licenses) {
                value.licenses = [];
            }

            value.licenses.push({ name: name, licnum: licnum, expiry: expire, level: level });
            browser.storage.local.set(value);

            closeModal();
        },
        function() {}
    );
}

function test() {
    console.log("Testing");
    //browser.storage.local.set({ licenses: [] });
    //var backgroundPage = browser.extension.getBackgroundPage();
    //backgroundPage.test();
}
