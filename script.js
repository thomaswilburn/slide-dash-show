// Important notes:
// 1. <slide-show> uses events and properties for all communication
// 2. Elements should be do one thing well
// 3. Parents shouldn't assume that children exist or are upgraded, and vice versa
// 4. Code can be written to support V0 and V1 specs

var $ = s => Array.prototype.slice.call(document.querySelectorAll(s));

var slideshow = document.querySelector("slide-show");
var bar = document.querySelector(".progress-bar .bar");

document.body.addEventListener("keydown", function(e) {
  switch (e.keyCode) {
    case 32:
    case 39:
    case 40:
      slideshow.nextSlide();
      break;
      
    case 37:
    case 38:
      slideshow.previousSlide();
      break;
  }
});

var hash = window.location.hash.replace("#", "");
if (hash) slideshow.setAttribute("index", hash);

var setBar = function(index, length) {
  var width = index / (length - 1);
  bar.style.width = width * 100 + "%";
};

slideshow.addEventListener("slides-ready", e => setBar(e.detail.index, e.detail.length));

slideshow.addEventListener("slides-changed", function(e) {
  history.replaceState(null, null, "#" + e.detail.index);
  setBar(e.detail.index, e.detail.length);
});

var clickedButton = function(e) {
  if (e.target.classList.contains("next-slide")) {
    slideshow.nextSlide();
  } else {
    slideshow.previousSlide();
  }
}

$("a.control").forEach(el => el.addEventListener("click", clickedButton));