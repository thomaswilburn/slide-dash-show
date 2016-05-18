//Introducing: <slide-show>!

// Throughout this text, "V1" refers to the new customElements interface:
// https://w3c.github.io/webcomponents/spec/custom/

// Styles for the element's children
var stylesheet = `
  text-slide { display: none }
  
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
  }`;

var proto = Object.create(HTMLDivElement.prototype);
// In V1 and ES6, this line is way easier: 
// class SlideShowElement extends HTMLElement { ...

// Called when the element is first created
// V1: this is done in the constructor
proto.createdCallback = function() {
  // If we have Shadow DOM, let's make a root to put our generated HTML
  // Note: createShadowRoot() is becoming attachShadow()
  var root = this.createShadowRoot ? this.createShadowRoot() : this;
  
  // Add styles
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
  this.state = { current: 0, content, observer };
  this.setSlide(0);
  this.dispatchEvent(new CustomEvent("slides-ready"));
  
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
proto.attributeChangedCallback = function(prop, before, after) {
  switch (prop) {
    case "index":
      this.setSlide(after);
      break;
      
    // TODO: other attributes go here
  }
};

// V1: this is "connectedCallback" instead
proto.attachedCallback = function() {
  // Hook up our observer whenever we're in the document
  this.state.observer.observe(this, { subtree: true, childList: true, characterData: true });
  this.setSlide(this.state.current);
};

// V1: this becomes "disconnectedCallback"
proto.detachedCallback = function() {
  // Don't watch for changes when not connected
  this.state.observer.disconnect();
};

// These methods are available on the element itself
proto.setSlide = function(index) {
  index *= 1;
  // Find all <text-slide> children, and grab the current slide
  var items = this.querySelectorAll("text-slide");
  var selected = items[index];
  if (!selected) return;
  // Update our internal state
  this.state.current = index;
  // Load and transform <text-slide>'s contents
  var slide = parseSlideText(selected.innerHTML);
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
proto.getSlide = function() {
  return this.state.current;
};

proto.shiftSlide = function(delta) {
  this.setSlide(this.state.current + delta);
};

proto.nextSlide = function() {
  this.shiftSlide(1);
};

proto.previousSlide = function() {
  this.shiftSlide(-1);
};

// This is the world's worst structured text format
var parseSlideText = function(contents) {
  contents = contents.trim().split("\n");
  // First line is a headline
  var headline = contents.shift();
  var body = contents.map(function(line) {
    line = line.trim();
    // Blank lines become paragraphs
    if (!line) return "<p>";
    // Terrible bold/preformatted support
    return line.replace(/\*(.*?)\*/g, "<b>$1</b>") + "<br>";
  }).join("\n");
  return { headline, body }; 
};

document.registerElement("slide-show", { prototype: proto });
// V1 version:
// window.customElements.define("slide-show", SlideShowElement);