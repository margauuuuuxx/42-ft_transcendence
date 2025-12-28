// Brutalist Modal Web Component
// Attributes: size (sm|md|lg), open
// Slots: title, content
class AppModal extends HTMLElement {
    constructor() {
        super(...arguments);
        this.modalContainer = null;
        this.originalContent = null;
    }
    static get observedAttributes() {
        return ['size', 'open'];
    }
    get size() {
        return this.getAttribute('size') || 'md';
    }
    get isOpen() {
        return this.hasAttribute('open');
    }
    connectedCallback() {
        // Store original content before we modify the DOM
        this.originalContent = document.createDocumentFragment();
        while (this.firstChild) {
            this.originalContent.appendChild(this.firstChild);
        }
        this.render();
        this.setupEventListeners();
    }
    attributeChangedCallback() {
        if (this.modalContainer) {
            const displayClass = this.isOpen ? 'flex' : 'hidden';
            this.modalContainer.className = this.modalContainer.className.replace(/(hidden|flex)/, displayClass);
        }
        if (this.isOpen) {
            document.body.style.overflow = 'hidden';
            this.dispatchEvent(new CustomEvent('app-modal-open', { bubbles: true }));
        }
        else {
            document.body.style.overflow = '';
            this.dispatchEvent(new CustomEvent('app-modal-close', { bubbles: true }));
        }
    }
    setupEventListeners() {
        // Close on backdrop click
        const backdrop = this.querySelector('[data-backdrop]');
        backdrop?.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.close();
            }
        });
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', handleEscape);
        // Close button
        const closeBtn = this.querySelector('[data-close]');
        closeBtn?.addEventListener('click', () => this.close());
    }
    getSizeClasses() {
        const sizes = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-2xl'
        };
        return sizes[this.size];
    }
    open() {
        this.setAttribute('open', '');
    }
    close() {
        this.removeAttribute('open');
    }
    render() {
        const sizeClasses = this.getSizeClasses();
        const displayClass = this.isOpen ? 'flex' : 'hidden';
        // Create the modal structure
        const modalHTML = `
            <div
                data-backdrop
                class="${displayClass} fixed inset-0 z-50 items-center justify-center bg-black/50"
            >
                <div class="bg-white border-2 border-black w-full mx-4 ${sizeClasses}">
                    <!-- Header -->
                    <div class="flex items-stretch border-b-2 border-black">
                        <div class="flex-1 p-4 flex items-center">
                            <h2 class="title-black-bg-small modal-title"></h2>
                        </div>
                        <button
                            data-close
                            class="flex-shrink-0 w-16 border-l-2 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                            aria-label="Close modal"
                        >
                            <span class="symbol-brutalist">&times;</span>
                        </button>
                    </div>
                    <!-- Content -->
                    <div class="p-6 modal-content">
                    </div>
                </div>
            </div>
        `;
        this.innerHTML = modalHTML;
        this.modalContainer = this.querySelector('[data-backdrop]');
        // Now populate with the original slotted content
        if (this.originalContent) {
            const titleSlot = this.originalContent.querySelector('[slot="title"]');
            const contentSlot = this.originalContent.querySelector('[slot="content"]');
            const titleContainer = this.querySelector('.modal-title');
            const contentContainer = this.querySelector('.modal-content');
            if (titleContainer && titleSlot) {
                titleContainer.textContent = titleSlot.textContent || 'Modal Title';
            }
            if (contentContainer && contentSlot) {
                // Clone the content to avoid moving it
                const contentClone = contentSlot.cloneNode(true);
                contentContainer.appendChild(contentClone);
            }
        }
    }
}
customElements.define('app-modal', AppModal);
export {};
