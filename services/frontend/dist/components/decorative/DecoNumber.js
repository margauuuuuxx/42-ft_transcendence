// Decorative Number Component
// Box with centered large number
// Attributes: value, size (sm|md|lg)
class AppDecoNumber extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'size'];
    }
    get value() {
        return this.getAttribute('value') || '0';
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
            sm: 'text-2xl',
            md: 'text-5xl',
            lg: 'text-7xl'
        };
        return sizes[this.size];
    }
    render() {
        const numberClass = this.getSizeClasses();
        this.style.cssText = 'display: block; width: 100%; height: 100%;';
        this.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <span class="font-mono font-bold ${numberClass}">${this.value}</span>
            </div>
        `;
    }
}
customElements.define('app-deco-number', AppDecoNumber);
export {};
