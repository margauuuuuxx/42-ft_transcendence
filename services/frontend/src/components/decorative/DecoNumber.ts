// Decorative Number Component
// Box with centered large number
// Attributes: value, size (sm|md|lg)

import type { ComponentSize } from '../types.js';

class AppDecoNumber extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['value', 'size'];
    }

    private get value(): string {
        return this.getAttribute('value') || '0';
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

    private getSizeClasses(): string {
        const sizes: Record<ComponentSize, string> = {
            sm: 'text-2xl',
            md: 'text-5xl',
            lg: 'text-7xl'
        };
        return sizes[this.size];
    }

    private render(): void {
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
