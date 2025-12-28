// Decorative Vertical Text Component
// Attributes: text, size (sm|md|lg), align (left-bottom|left-top|right-bottom|right-top)

import type { ComponentSize } from '../types.js';

type VerticalAlign = 'left-bottom' | 'left-top' | 'right-bottom' | 'right-top';

class AppDecoVertical extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['text', 'size', 'align'];
    }

    private get text(): string {
        return this.getAttribute('text') || '';
    }

    private get size(): ComponentSize {
        return (this.getAttribute('size') as ComponentSize) || 'md';
    }

    private get align(): VerticalAlign {
        return (this.getAttribute('align') as VerticalAlign) || 'left-bottom';
    }

    connectedCallback(): void {
        this.render();
    }

    attributeChangedCallback(): void {
        this.render();
    }

    private getSizeClasses(): string {
        const sizes: Record<ComponentSize, string> = {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base'
        };
        return sizes[this.size];
    }

    private getAlignmentStyles(): { alignItems: string; justifyContent: string } {
        const alignments: Record<VerticalAlign, { alignItems: string; justifyContent: string }> = {
            'left-bottom': { alignItems: 'flex-end', justifyContent: 'flex-start' },
            'left-top': { alignItems: 'flex-start', justifyContent: 'flex-start' },
            'right-bottom': { alignItems: 'flex-end', justifyContent: 'flex-end' },
            'right-top': { alignItems: 'flex-start', justifyContent: 'flex-end' }
        };
        return alignments[this.align];
    }

    private render(): void {
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
