var timer;

function autoSubmit(){
  if (document.getElementById("autosubmit").checked) {
    setTimeout(function(){ submitForm(); }, 300);
  }
}

function submitForm(){
  var tracking = document.getElementById('tracking').value.trim();
  if (tracking.length > 9) {
    document.forms["form1"].submit();
  }
}

function query() {
  var url = "http://192.168.0.116/dataExchange/core/ttt.php";
  url = "http://www.play.dev/ttt.php";

  //const data = new URLSearchParams();
  //for (const pair of new FormData(document.getElementById("form"))) {
  //    data.append(pair[0], pair[1]);
  //}

  fetch(url, {
      method: "POST",
      body: new FormData(document.getElementById("form")),
      //headers: {
          //"Content-Type": "application/x-www-form-urlencoded",
          // "Content-Type": "multipart/form-data",
      //},
  })
  .then(function(response) {
      return response.text();
  })
  .then(function(text) {
      //println(text)

      //  https://stackoverflow.com/questions/9598791/create-a-dom-document-from-string-without-jquery
      var doctype = document.implementation.createDocumentType(
          'html',
          '-//W3C//DTD XHTML 1.0 Strict//EN',
          'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
      );

      var dom = document.implementation.createDocument(
          'http://www.w3.org/1999/xhtml',
          'html',
          doctype
      );

      dom.documentElement.innerHTML = text;

      var uk = dom.querySelector("#username .key").innerHTML;
      var uv = dom.querySelector("#username .val").innerHTML;

      var pk = dom.querySelector("#password .key").innerHTML;
      var pv = dom.querySelector("#password .val").innerHTML;

      println(uk + '=' + uv);
      println(pk + '=' + pv);
  })
}

function start() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(query, 1000);
    println('Start');
}

function stop() {
    clearInterval(timer);
    timer = null;
    println('Stop');
}

function empty() { document.getElementById("output").innerHTML = ''; }
function print(text) { document.getElementById("output").innerHTML += text; }
function println(text) { print(text + '<br>'); }
