// Brutalist Button Web Component
// Attributes: variant (primary|secondary), disabled, loading, size (sm|md|lg)
class AppButton extends HTMLElement {
    static get observedAttributes() {
        return ['variant', 'disabled', 'loading', 'size'];
    }
    get variant() {
        return this.getAttribute('variant') || 'primary';
    }
    get isDisabled() {
        return this.hasAttribute('disabled');
    }
    get isLoading() {
        return this.hasAttribute('loading');
    }
    get size() {
        return this.getAttribute('size') || 'md';
    }
    connectedCallback() {
        this.render();
        this.setupClickHandler();
    }
    attributeChangedCallback() {
        this.render();
    }
    setupClickHandler() {
        this.addEventListener('click', (e) => {
            if (this.isDisabled || this.isLoading) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    getSizeClasses() {
        const sizes = {
            sm: 'px-3 py-2 text-xs',
            md: 'px-4 py-3 text-sm',
            lg: 'px-6 py-4 text-base'
        };
        return sizes[this.size];
    }
    getVariantClasses() {
        if (this.isDisabled) {
            return 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed';
        }
        const variants = {
            primary: 'btn-primary',
            secondary: 'btn-secondary'
        };
        return variants[this.variant];
    }
    render() {
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
export {};
