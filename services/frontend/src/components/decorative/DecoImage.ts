// Decorative Image Component
// Box with brutalist-filtered image
// Attributes: src, alt, size (sm|md|lg)

import type { ComponentSize } from '../types.js';

class AppDecoImage extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['src', 'alt', 'size'];
    }

    private get src(): string {
        return this.getAttribute('src') || '';
    }

    private get alt(): string {
        return this.getAttribute('alt') || '';
    }

    private get size(): ComponentSize {
        return (this.getAttribute('size') as ComponentSize) || 'md';
    }

    connectedCallback(): void {
        this.render();
    }

    attributeChangedCallback(): void {
        this.render();
    }

    private render(): void {
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
