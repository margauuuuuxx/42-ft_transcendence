"use strict";
// Footer Component
// Uses display: contents to make footer transparent in grid layout
// Footer becomes a direct child of parent grid
class Footer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
      <div class="col-span-full lg:col-span-16 bg-black text-white p-4 sm:p-5">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <a data-navigate="/" class="font-mono text-xs sm:text-sm uppercase tracking-wide hover:underline cursor-pointer">42/transcendance</a>
          <a data-navigate="/legal" class="font-mono text-xs sm:text-sm uppercase tracking-wide hover:underline cursor-pointer">/LEGAL</a>
        </div>
      </div>
    `;
    }
}
customElements.define('app-footer', Footer);
