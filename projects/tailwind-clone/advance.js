/**
 * ☕ ChaiTailwind Engine v1.0
 *
 * A lightweight utility-first CSS engine written in vanilla JavaScript.
 *
 * CORE CONCEPT:
 *   Instead of writing CSS, you write class names like "chai-p-20" or "chai-bg-red".
 *   This engine scans the DOM, parses those class names, and applies inline styles.
 *
 * CLASS SYNTAX:
 *   chai-{prefix}-{value}       e.g.  chai-p-20      → padding: 20px
 *   chai-{prefix}-{v1}-{v2}     e.g.  chai-p-10-20   → padding: 10px 20px
 *   chai-{keyword}              e.g.  chai-flex       → display: flex
 *
 * HOW IT WORKS (the three phases):
 *   1. SCAN   — querySelectorAll('*') finds every element on the page
 *   2. PARSE  — for each element, extract chai- classes and convert them to { property: value }
 *   3. APPLY  — Object.assign(element.style, styles) to set inline styles
 *   4. WATCH  — MutationObserver re-runs steps 2-3 whenever new nodes are added
 */

const ChaiTailwind = (() => {

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — DYNAMIC MAP
  //
  // Maps a shorthand PREFIX → CSS property name.
  //
  // When we see "chai-p-20":
  //   parts  = ["chai", "p", "20"]
  //   prefix = "p"
  //   value  = "20" → becomes "20px" (numbers get px)
  //   lookup: DYNAMIC_MAP["p"] → "padding"
  //   result: element.style.padding = "20px"
  //
  // When we see "chai-bg-royalblue":
  //   prefix = "bg"
  //   value  = "royalblue" → stays as-is (not numeric)
  //   lookup: DYNAMIC_MAP["bg"] → "backgroundColor"
  //   result: element.style.backgroundColor = "royalblue"
  // ═══════════════════════════════════════════════════════════════════════════

  const DYNAMIC_MAP = {
    // Padding — chai-p-20 / chai-pt-10 / chai-p-10-20 (shorthand)
    'p':  'padding',
    'pt': 'paddingTop',
    'pr': 'paddingRight',
    'pb': 'paddingBottom',
    'pl': 'paddingLeft',
    // px/py are "axis" shorthands — handled separately (see AXIS CASES below)
    // chai-px-20 → paddingLeft: 20px AND paddingRight: 20px

    // Margin — same pattern as padding
    'm':  'margin',
    'mt': 'marginTop',
    'mr': 'marginRight',
    'mb': 'marginBottom',
    'ml': 'marginLeft',
    // mx/my handled separately

    // Colors — values are CSS color names, NOT numbers, so no px is added
    'bg': 'backgroundColor',  // chai-bg-tomato → backgroundColor: tomato
    'bc': 'borderColor',       // chai-bc-gray   → borderColor: gray
    // NOTE: 'text' is handled specially — it can mean color OR textAlign

    // Typography
    'fs': 'fontSize',          // chai-fs-24 → fontSize: 24px
    'fw': 'fontWeight',        // chai-fw-700 → fontWeight: 700  (NO px!)
    'ls': 'letterSpacing',     // chai-ls-2 → letterSpacing: 2px

    // Sizing
    'w':  'width',             // chai-w-200 → width: 200px
    'h':  'height',            // chai-h-100 → height: 100px

    // Borders
    'rounded': 'borderRadius', // chai-rounded-12 → borderRadius: 12px
    'bw':      'borderWidth',  // chai-bw-2 → borderWidth: 2px
    'border':  'borderStyle',  // chai-border-solid → borderStyle: solid

    // Positioning (for absolute/relative elements)
    'top':    'top',
    'right':  'right',
    'bottom': 'bottom',
    'left':   'left',

    // Layout
    'gap': 'gap',              // chai-gap-16 → gap: 16px (for flex/grid)

    // Misc
    'z':       'zIndex',       // chai-z-10 → zIndex: 10   (NO px!)
    'opacity': 'opacity',      // handled specially: chai-opacity-50 → opacity: 0.5
  };

  // These CSS properties take plain numbers — do NOT append 'px'
  const NO_UNIT_PROPS = new Set(['fontWeight', 'zIndex', 'flex', 'opacity']);

  // These words, when used with "chai-text-*", mean text-align, not color
  const TEXT_ALIGN_VALS = new Set(['left', 'center', 'right', 'justify']);


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — FIXED MAP
  //
  // Some classes CANNOT be parsed dynamically because:
  //   a) Their CSS values contain hyphens  →  "space-between"
  //   b) They map directly to a keyword   →  chai-flex → display: flex
  //   c) They set MULTIPLE properties     →  chai-mx-auto → marginLeft + marginRight
  //
  // Strategy: exact string match before we even try to parse.
  //
  // Example problem without FIXED_MAP:
  //   "chai-justify-between" splits to prefix="justify", value=["between"]
  //   "justify" is not in DYNAMIC_MAP — it would silently fail.
  //   FIXED_MAP catches it: "chai-justify-between" → { justifyContent: "space-between" }
  // ═══════════════════════════════════════════════════════════════════════════

  const FIXED_MAP = {

    // ── Display ──────────────────────────────────────────────────────────────
    'chai-flex':         { display: 'flex' },
    'chai-block':        { display: 'block' },
    'chai-inline':       { display: 'inline' },
    'chai-inline-block': { display: 'inline-block' },
    'chai-hidden':       { display: 'none' },

    // ── Flex ─────────────────────────────────────────────────────────────────
    'chai-flex-row':     { flexDirection: 'row' },
    'chai-flex-col':     { flexDirection: 'column' },
    'chai-flex-wrap':    { flexWrap: 'wrap' },
    'chai-flex-nowrap':  { flexWrap: 'nowrap' },
    'chai-flex-1':       { flex: '1' },

    // ── Align Items ──────────────────────────────────────────────────────────
    'chai-items-start':   { alignItems: 'flex-start' },
    'chai-items-center':  { alignItems: 'center' },
    'chai-items-end':     { alignItems: 'flex-end' },
    'chai-items-stretch': { alignItems: 'stretch' },

    // ── Justify Content ───────────────────────────────────────────────────────
    // These MUST be in FIXED_MAP — "space-between" and "space-around" have hyphens!
    'chai-justify-start':   { justifyContent: 'flex-start' },
    'chai-justify-center':  { justifyContent: 'center' },
    'chai-justify-end':     { justifyContent: 'flex-end' },
    'chai-justify-between': { justifyContent: 'space-between' },
    'chai-justify-around':  { justifyContent: 'space-around' },
    'chai-justify-evenly':  { justifyContent: 'space-evenly' },

    // ── Text Align ────────────────────────────────────────────────────────────
    // Also handled in parseClass() for chai-text-* below,
    // but explicit entries here make them faster to look up.
    'chai-text-left':    { textAlign: 'left' },
    'chai-text-center':  { textAlign: 'center' },
    'chai-text-right':   { textAlign: 'right' },
    'chai-text-justify': { textAlign: 'justify' },

    // ── Font ──────────────────────────────────────────────────────────────────
    'chai-bold':           { fontWeight: 'bold' },
    'chai-italic':         { fontStyle: 'italic' },
    'chai-underline':      { textDecoration: 'underline' },
    'chai-line-through':   { textDecoration: 'line-through' },
    'chai-uppercase':      { textTransform: 'uppercase' },
    'chai-lowercase':      { textTransform: 'lowercase' },
    'chai-capitalize':     { textTransform: 'capitalize' },

    // Named font weights (alternative to chai-fw-700)
    'chai-font-thin':      { fontWeight: '100' },
    'chai-font-light':     { fontWeight: '300' },
    'chai-font-normal':    { fontWeight: '400' },
    'chai-font-medium':    { fontWeight: '500' },
    'chai-font-semibold':  { fontWeight: '600' },
    'chai-font-bold':      { fontWeight: '700' },
    'chai-font-extrabold': { fontWeight: '800' },

    // ── Positioning ───────────────────────────────────────────────────────────
    'chai-relative': { position: 'relative' },
    'chai-absolute': { position: 'absolute' },
    'chai-fixed':    { position: 'fixed' },
    'chai-sticky':   { position: 'sticky' },

    // ── Size Shortcuts ────────────────────────────────────────────────────────
    'chai-w-full':   { width: '100%' },
    'chai-h-full':   { height: '100%' },
    'chai-w-screen': { width: '100vw' },
    'chai-h-screen': { height: '100vh' },

    // ── Margin Shortcuts (special values) ─────────────────────────────────────
    'chai-m-auto':  { margin: 'auto' },
    'chai-mx-auto': { marginLeft: 'auto', marginRight: 'auto' },

    // ── Border Shortcuts ──────────────────────────────────────────────────────
    'chai-rounded-full': { borderRadius: '9999px' },
    'chai-rounded-none': { borderRadius: '0' },

    // ── Shadows ───────────────────────────────────────────────────────────────
    'chai-shadow':      { boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' },
    'chai-shadow-md':   { boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)' },
    'chai-shadow-lg':   { boxShadow: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)' },
    'chai-shadow-xl':   { boxShadow: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)' },
    'chai-shadow-none': { boxShadow: 'none' },

    // ── Misc ──────────────────────────────────────────────────────────────────
    'chai-cursor-pointer':     { cursor: 'pointer' },
    'chai-cursor-default':     { cursor: 'default' },
    'chai-cursor-not-allowed': { cursor: 'not-allowed' },
    'chai-overflow-hidden':    { overflow: 'hidden' },
    'chai-overflow-scroll':    { overflow: 'scroll' },
    'chai-overflow-auto':      { overflow: 'auto' },
    'chai-select-none':        { userSelect: 'none' },
    'chai-pointer-none':       { pointerEvents: 'none' },
    'chai-transition':         { transition: 'all 0.3s ease' },
    'chai-no-outline':         { outline: 'none' },
    'chai-truncate':           { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — parseClass(cls)
  //
  // The BRAIN of ChaiTailwind. Converts a single class string into a style object.
  //
  //   parseClass("chai-p-20")           → { padding: "20px" }
  //   parseClass("chai-p-10-20")        → { padding: "10px 20px" }
  //   parseClass("chai-bg-royalblue")   → { backgroundColor: "royalblue" }
  //   parseClass("chai-text-center")    → { textAlign: "center" }
  //   parseClass("chai-text-red")       → { color: "red" }
  //   parseClass("chai-opacity-50")     → { opacity: 0.5 }
  //   parseClass("chai-flex")           → { display: "flex" }
  //   parseClass("chai-justify-between")→ { justifyContent: "space-between" }
  //   parseClass("chai-unknown-xyz")    → null  (silently ignored)
  // ═══════════════════════════════════════════════════════════════════════════

  const parseClass = (cls) => {

    // ── Step 1: Check FIXED_MAP first (fast exact match) ──────────────────
    if (FIXED_MAP[cls]) {
      return FIXED_MAP[cls]; // e.g. { display: 'flex' }
    }

    // ── Step 2: Split into parts ───────────────────────────────────────────
    // "chai-p-10-20" → ["chai", "p", "10", "20"]
    //  index:              0      1    2     3
    const parts = cls.split('-');
    const prefix    = parts[1];        // e.g. "p", "bg", "text"
    const rawValues = parts.slice(2);  // e.g. ["10", "20"] or ["royalblue"]

    if (!prefix || rawValues.length === 0) return null;

    // ── Special Case A: chai-text-* ───────────────────────────────────────
    // Problem: "text" could mean color OR textAlign.
    //   chai-text-red    → color (not in TEXT_ALIGN_VALS)
    //   chai-text-center → textAlign (IS in TEXT_ALIGN_VALS)
    if (prefix === 'text') {
      const val = rawValues.join('-'); // handle multi-word (shouldn't happen, but safe)
      return TEXT_ALIGN_VALS.has(val)
        ? { textAlign: val }
        : { color: val };
    }

    // ── Special Case B: Axis shorthands (px, py, mx, my) ─────────────────
    // Apply the SAME value to two sides at once.
    // chai-px-20 → paddingLeft: 20px  AND  paddingRight: 20px
    const num = rawValues.map(v => !isNaN(v) && v !== '' ? `${v}px` : v).join(' ');
    if (prefix === 'px') return { paddingLeft: num, paddingRight: num };
    if (prefix === 'py') return { paddingTop: num,  paddingBottom: num };
    if (prefix === 'mx') return { marginLeft: num,  marginRight: num };
    if (prefix === 'my') return { marginTop: num,   marginBottom: num };

    // ── Special Case C: opacity ───────────────────────────────────────────
    // CSS opacity is 0.0 – 1.0, but it's more intuitive to write chai-opacity-50
    // meaning "50% opacity" = 0.5. So if the value is > 1, we divide by 100.
    if (prefix === 'opacity') {
      const n = parseFloat(rawValues[0]);
      if (!isNaN(n)) return { opacity: n > 1 ? n / 100 : n };
    }

    // ── Default: Look up CSS property in DYNAMIC_MAP ──────────────────────
    const property = DYNAMIC_MAP[prefix];
    if (!property) return null; // unknown prefix — not a chai class we recognize

    // Convert values to CSS units.
    // Rule: numbers get 'px' appended UNLESS the property is in NO_UNIT_PROPS.
    //   chai-p-20   → "20px"   (padding takes px)
    //   chai-fw-700 → "700"    (font-weight is unitless, in NO_UNIT_PROPS)
    //   chai-bg-red → "red"    (not numeric, stays as string)
    const formattedValue = rawValues.map(v => {
      if (v === '') return '';
      if (!isNaN(v) && !NO_UNIT_PROPS.has(property)) return `${v}px`;
      return v;
    }).join(' ');

    if (!formattedValue.trim()) return null;

    // Use computed property name: { [property]: value }
    // e.g. property="padding" → { padding: "20px" }
    return { [property]: formattedValue };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — applyStyles(element)
  //
  // Given a single DOM element:
  //   1. Find all class names that start with "chai-"
  //   2. Parse each one with parseClass()
  //   3. Apply the resulting style(s) with Object.assign(element.style, ...)
  //
  // Why Object.assign?
  //   Because some classes (like chai-mx-auto) return MULTIPLE properties.
  //   Object.assign handles both single and multi-property results uniformly.
  // ═══════════════════════════════════════════════════════════════════════════

  const applyStyles = (element) => {
    if (!element.classList) return; // text nodes and comments have no classList

    const chaiClasses = Array.from(element.classList).filter(c => c.startsWith('chai-'));
    if (chaiClasses.length === 0) return; // fast exit if no chai classes

    chaiClasses.forEach(cls => {
      const styles = parseClass(cls);
      if (styles) {
        Object.assign(element.style, styles);
      }
    });
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — init()
  //
  // The entry point. Called once when the DOM is ready.
  //
  //   Phase 1 — Initial scan:
  //     querySelectorAll('*') returns EVERY element on the page.
  //     We run applyStyles on each one.
  //
  //   Phase 2 — Reactive watching (MutationObserver):
  //     The page doesn't stop after the initial load. JavaScript can add new
  //     elements at any time (button clicks, fetch responses, etc.).
  //     MutationObserver fires a callback whenever children are added to the DOM.
  //     We run applyStyles on each new element automatically.
  //
  //     Without this, dynamically created elements would have no styles.
  // ═══════════════════════════════════════════════════════════════════════════

  const init = () => {
    // Phase 1: style everything already in the DOM
    document.querySelectorAll('*').forEach(applyStyles);

    // Phase 2: watch for future DOM additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // nodeType 1 = Element node (not text node or comment)
          if (node.nodeType === 1) {
            applyStyles(node);
            // Also style any children that were added inside this node
            node.querySelectorAll('*').forEach(applyStyles);
          }
        });
      });
    });

    // childList: true → watch for nodes being added or removed
    // subtree: true   → watch ALL descendants, not just direct children
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('☕ ChaiTailwind ready!');
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  //
  // We expose both init() and applyStyles() so that external code can:
  //   - Start the engine:          ChaiTailwind.init()
  //   - Re-style a specific node:  ChaiTailwind.applyStyles(element)
  //
  // applyStyles is public because the MutationObserver only detects new NODES,
  // not class name changes on existing nodes. The playground uses this directly.
  // ═══════════════════════════════════════════════════════════════════════════

  return { init, applyStyles };

})();

// Auto-start: wait for HTML to be fully parsed, then initialize the engine
document.addEventListener('DOMContentLoaded', ChaiTailwind.init);