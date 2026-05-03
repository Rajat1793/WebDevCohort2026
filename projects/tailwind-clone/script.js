// 1. Attributes Mapping
const CHAI_MAP = {
    'p': 'padding',
    'm': 'margin',
    'bg': 'backgroundColor',
    'text': 'color',
    'fs': 'fontSize',
    'rounded': 'borderRadius',
    'w': 'width',
    'h': 'height',
    'bw': 'borderWidth'
};

// 2. Color Theme
const CHAI_THEME = {
    'primary': '#3b82f6',
    'secondary': '#10b981',
    'danger': '#ef4444',
    'dark': '#1f2937',
    'white': '#ffffff'
};

// 3. Function to parse a class like "chai-bg-primary" or "chai-hover-bg-dark"
//  "chai-bg-primary" and returns a style object
function parseChaiClass(className) {
    if (!className.startsWith('chai-')) 
        return null;

    // Spliting the class into parts so that we can identify the properties
    const parts = className.split('-');
    if (parts.length < 3) return null;

    const isHover = parts[1] === 'hover';
    const prefix = isHover ? parts[2] : parts[1];
    const value = isHover ? parts[3] : parts[2];
    
    const property = CHAI_MAP[prefix];

    if (property) {
        // Add a px if the value is number
        let finalValue = CHAI_THEME[value] || value;
        if (!isNaN(value) && value !== "") {
            finalValue = `${value}px`;
        }
        return { property, finalValue, isHover };
    }
    return null;
}

// 4. Check for the styles and apply them to the element
function applyChaiStyles(element) {
    if (!element.classList) 
        return;

    element.classList.forEach(cls => {
        const styleData = parseChaiClass(cls);
        
        if (styleData) {
            if (styleData.isHover) {
                const originalValue = element.style[styleData.property];
                element.onmouseenter = () => {
                    element.style[styleData.property] = styleData.finalValue;
                };
                element.onmouseleave = () => {
                    element.style[styleData.property] = originalValue;
                };
            } else {
                element.style[styleData.property] = styleData.finalValue;
            }
        }
    });
}

// 5. Updates the HTML with inline styles
function initChaiEngine() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => applyChaiStyles(el));
    console.log("ChaiTailwind Engine: Active");
}

// 6. Observe for any changes in the DOM and apply styles to new elements or updated classes
// Help taken from https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
function startChaiObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            // If new elements are added
            if (m.addedNodes) {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        applyChaiStyles(node);
                        node.querySelectorAll('*').forEach(child => applyChaiStyles(child));
                    }
                });
            }
            // If an existing element's class is changed
            if (m.type === 'attributes' && m.attributeName === 'class') {
                applyChaiStyles(m.target);
            }
        });
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true 
    });
}

// 7. Calling a function to look for changes in DOM
document.addEventListener('DOMContentLoaded', () => {
    initChaiEngine();
    startChaiObserver();
});