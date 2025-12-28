// Decorative Player Component
// Box with number top-right, label bottom-left
// Attributes: number, label, size (sm|md|lg)

import type { ComponentSize } from '../types.js';

class AppDecoPlayer extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['number', 'label', 'size'];
    }

    private get number(): string {
        return this.getAttribute('number') || '1';
    }

    private get label(): string {
        return this.getAttribute('label') || 'PLAYER';
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

    private getSizeClasses(): { number: string; label: string } {
        const sizes: Record<ComponentSize, { number: string; label: string }> = {
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

    private render(): void {
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
