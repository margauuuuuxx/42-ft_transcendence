// Brutalist Avatar Web Component
// Square image with fallback to initials
// Attributes: src, initials, size (sm|md|lg)

import type { ComponentSize } from '../types.js';

class AppAvatar extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['src', 'initials', 'size'];
    }

    private get src(): string {
        return this.getAttribute('src') || '';
    }

    private get initials(): string {
        return this.getAttribute('initials') || '';
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

    private getSizeClasses(): { container: string; text: string } {
        const sizes: Record<ComponentSize, { container: string; text: string }> = {
            sm: { container: 'w-8 h-8', text: 'text-xs' },
            md: { container: 'w-12 h-12', text: 'text-base' },
            lg: { container: 'w-20 h-20', text: 'text-2xl' }
        };
        return sizes[this.size];
    }

    private getDefaultInitials(): string {
        const defaultInitials: Record<ComponentSize, string> = {
            sm: 'SS',
            md: 'MM',
            lg: 'LL'
        };
        return this.initials || defaultInitials[this.size];
    }

    private handleImageError(): void {
        // Re-render without the image on error
        const img = this.querySelector('img');
        if (img) {
            img.style.display = 'none';
            const fallback = this.querySelector('[data-fallback]');
            if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
            }
        }
    }

    private render(): void {
        const { container, text } = this.getSizeClasses();
        const displayInitials = this.getDefaultInitials().substring(0, 2).toUpperCase();

        this.innerHTML = `
            <div class="relative border-2 border-black overflow-hidden ${container}">
                ${this.src ? `
                    <img
                        src="${this.src}"
                        alt="${displayInitials}"
                        class="w-full h-full object-cover img-brutalist"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                    />
                    <div
                        data-fallback
                        class="absolute inset-0 items-center justify-center font-mono font-bold ${text}"
                        style="display: ${this.src ? 'none' : 'flex'}; background-color: var(--color-gray);"
                    >
                        ${displayInitials}
                    </div>
                ` : `
                    <div class="w-full h-full flex items-center justify-center font-mono font-bold ${text}" style="background-color: var(--color-gray);">
                        ${displayInitials}
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-avatar', AppAvatar);
