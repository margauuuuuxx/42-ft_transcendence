// Grid-Based Navbar Component
// Uses display: contents to make navbar transparent in grid layout
// Navbar items become direct children of parent grid
// Subscribes to authState to show login/profile dynamically
import { authState } from '../lib/authState.js';
class Navbar extends HTMLElement {
    constructor() {
        super(...arguments);
        this.unsubscribe = null;
    }
    connectedCallback() {
        this.render();
        this.updateActiveLink();
        this.setupEasterEgg();
        // Subscribe to auth changes
        this.unsubscribe = authState.subscribe(() => {
            this.render();
            this.updateActiveLink();
            this.setupEasterEgg();
        });
        // Check if colors were inverted previously
        this.restoreColorInversion();
    }
    disconnectedCallback() {
        // Clean up subscription when element is removed
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
    render() {
        const isLoggedIn = authState.isAuthenticated();
        this.innerHTML = `
      <!-- Mobile Hamburger Menu -->
      <div class="lg:hidden col-span-full bg-white p-4 flex justify-between items-center">
        <h1 class="text-xl font-bold">BRUTALIST PONG</h1>
        <button id="mobile-menu-toggle" class="text-2xl">☰</button>
      </div>

      <!-- Mobile Menu (Hidden by default) -->
      <nav id="mobile-menu" class="lg:hidden col-span-full bg-white hidden flex-col gap-[2px] bg-black p-[2px]">
        <a data-navigate="/" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">HOME</a>
        <a data-navigate="/tournament" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">TOURNAMENT</a>
        <a data-navigate="/history" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">HISTORY</a>
        <a data-navigate="/leaderboard" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">LEADERBOARD</a>
        <a data-navigate="/social" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">SOCIAL</a>
        <a data-navigate="/game" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">PLAY</a>
        <a data-navigate="/design" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">DESIGN</a>
        ${isLoggedIn ? `
          <a data-navigate="/profile" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">PROFILE</a>
        ` : `
          <a data-navigate="/login" class="nav-link bg-white hover:bg-black hover:text-white p-4 block">LOGIN</a>
        `}
      </nav>

      <!-- Desktop Grid Navigation (Hidden on mobile) -->
      <!-- HOME - Vertical text, 1 column, 2 rows -->
      <a data-navigate="/"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 flex-col justify-end items-start row-span-2 cursor-pointer relative">
        <span class="vertical-text-left font-medium uppercase tracking-wide">HOME</span>
      </a>

      <!-- TOURNAMENT - 3 columns -->
      <a data-navigate="/tournament"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-3">
        <span class="font-medium uppercase tracking-wide leading-tight">TOURNA-<br>MENT</span>
      </a>

      <!-- TITLE - Spans 6 columns and 2 rows -->
      <div id="easter-egg-title" class="hidden lg:flex bg-white col-span-6 row-span-2 p-5 flex-col cursor-pointer">
        <h1 class="title-black-bg inline-block">BRUTALIST<br>&nbsp&nbspPONG GAME</h1>
      </div>

      <!-- HISTORY - 2 columns -->
      <a data-navigate="/history"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-2">
        <span class="font-medium uppercase tracking-wide">HISTORY</span>
      </a>

      <!-- LEADERBOARD - 2 columns -->
      <a data-navigate="/leaderboard"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-2">
        <span class="font-medium uppercase tracking-wide leading-tight">LEADER-<br>BOARD</span>
      </a>

      <!-- SOCIAL - 2 columns -->
      <a data-navigate="/social"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-2">
        <span class="font-medium uppercase tracking-wide">SOCIAL</span>
      </a>

      <!-- ROW 2 -->

      <!-- PLAY - 3 columns -->
      <a data-navigate="/game"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-3">
        <span class="font-medium uppercase tracking-wide">PLAY</span>
      </a>

      <!-- DESIGN - 2 columns -->
      <a data-navigate="/design"
         class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-2">
        <span class="font-medium uppercase tracking-wide">DESIGN</span>
      </a>

      <!-- AUTH SECTION - 4 columns (dynamic based on auth state) -->
      ${isLoggedIn ? `
        <!-- PROFILE - 4 columns when logged in -->
        <a data-navigate="/profile"
           class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-4">
          <span class="font-medium uppercase tracking-wide">PROFILE</span>
        </a>
      ` : `
        <!-- LOGIN - 4 columns when logged out -->
        <a data-navigate="/login"
           class="hidden lg:flex nav-link bg-white hover:bg-black hover:text-white transition-colors duration-200 p-5 items-center cursor-pointer col-span-4">
          <span class="font-medium uppercase tracking-wide">LOGIN</span>
        </a>
      `}
    `;
        // Setup mobile menu toggle
        this.setupMobileMenu();
    }
    updateActiveLink() {
        const currentPath = window.location.pathname;
        const links = this.querySelectorAll('.nav-link');
        links.forEach(link => {
            const linkPath = link.getAttribute('data-navigate');
            if (linkPath === currentPath) {
                link.classList.remove('bg-white');
                link.classList.add('bg-black', 'text-white');
            }
            else {
                link.classList.remove('bg-black', 'text-white');
                link.classList.add('bg-white');
            }
        });
    }
    setupMobileMenu() {
        const toggle = this.querySelector('#mobile-menu-toggle');
        const menu = this.querySelector('#mobile-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('hidden');
                menu.classList.toggle('flex');
            });
            // Close menu when a link is clicked
            const links = menu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.add('hidden');
                    menu.classList.remove('flex');
                });
            });
        }
    }
    setupEasterEgg() {
        const title = this.querySelector('#easter-egg-title');
        if (title) {
            title.addEventListener('click', () => this.toggleColorInversion());
        }
    }
    toggleColorInversion() {
        const html = document.documentElement;
        const isInverted = html.style.filter === 'invert(1)';
        if (isInverted) {
            html.style.filter = '';
            localStorage.removeItem('color-inverted');
        }
        else {
            html.style.filter = 'invert(1)';
            localStorage.setItem('color-inverted', 'true');
        }
    }
    restoreColorInversion() {
        const isInverted = localStorage.getItem('color-inverted') === 'true';
        if (isInverted) {
            document.documentElement.style.filter = 'invert(1)';
        }
    }
}
customElements.define('app-navbar', Navbar);
