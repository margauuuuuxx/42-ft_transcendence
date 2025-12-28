// Decorative Encircled Component
// Text inside a ship (ellipse) border (inspiration: "17-10-2026" encircled)
// Attributes: text, size (sm|md|lg)
class AppDecoEncircled extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'size'];
    }
    get text() {
        return this.getAttribute('text') || '';
    }
    get size() {
        return this.getAttribute('size') || 'md';
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    getSizeClasses() {
        const sizes = {
            sm: { text: 'text-base', padding: 'px-4 py-2' },
            md: { text: 'text-2xl', padding: 'px-6 py-3' },
            lg: { text: 'text-4xl', padding: 'px-8 py-4' }
        };
        return sizes[this.size];
    }
    render() {
        const { text, padding } = this.getSizeClasses();
        this.style.cssText = 'display: inline-block;';
        this.innerHTML = `
            <div class="rounded-full border-2 border-black inline-flex items-center justify-center ${padding}">
                <span class="font-sans ${text} font-black whitespace-nowrap leading-tight uppercase">${this.text}</span>
            </div>
        `;
    }
}
customElements.define('app-deco-encircled', AppDecoEncircled);
export {};
