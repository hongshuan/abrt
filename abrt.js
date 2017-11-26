var timer;

document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
document.getElementById("clear").addEventListener("click", empty);

function query() {
  var url = "http://www.play.dev/ttt.php";

  fetch(url, {
      method: "POST",
      body: new FormData(document.getElementById("form")),
  })
  .then(function(response) {
      return response.json();
  })
  .then(function(json) {
      //println(text)

      var u = json.username;
      var p = json.password;

      println('usernmae' + '=' + u);
      println('password' + '=' + p);
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
    beep();
    clearInterval(timer);
    timer = null;
    println('Stop');
}

function empty() { document.getElementById("output").innerHTML = ''; }
function print(text) { document.getElementById("output").innerHTML += text; }
function println(text) { print(text + '<br>'); }
function beep() { playSound('beep.wav'); }
function sound() { playSound('NokiaEpic.mp3'); }
function playSound(file) { var audio = new Audio('webres/' + file); audio.play(); }
