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
class SlideShowElement extends HTMLElement {
  constructor() {
    super();
  }

  // Called when the element is first created
  // V1: this is done in the constructor
  createdCallback() {};

  // By moving initialization into its own method, we can trigger it for
  // both V0 and V1 codepaths
  upgrade() {
    this.upgraded = true;

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
    this.index_ = this.getAttribute("index") * 1;
    this.length = 0;
    this.dom = { content, root };
    this.scheduleRender();
    this.dispatchEvent(new CustomEvent("slides-ready", {
      detail: {
        index: this.index_,
        length: this.length
      }
    }));
    
    // Listen for updates from children
    this.addEventListener("slide-content", e => this.scheduleRender());
    var watcher = new MutationObserver(() => this.scheduleRender());
    watcher.observe(this, { childList: true });
  }

  // When attributes change, update the slideshow to match
  // In V1, you must specify `observedAttributes` manually
  static get observedAttributes() {
    return ["index"]
  }

  attributeChangedCallback(prop, before, after) {
    switch (prop) {
      case "index":
        this.scheduleRender(after);
        break;
        
      // TODO: other attributes go here
    }
  }

  // V1: this is "connectedCallback" instead
  // This is used in a more interesting way in slide-elements.js
  attachedCallback() {
    if (!this.upgraded) this.upgrade();
  }

  connectedCallback() {
    if (!this.upgraded) this.upgrade();
  }

  // Lots of things may trigger render, but defer it to a single update on the next frame
  scheduleRender(index) {
    if (typeof index != "undefined") this.index_ = index * 1;
    if (this.waitingToRender) return;
    this.waitingToRender = true;
    window.requestAnimationFrame(() => this.render());
  }

  render() {
    this.waitingToRender = false;
    // Find all slide children
    var items = this.querySelectorAll("text-slide,code-slide");
    // Update our internal state a bit
    this.length = items.length;
    if (this.index_ > items.length - 1) this.index_ = items.length - 1;
    if (this.index_ < 0) this.index_ = 0;
    // get the current slide
    var selected = items[this.index_];
    if (!selected) return;
    // Load the slide's contents from participating elements
    var slide = selected.parsedContent || {}
    // Fill the content div with our new slide text
    var content = this.dom.content;
    content.innerHTML = `<h1>${slide.headline}</h1> ${slide.body}`;
    content.firstElementChild.focus();
    // Let listeners know that we've changed slides
    this.dispatchEvent(new CustomEvent("slides-changed", {
      detail: {
        index: this.index_,
        length: items.length
      }
    }));
  }

  //boring convenience methods
  getSlide() {
    return this.index_;
  }

  //proxy index so that we can schedule render when it changes
  get index() {
    return this.index_;
  }
  set index(i) {
    this.index_ = i;
    this.scheduleRender(i);
  }

  shiftSlide(delta) {
    this.scheduleRender(this.index_ + delta);
  }

  nextSlide() {
    this.shiftSlide(1);
  }

  previousSlide() {
    this.shiftSlide(-1);
  }
}

// And now, the final registration:
document.registerElement("slide-show", { prototype: SlideShowElement.prototype });
// V1 version:
// window.customElements.define("slide-show", SlideShowElement);
