# FlexWind (ChaiTailwind Demo)

A lightweight utility-class styling engine shown in `index.html`, powered by `script.js`.

## What this project does

- Reads classes like `chai-bg-primary`, `chai-p-20`, `chai-rounded-10`
- Converts them into inline styles at runtime
- Supports hover utilities like `chai-hover-bg-dark`
- Watches DOM changes and applies styles to newly added elements

## Files

- `index.html`  
  Live playground UI with:
  - input box (`#chaiInput`) to type utility classes
  - preview box (`#previewBox`) to test classes instantly
  - sample utility syntax list

- `script.js`  
  Core engine logic:
  1. Utility-to-CSS property map (`CHAI_MAP`)
  2. Theme color tokens (`CHAI_THEME`)
  3. Class parser (`parseChaiClass`)
  4. Style applier (`applyChaiStyles`)
  5. Initial scan on page load (`initChaiEngine`)
  6. `MutationObserver` for dynamic DOM/class updates (`startChaiObserver`)

## Supported utility prefixes

- `chai-p-*` → `padding`
- `chai-m-*` → `margin`
- `chai-bg-*` → `background-color`
- `chai-text-*` → `color`
- `chai-fs-*` → `font-size`
- `chai-rounded-*` → `border-radius`
- `chai-w-*` → `width`
- `chai-h-*` → `height`
- `chai-bw-*` → `border-width`

## Theme values

- `primary` → `#3b82f6`
- `secondary` → `#10b981`
- `danger` → `#ef4444`
- `dark` → `#1f2937`
- `white` → `#ffffff`

## Example classes

- `chai-bg-danger chai-text-white chai-p-20 chai-rounded-10`
- `chai-bg-secondary chai-w-200 chai-h-100`
- `chai-bg-primary chai-hover-bg-dark chai-p-15`

## Run

Open `index.html` in a browser and type classes into the input field to preview styles in real time.