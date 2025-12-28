"use strict";
// Brutalist Select Web Component
// Attributes: label, name, required, disabled
// Options provided as child <option> elements
class AppSelect extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'name', 'required', 'disabled'];
    }
    get label() {
        return this.getAttribute('label') || '';
    }
    get name() {
        return this.getAttribute('name') || '';
    }
    get isRequired() {
        return this.hasAttribute('required');
    }
    get isDisabled() {
        return this.hasAttribute('disabled');
    }
    get value() {
        const select = this.querySelector('select');
        return select?.value || '';
    }
    set value(val) {
        const select = this.querySelector('select');
        if (select) {
            select.value = val;
        }
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    attributeChangedCallback() {
        this.render();
        this.setupEventListeners();
    }
    setupEventListeners() {
        const select = this.querySelector('select');
        select?.addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('app-select-change', {
                bubbles: true,
                detail: { value: e.target.value }
            }));
        });
    }
    render() {
        // Capture options before render
        const options = Array.from(this.querySelectorAll('option'))
            .map(opt => ({
            value: opt.value,
            text: opt.textContent || '',
            selected: opt.hasAttribute('selected')
        }));
        const selectId = `select-${Math.random().toString(36).substring(2, 9)}`;
        this.innerHTML = `
            <div class="flex flex-col gap-1">
                ${this.label ? `
                    <label for="${selectId}" class="mono-text text-xs uppercase">
                        ${this.label}
                    </label>
                ` : ''}
                <select
                    id="${selectId}"
                    ${this.name ? `name="${this.name}"` : ''}
                    ${this.isRequired ? 'required' : ''}
                    ${this.isDisabled ? 'disabled' : ''}
                    class="w-full px-3 py-2 border-2 border-black bg-white mono-text text-sm
                           hover:bg-black hover:text-white
                           focus:bg-black focus:text-white focus:outline-none
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black
                           appearance-none cursor-pointer"
                >
                    ${options.map(opt => `
                        <option value="${opt.value}" ${opt.selected ? 'selected' : ''}>
                            ${opt.text}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }
}
customElements.define('app-select', AppSelect);
