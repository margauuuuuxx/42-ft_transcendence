"use strict";
// Brutalist Checkbox Web Component
// Attributes: label, checked, disabled, name
class AppCheckbox extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'checked', 'disabled', 'name'];
    }
    get label() {
        return this.getAttribute('label') || '';
    }
    get isDisabled() {
        return this.hasAttribute('disabled');
    }
    get name() {
        return this.getAttribute('name') || '';
    }
    get checked() {
        const input = this.querySelector('input');
        return input?.checked || false;
    }
    set checked(val) {
        const input = this.querySelector('input');
        if (input) {
            input.checked = val;
        }
        if (val) {
            this.setAttribute('checked', '');
        }
        else {
            this.removeAttribute('checked');
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
        const input = this.querySelector('input');
        if (!input)
            return;
        input.addEventListener('change', (e) => {
            const target = e.target;
            if (target.checked) {
                this.setAttribute('checked', '');
            }
            else {
                this.removeAttribute('checked');
            }
            this.dispatchEvent(new CustomEvent('app-change', {
                detail: { checked: target.checked },
                bubbles: true
            }));
        });
    }
    render() {
        const checkboxId = `checkbox-${this.name || Math.random().toString(36).substr(2, 9)}`;
        const isChecked = this.hasAttribute('checked');
        const disabledClass = this.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
        this.innerHTML = `
            <label class="flex items-center gap-3 ${disabledClass}">
                <input
                    id="${checkboxId}"
                    type="checkbox"
                    name="${this.name}"
                    ${isChecked ? 'checked' : ''}
                    ${this.isDisabled ? 'disabled' : ''}
                />
                ${this.label ? `
                    <span class="mono-text uppercase">
                        ${this.label}
                    </span>
                ` : ''}
            </label>
        `;
    }
}
customElements.define('app-checkbox', AppCheckbox);
