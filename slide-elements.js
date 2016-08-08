// In addition to the slide-show, we have two child elements
// Each one controls its own parsing, and notifies the slide-show of updates via events

// text-slide is the base element. code-slide just changes the parser.
var textProto = Object.create(HTMLElement.prototype);
var codeProto = Object.create(textProto);

class TextSlideElement extends HTMLElement {

  constructor() {
    super();
    this.connectedCallback = this.attachedCallback;
    this.disconnectedCallback = this.detachedCallback;
  }

  notifyParent() {
    var e = new CustomEvent("slide-content", { bubbles: true });
    this.parseSlide();
    this.dispatchEvent(e);
  };

  attachedCallback() {
    if (!this.observer_) {
      this.observer_ = new MutationObserver(() => this.notifyParent());
    }
    this.observer_.observe(this, { characterData: true, childList: true, subtree: true });
    this.notifyParent();
  }

  detachedCallback() {
    if (this.observer_) {
      this.observer_.disconnect();
    }
  }

  parseSlide() {
    var html = this.innerHTML;
    var lines = html.trim().split("\n");
    // First line is a headline
    var headline = lines.shift().replace(/\*(.*?)\*/g, "<b>$1</b>");
    var body = lines.map(function(line) {
      line = line.trim();
      // Blank lines become paragraphs
      if (!line) return "<p>";
      // Terrible bold/preformatted support
      return line.replace(/\*(.*?)\*/g, "<b>$1</b>") + "<br>";
    }).join("\n");
    this.parsedContent = { headline, body };
    return { headline, body };
  }
};

class CodeSlideElement extends TextSlideElement {
  constructor() {
    super();
  }

  parseSlide() {
    var html = this.innerHTML;
    var lines = html.trim().split("\n");
    var headline = lines.shift();
    var minLeading = Math.min.apply(null, lines.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
    var replacer = new RegExp(`^\\s{${minLeading}}`);
    var body = lines.map(l => l.replace(replacer, "")).join("\n").trim();
    body = "<pre><code>" + body + "</code></pre>";
    this.parsedContent = { headline, body };
    return { headline, body }
  }
};

document.registerElement("text-slide", { prototype: TextSlideElement.prototype });
document.registerElement("code-slide", { prototype: CodeSlideElement.prototype });