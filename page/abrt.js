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
    getE("save").addEventListener("click", saveLicense);

    getE("tablink1").addEventListener("click", function(e) { openTab(e, "tab2") });
    getE("tablink2").addEventListener("click", function(e) { openTab(e, "tab1") });
    getE("tablink3").addEventListener("click", function(e) { openTab(e, "tab3") });

    fillCenterList();

    flatpickr("#startdate", {});
    flatpickr("#enddate", {});
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

    closeModal();
}

function loadLicenses() {
    var licenses = JSON.parse(localStorage.getItem("licenses"));

    var html = `<tr>
            <th>Name</th>
            <th>License#</th>
            <th>G2/G</th>
            <th>Expiry</th>
            <th>Action</th>
            </tr>`;

    for (var lic of licenses) {
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

    var licenses = JSON.parse(localStorage.getItem("licenses"));

    if (!licenses) {
        licenses = [
            {
                  name: "HE YANNAN",
                licnum: "H2001-78909-46223",
                 level: "G2",
                expiry: "2022/01/06"
            }, {
                  name: "YU LINGHAO",
                licnum: "Y9001-47409-31206",
                 level: "G2",
                expiry: "2022/01/06"
            }, {
                  name: "MENG YALING",
                licnum: "M2531-78907-35113",
                 level: "G",
                expiry: "2018/05/29"
            }, {
                  name: "REN DA",
                licnum: "R2492-14709-00720",
                 level: "G",
                expiry: "2022/07/23"
            }, {
                  name: "NIU QUNLI",
                licnum: "N4741-63708-10415",
                 level: "G2",
                expiry: "2023/03/06"
            }
        ];
    }

    licenses.push({ name: name, licnum: licnum, expiry: expire, level: level });
    localStorage.setItem("licenses", JSON.stringify(licenses));

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
