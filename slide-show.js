var proto = Object.create(HTMLDivElement.prototype);

//Called when the element is first created
//In V1, this is done in the constructor
proto.createdCallback = function() {
  var root = this.createShadowRoot ? this.createShadowRoot() : this;
  var guid = Date.now() + Math.round(Math.random() * 10000);
  
  //create some scoped styles
  var styles = createStyles(guid);
  var stylesheet = document.createElement("style");
  stylesheet.innerHTML = styles;
  root.appendChild(stylesheet);
  
  //add a content div to contain the current item
  var content = document.createElement("div");
  content.className = `content unique-${guid}`;
  root.appendChild(content);
  
  //watch for updates on the element children
  var observer = new MutationObserver((mutations) => {
    this.setSlide(this.state.current);
  });
  
  //let's make some state available
  this.state = { current: this.getAttribute("index") || 0, content, observer };
  this.setSlide(this.state.current);
  this.dispatchEvent(new CustomEvent("slides-ready"));
};

//let us set the slide from attributes
proto.attributeChangedCallback = function(prop, before, after) {
  switch (prop) {
    case "index":
      this.setSlide(after);
      break;
  }
};

//We're not going to use these here, but they're handy for event listeners
proto.attachedCallback = function() {
  this.state.observer.observe(this, { subtree: true, childList: true, characterData: true });
  this.setSlide(this.state.current);
};
proto.detachedCallback = function() {
  //don't watch for changes when not connected
  this.state.observer.disconnect();
};

proto.setSlide = function(index) {
  index *= 1;
  var items = this.querySelectorAll("text-slide");
  var selected = items[index];
  if (!selected) return;
  this.state.current = index;
  //And now, the world's worst text parser
  var contents = selected.innerHTML.trim().split("\n");
  var headline = contents.shift();
  contents = contents.map(function(line) {
    line = line.trim();
    if (line == "") {
      return "<p>";
    }
    line += "<br>";
    return line.replace(/\*(.*?)\*/g, "<b>$1</b>");
  });
  this.state.content.innerHTML = `
    <h1>${headline}</h1>
    ${contents.join("\n")}
  `;
  this.dispatchEvent(new CustomEvent("slides-changed", {
    detail: {
      index: this.state.current,
      length: items.length
    }
  }));
};

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

var createStyles = function(guid) {
  return `
  //hide these if the shadow root doesn't exist
  text-slide { display: none }
  
  .content.unique-${guid} {
    font-family: Roboto, sans-serif;
    font-size: 36px;
    text-align: center;
  }
  
  .content.unique-${guid} h1 {
    margin: 0 0 16px;
    font-size: 150%;
  }
  
  .content.unique-${guid} p {
    margin: 16px auto;
    max-width: 1000px;
  }
  
  .content.unique-${guid} b {
    color: #808;
  }
  
  .content.unique-${guid} img {
    max-width: 80%;
    max-height: 80%;
  }
  
  .content.unique-${guid} a {
    color: black;
    font-weight: bold;
  }
  
  .content.unique-${guid} a:visited {
    color: #333;
  }
  `;
};

document.registerElement("slide-show", { prototype: proto });