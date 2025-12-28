// Brutalist Input Web Component
// Attributes: type, label, placeholder, error, required, value, name
class AppInput extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'label', 'placeholder', 'error', 'required', 'value', 'name', 'disabled'];
    }
    get inputType() {
        return this.getAttribute('type') || 'text';
    }
    get label() {
        return this.getAttribute('label') || '';
    }
    get placeholder() {
        return this.getAttribute('placeholder') || '';
    }
    get error() {
        return this.getAttribute('error') || '';
    }
    get isRequired() {
        return this.hasAttribute('required');
    }
    get isDisabled() {
        return this.hasAttribute('disabled');
    }
    get name() {
        return this.getAttribute('name') || '';
    }
    get value() {
        const input = this.querySelector('input');
        return input?.value || '';
    }
    set value(val) {
        const input = this.querySelector('input');
        if (input) {
            input.value = val;
        }
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // Preserve current input value before re-rendering
            const currentValue = this.value;
            this.render();
            if (name !== 'value') {
                this.value = currentValue;
            }
            this.setupEventListeners();
        }
    }
    setupEventListeners() {
        const input = this.querySelector('input');
        if (!input)
            return;
        input.addEventListener('input', (e) => {
            this.dispatchEvent(new CustomEvent('app-input', {
                detail: { value: e.target.value },
                bubbles: true
            }));
        });
        input.addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('app-change', {
                detail: { value: e.target.value },
                bubbles: true
            }));
        });
    }
    render() {
        const hasError = !!this.error;
        const inputId = `input-${this.name || Math.random().toString(36).substr(2, 9)}`;
        const disabledClass = this.isDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white';
        this.innerHTML = `
            <div class="w-full">
                ${this.label ? `
                    <label for="${inputId}" class="mono-text text-xs uppercase block mb-2">
                        ${this.label}
                    </label>
                ` : ''}
                <input
                    id="${inputId}"
                    type="${this.inputType}"
                    name="${this.name}"
                    placeholder="${this.placeholder}"
                    ${this.isRequired ? 'required' : ''}
                    ${this.isDisabled ? 'disabled' : ''}
                    value="${this.getAttribute('value') || ''}"
                    class="border-2 border-black p-3 input-brutalist ${disabledClass} focus:outline-none focus:bg-black focus:text-white focus:placeholder-white hover:bg-black hover:text-white hover:placeholder-white transition-colors duration-200 w-full"
                />
                ${hasError ? `
                    <p class="mt-2 mono-text text-xs uppercase">${this.error}</p>
                ` : ''}
            </div>
        `;
    }
    focus() {
        const input = this.querySelector('input');
        input?.focus();
    }
    blur() {
        const input = this.querySelector('input');
        input?.blur();
    }
}
customElements.define('app-input', AppInput);
export {};
