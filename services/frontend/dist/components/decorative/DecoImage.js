// Decorative Image Component
// Box with brutalist-filtered image
// Attributes: src, alt, size (sm|md|lg)
class AppDecoImage extends HTMLElement {
    static get observedAttributes() {
        return ['src', 'alt', 'size'];
    }
    get src() {
        return this.getAttribute('src') || '';
    }
    get alt() {
        return this.getAttribute('alt') || '';
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
    render() {
        this.style.cssText = 'display: block; width: 100%; height: 100%; overflow: hidden;';
        this.innerHTML = `
            ${this.src ? `
                <img
                    src="${this.src}"
                    alt="${this.alt}"
                    class="w-full h-full object-cover img-brutalist"
                    style="display: block;"
                />
            ` : `
                <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span class="font-mono text-xs text-gray-500 uppercase">No Image</span>
                </div>
            `}
        `;
    }
}
customElements.define('app-deco-image', AppDecoImage);
export {};
