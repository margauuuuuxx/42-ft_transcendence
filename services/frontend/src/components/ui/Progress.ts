// Brutalist Progress Bar Web Component
// Horizontal progress bar for scores/loading
// Attributes: value, max

class AppProgress extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['value', 'max', 'label'];
    }

    private get value(): number {
        return parseFloat(this.getAttribute('value') || '0');
    }

    private get max(): number {
        return parseFloat(this.getAttribute('max') || '100');
    }

    private get label(): string {
        return this.getAttribute('label') || '';
    }

    connectedCallback(): void {
        this.render();
    }

    attributeChangedCallback(): void {
        this.render();
    }

    private getPercentage(): number {
        if (this.max <= 0) return 0;
        const percentage = (this.value / this.max) * 100;
        return Math.min(100, Math.max(0, percentage));
    }

    private render(): void {
        const percentage = this.getPercentage();

        this.innerHTML = `
            <div class="w-full">
                ${this.label ? `
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-sans text-sm font-medium uppercase tracking-wide">${this.label}</span>
                        <span class="font-mono text-sm">${this.value}/${this.max}</span>
                    </div>
                ` : ''}
                <div class="w-full h-4 border-2 border-black bg-white">
                    <div
                        class="h-full bg-black transition-all duration-300"
                        style="width: ${percentage}%"
                        role="progressbar"
                        aria-valuenow="${this.value}"
                        aria-valuemin="0"
                        aria-valuemax="${this.max}"
                    ></div>
                </div>
            </div>
        `;
    }

    // Helper method to animate value changes
    setValue(newValue: number, animate: boolean = true): void {
        if (animate) {
            const bar = this.querySelector('[role="progressbar"]') as HTMLElement;
            if (bar) {
                this.setAttribute('value', newValue.toString());
            }
        } else {
            this.setAttribute('value', newValue.toString());
        }
    }
}

customElements.define('app-progress', AppProgress);
