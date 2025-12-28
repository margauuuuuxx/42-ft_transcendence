// Decorative Giant Number Component
// Large brutalist numbers for editorial collage style (inspiration: 60, 70, 05)
// White text on black background, aligned top-left
// Attributes: value, size (sm|md|lg)

import type { ComponentSize } from '../types.js';

class AppDecoGiantNumber extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['value', 'size'];
    }

    private get value(): string {
        return this.getAttribute('value') || '00';
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
            sm: 'text-6xl',      // ~3.75rem / 60px
            md: 'text-8xl',      // ~6rem / 96px
            lg: 'text-9xl'       // ~8rem / 128px
        };
        return sizes[this.size];
    }

    private render(): void {
        const numberClass = this.getSizeClasses();

        // Container aligns to top-left, text has black background like h1/h2/h3
        this.style.cssText = 'display: flex; align-items: flex-start; justify-content: flex-start; width: 100%; height: 100%;';
        this.innerHTML = `
            <span class="inline-block bg-black text-white font-sans font-black ${numberClass} leading-none px-2 py-1">${this.value}</span>
        `;
    }
}

customElements.define('app-deco-giant-number', AppDecoGiantNumber);
