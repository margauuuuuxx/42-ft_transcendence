// Decorative Player Component
// Box with number top-right, label bottom-left
// Attributes: number, label, size (sm|md|lg)
class AppDecoPlayer extends HTMLElement {
    static get observedAttributes() {
        return ['number', 'label', 'size'];
    }
    get number() {
        return this.getAttribute('number') || '1';
    }
    get label() {
        return this.getAttribute('label') || 'PLAYER';
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
            sm: {
                number: 'text-lg',
                label: 'text-xs'
            },
            md: {
                number: 'text-2xl',
                label: 'text-sm'
            },
            lg: {
                number: 'text-4xl',
                label: 'text-base'
            }
        };
        return sizes[this.size];
    }
    render() {
        const { number, label } = this.getSizeClasses();
        this.style.cssText = 'display: block; width: 100%; height: 100%;';
        this.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%; padding: 1rem;">
                <span class="absolute top-2 right-3 font-mono font-normal ${number}">${this.number}</span>
                <span class="absolute bottom-2 left-3 font-sans font-medium uppercase tracking-wide ${label}">${this.label}</span>
            </div>
        `;
    }
}
customElements.define('app-deco-player', AppDecoPlayer);
export {};
