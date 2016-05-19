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