"use strict";
// Brutalist Table Web Component
// Uses slots for header and rows
class AppTable extends HTMLElement {
    static get observedAttributes() {
        return ['columns'];
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback() {
        this.render();
    }
    render() {
        // Check if there's a table slot with full table content
        const tableSlot = this.querySelector('[slot="table"]');
        if (tableSlot && tableSlot.tagName === 'TABLE') {
            // Use the provided table and just add the brutalist class
            const table = tableSlot.cloneNode(true);
            table.removeAttribute('slot');
            table.classList.add('table-brutalist');
            // Ensure tfoot exists
            if (!table.querySelector('tfoot')) {
                const thead = table.querySelector('thead');
                const colCount = thead?.querySelectorAll('th').length || 3;
                const tfoot = document.createElement('tfoot');
                tfoot.innerHTML = `<tr><td colspan="${colCount}"></td></tr>`;
                table.appendChild(tfoot);
            }
            this.innerHTML = `
                <div class="overflow-x-auto -mx-2 sm:mx-0">
                    ${table.outerHTML}
                </div>
            `;
            // Add min-width to prevent column collapse
            const tableElement = this.querySelector('table');
            if (tableElement) {
                tableElement.style.minWidth = '600px';
            }
            return;
        }
        // Get original content before replacing
        const headerSlot = this.querySelector('[slot="header"]');
        const bodyContent = Array.from(this.querySelectorAll('[slot="row"]'));
        // Build header cells from slot content
        let headerCells = '';
        if (headerSlot) {
            const headers = headerSlot.getAttribute('data-columns')?.split(',') || [];
            headerCells = headers.map(h => `<th class="text-left">${h.trim()}</th>`).join('');
        }
        // Build body rows from slot content
        const bodyRows = bodyContent.map(row => row.outerHTML).join('');
        this.innerHTML = `
            <div class="overflow-x-auto -mx-2 sm:mx-0">
                <table class="table-brutalist" style="min-width: 600px;">
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                    <tfoot>
                        <tr><td colspan="100"></td></tr>
                    </tfoot>
                </table>
            </div>
        `;
    }
    // Helper method to set table data programmatically
    setData(headers, rows) {
        const headerCells = headers.map(h => `<th class="text-left">${h}</th>`).join('');
        const bodyRows = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
        this.innerHTML = `
            <div class="overflow-x-auto -mx-2 sm:mx-0">
                <table class="table-brutalist" style="min-width: 600px;">
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                    <tfoot>
                        <tr><td colspan="${headers.length}"></td></tr>
                    </tfoot>
                </table>
            </div>
        `;
    }
}
customElements.define('app-table', AppTable);
