# ChaiTailwind

A lightweight utility-first CSS engine built with vanilla JavaScript.

Instead of writing CSS, you write class names like `chai-p-20` or `chai-bg-red` directly on your HTML elements. A small JavaScript engine scans the DOM, parses those class names, and applies inline styles automatically.

---

## How to Use

1. Include `script.js` in your HTML page.
2. Add `chai-*` classes to any element.
3. That's it — styles are applied on page load.

```html
<!-- script.js handles all the styling -->
<script src="script.js"></script>

<div class="chai-bg-royalblue chai-text-white chai-p-20 chai-rounded-8">
  Hello, ChaiTailwind!
</div>
```

---

## Available Classes

### Spacing

| Class | CSS |
|---|---|
| `chai-p-{n}` | `padding: {n}px` |
| `chai-pt-{n}` | `padding-top: {n}px` |
| `chai-pr-{n}` | `padding-right: {n}px` |
| `chai-pb-{n}` | `padding-bottom: {n}px` |
| `chai-pl-{n}` | `padding-left: {n}px` |
| `chai-p-{a}-{b}` | `padding: {a}px {b}px` (shorthand) |
| `chai-m-{n}` | `margin: {n}px` |
| `chai-mt-{n}` | `margin-top: {n}px` |
| `chai-mr-{n}` | `margin-right: {n}px` |
| `chai-mb-{n}` | `margin-bottom: {n}px` |
| `chai-ml-{n}` | `margin-left: {n}px` |

### Colors

| Class | CSS |
|---|---|
| `chai-bg-{color}` | `background-color: {color}` |
| `chai-text-{color}` | `color: {color}` |

Any CSS named color works: `red`, `tomato`, `royalblue`, `gold`, `seagreen`, etc.

### Typography

| Class | CSS |
|---|---|
| `chai-fs-{n}` | `font-size: {n}px` |
| `chai-text-left` | `text-align: left` |
| `chai-text-center` | `text-align: center` |
| `chai-text-right` | `text-align: right` |

> **Note:** `chai-text-red` sets the color, but `chai-text-center` sets text-align. The parser checks if the value is `left`, `center`, or `right` before treating it as a color.

### Size

| Class | CSS |
|---|---|
| `chai-w-{n}` | `width: {n}px` |
| `chai-h-{n}` | `height: {n}px` |

### Borders

| Class | CSS |
|---|---|
| `chai-bw-{n}` | `border-width: {n}px` |
| `chai-border-solid` | `border-style: solid` |
| `chai-border-dashed` | `border-style: dashed` |
| `chai-border-dotted` | `border-style: dotted` |
| `chai-rounded-{n}` | `border-radius: {n}px` |

---

## How It Works

### 1. Scan

On page load, `querySelectorAll('*')` finds every element. We filter its classes for anything starting with `chai-`.

### 2. Parse

Each `chai-*` class is split on `-`:

```
"chai-p-20"  →  ["chai", "p", "20"]
               prefix = "p"
               value  = "20"
```

The prefix is looked up in a config map:

```js
const config = {
  'p':  'padding',
  'bg': 'backgroundColor',
  'fs': 'fontSize',
  // ...
};
```

Numbers get `px` appended. Strings (color names) are used as-is.

### 3. Apply

```js
element.style.padding = "20px";
// or, for the parsed result object:
Object.assign(element.style, { padding: "20px" });
```

### 4. Watch (MutationObserver)

A `MutationObserver` watches `document.body` for new nodes. When JavaScript adds an element dynamically, the observer fires and applies styles automatically — no extra code needed.

```js
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        applyStyles(node);
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
```

---

## Project Structure

```
tailwind-clone/
├── index.html   ← demo page
├── script.js    ← the ChaiTailwind engine
└── README.md    ← this file
```
