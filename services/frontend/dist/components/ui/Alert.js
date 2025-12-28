// Brutalist Alert Web Component
// Attributes: variant (success|error|warning|info), dismissible
class AppAlert extends HTMLElement {
    static get observedAttributes() {
        return ['variant', 'dismissible'];
    }
    get variant() {
        return this.getAttribute('variant') || 'info';
    }
    get isDismissible() {
        return this.hasAttribute('dismissible');
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    attributeChangedCallback() {
        const content = this.textContent;
        this.render();
        // Restore text content in the message area
        const messageEl = this.querySelector('[data-message]');
        if (messageEl && content) {
            messageEl.textContent = content;
        }
        this.setupEventListeners();
    }
    setupEventListeners() {
        const dismissBtn = this.querySelector('[data-dismiss]');
        dismissBtn?.addEventListener('click', () => this.dismiss());
    }
    getVariantClasses() {
        const variants = {
            success: {
                icon: '▼',
                label: 'SUCCESS'
            },
            error: {
                icon: '■',
                label: 'ERROR'
            },
            warning: {
                icon: '▲',
                label: 'WARNING'
            },
            info: {
                icon: '◆',
                label: 'INFO'
            }
        };
        return variants[this.variant];
    }
    dismiss() {
        this.classList.add('opacity-0', 'transition-opacity', 'duration-200');
        setTimeout(() => {
            this.remove();
            this.dispatchEvent(new CustomEvent('app-alert-dismiss', { bubbles: true }));
        }, 200);
    }
    render() {
        const { icon, label } = this.getVariantClasses();
        // Get the text content from children before replacing
        const messageContent = Array.from(this.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE || node.tagName !== 'DIV')
            .map(node => node.textContent)
            .join('');
        this.innerHTML = `
            <div class="flex border-2 border-black bg-white">
                <div class="flex-shrink-0 w-20 border-r-2 border-black flex items-center justify-center py-4">
                    <span class="symbol-brutalist">${icon}</span>
                </div>
                <div class="flex-1 p-4">
                    <span class="mono-text text-xs uppercase font-bold block mb-1">${label}</span>
                    <p data-message class="mono-text text-sm">${messageContent}</p>
                </div>
                ${this.isDismissible ? `
                    <button
                        data-dismiss
                        class="flex-shrink-0 w-16 border-l-2 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                        aria-label="Dismiss alert"
                    >
                        <span class="symbol-brutalist">&times;</span>
                    </button>
                ` : ''}
            </div>
        `;
    }
}
customElements.define('app-alert', AppAlert);
export {};
