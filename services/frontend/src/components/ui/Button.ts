// Brutalist Button Web Component
// Attributes: variant (primary|secondary), disabled, loading, size (sm|md|lg)

import type { ButtonVariant, ComponentSize } from '../types.js';

class AppButton extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['variant', 'disabled', 'loading', 'size'];
    }

    private get variant(): ButtonVariant {
        return (this.getAttribute('variant') as ButtonVariant) || 'primary';
    }

    private get isDisabled(): boolean {
        return this.hasAttribute('disabled');
    }

    private get isLoading(): boolean {
        return this.hasAttribute('loading');
    }

    private get size(): ComponentSize {
        return (this.getAttribute('size') as ComponentSize) || 'md';
    }

    connectedCallback(): void {
        this.render();
        this.setupClickHandler();
    }

    attributeChangedCallback(): void {
        this.render();
    }

    private setupClickHandler(): void {
        this.addEventListener('click', (e: Event) => {
            if (this.isDisabled || this.isLoading) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    private getSizeClasses(): string {
        const sizes: Record<ComponentSize, string> = {
            sm: 'px-3 py-2 text-xs',
            md: 'px-4 py-3 text-sm',
            lg: 'px-6 py-4 text-base'
        };
        return sizes[this.size];
    }

    private getVariantClasses(): string {
        if (this.isDisabled) {
            return 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed';
        }

        const variants: Record<ButtonVariant, string> = {
            primary: 'btn-primary',
            secondary: 'btn-secondary'
        };
        return variants[this.variant];
    }

    private render(): void {
        const variantClasses = this.getVariantClasses();
        const loadingClass = this.isLoading ? 'opacity-70' : '';

        const loadingSpinner = this.isLoading ? `
            <span class="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        ` : '';

        // Capture the text content before replacing innerHTML
        const buttonText = this.textContent || '';

        this.innerHTML = `
            <button
                class="btn-brutalist ${variantClasses} ${loadingClass}"
                ${this.isDisabled || this.isLoading ? 'disabled' : ''}
            >
                ${loadingSpinner}${buttonText}
            </button>
        `;
    }
}

customElements.define('app-button', AppButton);
