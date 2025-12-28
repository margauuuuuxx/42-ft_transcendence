// Brutalist Input Web Component
// Attributes: type, label, placeholder, error, required, value, name

import type { InputType } from '../types.js';

class AppInput extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['type', 'label', 'placeholder', 'error', 'required', 'value', 'name', 'disabled'];
    }

    private get inputType(): InputType {
        return (this.getAttribute('type') as InputType) || 'text';
    }

    private get label(): string {
        return this.getAttribute('label') || '';
    }

    private get placeholder(): string {
        return this.getAttribute('placeholder') || '';
    }

    private get error(): string {
        return this.getAttribute('error') || '';
    }

    private get isRequired(): boolean {
        return this.hasAttribute('required');
    }

    private get isDisabled(): boolean {
        return this.hasAttribute('disabled');
    }

    private get name(): string {
        return this.getAttribute('name') || '';
    }

    get value(): string {
        const input = this.querySelector('input');
        return input?.value || '';
    }

    set value(val: string) {
        const input = this.querySelector('input');
        if (input) {
            input.value = val;
        }
    }

    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
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

    private setupEventListeners(): void {
        const input = this.querySelector('input');
        if (!input) return;

        input.addEventListener('input', (e: Event) => {
            this.dispatchEvent(new CustomEvent('app-input', {
                detail: { value: (e.target as HTMLInputElement).value },
                bubbles: true
            }));
        });

        input.addEventListener('change', (e: Event) => {
            this.dispatchEvent(new CustomEvent('app-change', {
                detail: { value: (e.target as HTMLInputElement).value },
                bubbles: true
            }));
        });
    }

    private render(): void {
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

    focus(): void {
        const input = this.querySelector('input');
        input?.focus();
    }

    blur(): void {
        const input = this.querySelector('input');
        input?.blur();
    }
}

customElements.define('app-input', AppInput);
