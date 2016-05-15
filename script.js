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

slideshow.addEventListener("slides-changed", function(e) {
  window.location.hash = e.detail.index;
  var width = e.detail.index / (e.detail.length - 1);
  bar.style.width = width * 100 + "%";
});