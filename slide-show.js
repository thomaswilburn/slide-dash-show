// Introducing: <slide-show>!

// Throughout this text, "V1" refers to the new customElements interface:
// https://w3c.github.io/webcomponents/spec/custom/

// Styles for the slide-show element's children (which we will generate)
// We're going to put this here, because if Shadow DOM is supported, the
// styles will be isolated from the rest of the page
var stylesheet = `
  .content {
    font-family: Roboto, sans-serif;
    font-size: 36px;
    text-align: center;
    color: #242824;
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
    max-width: 80vw;
    max-height: 80vh;
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
    color: #eee;
    display: inline-block;
    line-height: 1.5;
  }
  `;

// create the element constructor
// This is only called directly in V1
// V1 also recommends `class SlideShowElement extends HTMLElement`
var SlideShowElement = function() {
  this.upgrade();
}

// Create its prototype
var slideShowProto = SlideShowElement.prototype = Object.create(HTMLElement.prototype);

// Called when the element is first created
// V1: this is done in the constructor
slideShowProto.createdCallback = function() {
  this.upgrade();
};

// By moving initialization into its own method, we can trigger it for
// both V0 and V1 codepaths
slideShowProto.upgrade = function() {

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
  content.setAttribute("aria-live", "assertive");
  content.setAttribute("aria-atomic", true);
  content.setAttribute("aria-relevant", "text");
  root.appendChild(content);
  
  // deferred rendering
  this.waitingToRender = null;
  
  // Let's make some state available and start up
  this.state = { current: this.getAttribute("index") * 1, length: 0, content, root };
  this.scheduleRender();
  this.dispatchEvent(new CustomEvent("slides-ready", {
    detail: {
      index: this.state.current,
      length: this.state.length
    }
  }));
  
  // Trigger attribute changes after construction
  // In V1, they may not be available in the constructor,
  // so this makes our code a bit more future-proof
  for (var i = 0; i < this.attributes.length; i++) {
    var attr = this.attributes[i];
    this.attributeChangedCallback(attr.name, null, attr.value);
  }
  
  // Listen for updates from children
  this.addEventListener("slide-content", e => this.scheduleRender());
  var watcher = new MutationObserver(() => this.scheduleRender());
  watcher.observe(this, { childList: true });
};

// When attributes change, update the slideshow to match
// In V1, you must specify `observedAttributes` manually
slideShowProto.attributeChangedCallback = function(prop, before, after) {
  switch (prop) {
    case "index":
      this.scheduleRender(after);
      break;
      
    // TODO: other attributes go here
  }
};

// V1: this is "connectedCallback" instead
// This is used in a more interesting way in slide-elements.js
slideShowProto.attachedCallback = slideShowProto.connectedCallback = function() {};

// V1: this becomes "disconnectedCallback"
slideShowProto.detachedCallback = slideShowProto.disconnectedCallback = function() {};

// Lots of things may trigger render, but defer it to a single update on the next frame
slideShowProto.scheduleRender = function(index) {
  if (typeof index != "undefined") this.state.current = index * 1;
  if (this.waitingToRender) return;
  this.waitingToRender = true;
  window.requestAnimationFrame(() => this.render());
}

slideShowProto.render = function() {
  this.waitingToRender = false;
  // Find all slide children
  var items = this.querySelectorAll("text-slide,code-slide");
  // Update our internal state a bit
  this.state.length = items.length;
  if (this.state.current > items.length - 1) this.state.current = items.length - 1;
  if (this.state.current < 0) this.state.current = 0;
  // get the current slide
  var selected = items[this.state.current];
  if (!selected) return;
  // Load the slide's contents from participating elements
  var slide = selected.parsedContent || {}
  // Fill the content div with our new slide text
  var content = this.state.content;
  content.innerHTML = `<h1>${slide.headline}</h1> ${slide.body}`;
  content.firstElementChild.focus();
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
  this.scheduleRender(this.state.current + delta);
};

slideShowProto.nextSlide = function() {
  this.shiftSlide(1);
};

slideShowProto.previousSlide = function() {
  this.shiftSlide(-1);
};

// And now, the final registration:
document.registerElement("slide-show", { prototype: slideShowProto });
// V1 version:
// window.customElements.define("slide-show", SlideShowElement);
