// Brutalist Select Web Component
// Attributes: label, name, required, disabled
// Options provided as child <option> elements

class AppSelect extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['label', 'name', 'required', 'disabled'];
    }

    private get label(): string {
        return this.getAttribute('label') || '';
    }

    private get name(): string {
        return this.getAttribute('name') || '';
    }

    private get isRequired(): boolean {
        return this.hasAttribute('required');
    }

    private get isDisabled(): boolean {
        return this.hasAttribute('disabled');
    }

    get value(): string {
        const select = this.querySelector('select');
        return select?.value || '';
    }

    set value(val: string) {
        const select = this.querySelector('select');
        if (select) {
            select.value = val;
        }
    }

    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(): void {
        this.render();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const select = this.querySelector('select');
        select?.addEventListener('change', (e: Event) => {
            this.dispatchEvent(
                new CustomEvent('app-select-change', {
                    bubbles: true,
                    detail: { value: (e.target as HTMLSelectElement).value }
                })
            );
        });
    }

    private render(): void {
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
