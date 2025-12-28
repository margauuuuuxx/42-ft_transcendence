// Decorative Vertical Text Component
// Attributes: text, size (sm|md|lg), align (left-bottom|left-top|right-bottom|right-top)
class AppDecoVertical extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'size', 'align'];
    }
    get text() {
        return this.getAttribute('text') || '';
    }
    get size() {
        return this.getAttribute('size') || 'md';
    }
    get align() {
        return this.getAttribute('align') || 'left-bottom';
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    getSizeClasses() {
        const sizes = {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base'
        };
        return sizes[this.size];
    }
    getAlignmentStyles() {
        const alignments = {
            'left-bottom': { alignItems: 'flex-end', justifyContent: 'flex-start' },
            'left-top': { alignItems: 'flex-start', justifyContent: 'flex-start' },
            'right-bottom': { alignItems: 'flex-end', justifyContent: 'flex-end' },
            'right-top': { alignItems: 'flex-start', justifyContent: 'flex-end' }
        };
        return alignments[this.align];
    }
    render() {
        const textClass = this.getSizeClasses();
        const { alignItems, justifyContent } = this.getAlignmentStyles();
        this.style.cssText = `display: block; width: 100%; height: 100%;`;
        this.innerHTML = `
            <div style="display: flex; align-items: ${alignItems}; justify-content: ${justifyContent}; padding-top: 0.7rem; padding-bottom: 0.7rem; padding-left: 0.5rem; padding-right: 0.5rem; width: 100%; height: 100%;">
                <span class="vertical-text-left ${textClass}">${this.text}</span>
            </div>
        `;
    }
}
customElements.define('app-deco-vertical', AppDecoVertical);
export {};
