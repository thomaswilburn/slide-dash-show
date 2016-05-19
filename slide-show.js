// Introducing: <slide-show> (and its partner, <text-slide>)!

// Throughout this text, "V1" refers to the new customElements interface:
// https://w3c.github.io/webcomponents/spec/custom/

// First, as a warm-up, we'll make text-slide work:

var textSlideProto = Object.create(HTMLElement.prototype);
// In V1 and ES6, this line is way easier: 
// class TextSlideElement extends HTMLElement { ...

// Parse the world's worst structured text format
textSlideProto.parseContents = function() {
  var lines = this.innerHTML.trim().split("\n");
  // First line is a headline
  var headline = lines.shift();
  var body = lines.map(function(line) {
    line = line.trim();
    // Blank lines become paragraphs
    if (!line) return "<p>";
    // Terrible bold/preformatted support
    return line.replace(/\*(.*?)\*/g, "<b>$1</b>") + "<br>";
  }).join("\n");
  return { headline, body }; 
};

// Register the element
document.registerElement("text-slide", { prototype: textSlideProto });
// V1 version:
// window.customElements.define("text-slide", TextSlideElement);

// Let's also make a code-slide, which will be very similar
var codeSlideProto = Object.create(HTMLElement.prototype);
codeSlideProto.parseContents = function() {
  var lines = this.innerHTML.trim().split("\n");
  var headline = lines.shift();
  var minLeading = Math.min.apply(null, lines.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
  var replacer = new RegExp(`^\\s{${minLeading}}`);
  var body = lines.map(l => l.replace(replacer, "")).join("\n").trim();
  body = "<pre><code>" + body + "</code></pre>";
  return { headline, body }
};
document.registerElement("code-slide", { prototype: codeSlideProto });

// Now for the slide-show itself, which will use more advanced features:

// Styles for the slide-show element's children (which we will generate)
var stylesheet = `
  .content {
    font-family: Roboto, sans-serif;
    font-size: 36px;
    text-align: center;
  }
  
  .content h1 {
    margin: 0 0 16px;
    font-size: 150%;
  }
  
  .content p {
    margin: 16px auto;
    max-width: 1000px;
  }
  
  .content b {
    color: #808;
  }
  
  .content img {
    max-width: 80%;
    max-height: 80%;
  }
  
  .content a {
    color: black;
    font-weight: bold;
  }
  
  .content a:visited {
    color: #333;
  }
  
  .content pre {
    font-size: 50%;
    border: 1px solid #eee;
    border-radius: 4px;
    text-align: left;
    padding: 20px;
    box-shadow: inset 4px 4px 16px rgba(255, 255, 255, .1);
    background: #333;
    color: #eee
  }
  `;

// Create its prototype
var slideShowProto = Object.create(HTMLDivElement.prototype);

// Called when the element is first created
// V1: this is done in the constructor
slideShowProto.createdCallback = function() {
  
  // If we have Shadow DOM, let's make a root to put our generated HTML
  // Note: createShadowRoot() is becoming attachShadow()
  var root = this.createShadowRoot ? this.createShadowRoot() : this;
  
  // Add styles (scoped, similar to iframe, if Shadow DOM is supported)
  var style = document.createElement("style");
  style.innerHTML = stylesheet;
  root.appendChild(style);
  
  // Add a div to be the visible slide
  var content = document.createElement("div");
  content.className = "content";
  root.appendChild(content);
  
  // Create an observer to watch the <text-slide> children
  var observer = new MutationObserver((mutations) => {
    this.setSlide(this.state.current);
  });
  
  // Let's make some state available and start up
  this.state = { current: 0, length: 0, content, observer };
  this.setSlide(0);
  this.dispatchEvent(new CustomEvent("slides-ready", { detail: { index: this.state.current, length: this.state.length }}));
  
  // Trigger attribute changes after construction
  // In V1, they may not be available in the constructor,
  // so this makes our code a bit more future-proof
  for (var i = 0; i < this.attributes.length; i++) {
    var attr = this.attributes[i];
    this.attributeChangedCallback(attr.name, null, attr.value);
  }
};

// When attributes change, update the slideshow to match
// In V1, you must specify `observedAttributes` manually
slideShowProto.attributeChangedCallback = function(prop, before, after) {
  switch (prop) {
    case "index":
      this.setSlide(after);
      break;
      
    // TODO: other attributes go here
  }
};

// V1: this is "connectedCallback" instead
slideShowProto.attachedCallback = function() {
  // Hook up our observer whenever we're in the document
  this.state.observer.observe(this, {
    // subtree: true, //sadly, crashes Firefox with the polyfill
    childList: true,
    characterData: true
  });
  this.setSlide(this.state.current);
};

// V1: this becomes "disconnectedCallback"
slideShowProto.detachedCallback = function() {
  // Don't watch for changes when not connected
  this.state.observer.disconnect();
};

// These methods are available on the element itself
slideShowProto.setSlide = function(index) {
  index *= 1;
  // Find all slide children, and grab the current slide
  var items = this.querySelectorAll("text-slide, code-slide");
  var selected = items[index];
  if (!selected || !selected.parseContents) return;
  // Update our internal state
  this.state.current = index;
  this.state.length = items.length;
  // Load the slide's contents
  var slide = selected.parseContents();
  // Fill the content div with our new slide contents
  this.state.content.innerHTML = `<h1>${slide.headline}</h1> ${slide.body}`;
  // Let listeners know that we've changed slides
  this.dispatchEvent(new CustomEvent("slides-changed", {
    detail: {
      index: this.state.current,
      length: items.length
    }
  }));
};

//boring convenience methods
slideShowProto.getSlide = function() {
  return this.state.current;
};

slideShowProto.shiftSlide = function(delta) {
  this.setSlide(this.state.current + delta);
};

slideShowProto.nextSlide = function() {
  this.shiftSlide(1);
};

slideShowProto.previousSlide = function() {
  this.shiftSlide(-1);
};

// If using the webcomponents.js polyfill, force *-slide upgrades before installing slide-show
if (window.CustomElements && CustomElements.upgradeDocument) CustomElements.upgradeDocument(document);

// And now, the final registration:
document.registerElement("slide-show", { prototype: slideShowProto });