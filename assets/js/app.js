/**
 * Vibe UI Template - Core App Logic
 * Setup Alpine.js data and global functions.
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('vibeApp', () => ({
        isDark: document.documentElement.classList.contains('dark'),
        sidebarOpen: false,      // Mobile toggle
        sidebarMini: localStorage.getItem('arisan_sidebar_mini') === 'true', // Initialize directly to prevent flicker
        openMenus: {},          // Track expanded submenus by ID

        init() {
            // Watch for theme changes
            this.$watch('isDark', value => {
                if (value) {
                    document.documentElement.classList.add('dark');
                    localStorage.theme = 'dark';
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.theme = 'light';
                }
            });

            // Persist Sidebar Mini Preference
            this.$watch('sidebarMini', val => localStorage.setItem('arisan_sidebar_mini', val));
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },

        toggleMini() {
            this.sidebarMini = !this.sidebarMini;
            // Close all submenus when ensuring mini mode to avoid floating weirdness
            if (this.sidebarMini) this.openMenus = {};
        },

        toggleSubmenu(id) {
            if (this.sidebarMini) {
                this.sidebarMini = false; // Auto expand if trying to open submenu
                setTimeout(() => {
                    this.openMenus[id] = !this.openMenus[id];
                }, 150); // Small delay for transition
            } else {
                this.openMenus[id] = !this.openMenus[id];
            }
        },

        isSubmenuOpen(id) {
            return !!this.openMenus[id];
        },

        // Helper formatting
        formatRupiah(number) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(number);
        }
    }));
});

// Global Component Logic to prevent SPA Race Conditions
window.iconPicker = function () {
    return {
        search: '',
        selected: 'users',
        icons: [
            'users', 'home', 'cog', 'bell', 'calendar', 'check', 'times',
            'search', 'plus', 'minus', 'edit', 'trash', 'save', 'download',
            'upload', 'image', 'camera', 'video', 'music', 'layer-group',
            'chart-pie', 'chart-line', 'chart-bar', 'table', 'clipboard',
            'bars-progress', 'crown', 'gift', 'wallet', 'money-bill',
            'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'dice',
            'dice-one', 'dice-two', 'dice-three', 'dice-four', 'dice-five',
            'wifi', 'battery-full', 'bolt', 'bug', 'code', 'terminal',
            'window-maximize', 'window-minimize', 'folder', 'folder-open',
            'file', 'file-alt', 'file-pdf', 'file-word', 'file-excel'
        ],
        get filteredIcons() {
            return this.icons.filter(i => i.includes(this.search.toLowerCase()));
        }
    }
}

/**
 * Highlight Sidebar Links based on current URL
 * @param {string} path - The current path to match against
 */
function updateActiveSidebar(path = window.location.pathname) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const allLinks = container.querySelectorAll('a');
    let parentMenuId = null;

    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Reset styles first
        link.classList.remove('bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400');
        link.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');

        // Check match
        if (href && href !== '#' && path.endsWith(href)) {
            // Add Active Styling
            link.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');
            link.classList.add('bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400');

            // Determine Parent Submenu
            if (href.includes('/components/')) parentMenuId = 'core';
            if (href.includes('/modules/')) parentMenuId = 'advanced';
        }
    });

    return parentMenuId;
}

/**
 * Sidebar Lazy Loader
 * Fetches the sidebar HTML and injects it into #sidebar-container.
 */
async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch('/layouts/sidebar.html');
        if (!response.ok) throw new Error('Failed to load sidebar');
        const html = await response.text();

        container.innerHTML = html;

        // Highlight Active Link
        const parentMenuId = updateActiveSidebar();

        // Initialize Alpine
        if (window.Alpine) {
            Alpine.initTree(container);
            if (parentMenuId) {
                const root = document.querySelector('[x-data="vibeApp"]');
                if (root && root._x_dataStack) root._x_dataStack[0].openMenus[parentMenuId] = true;
            }
        }

    } catch (e) {
        console.error('Sidebar Loader Error:', e);
        container.innerHTML = '<div class="p-4 text-red-500">Failed to load sidebar navigation.</div>';
    }
}

/**
 * SPA Content Loader
 * Fetches Page HTML and replaces .main-content
 */
async function loadPage(url) {
    const mainContainer = document.querySelector('.main-content');
    if (!mainContainer) {
        window.location.href = url; // Fallback if structure differs
        return;
    }

    // specific bypass for index.html/dashboard to prevent weirdness if user clicks logo
    if (url.endsWith('index.html') || url === '/') {
        // ensure we handle correctly, usually fine.
    }

    // Loading State
    mainContainer.style.opacity = '0.6';
    mainContainer.style.pointerEvents = 'none';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Page load failed');
        const text = await response.text();

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const newContent = doc.querySelector('.main-content');

        if (!newContent) throw new Error('No .main-content found in response');

        // Update Title
        document.title = doc.title;

        // Replace Content
        // We replace the node itself to capture any new x-data attributes on the container
        mainContainer.replaceWith(newContent);

        // Update URL History
        if (window.location.pathname !== url) {
            window.history.pushState(null, doc.title, url);
        }

        // Update Sidebar Active State
        updateActiveSidebar(url);

        // Execute Scripts in New Content (FIRST)
        // DOMParser scripts are not executable. We must recreate them.
        const scripts = newContent.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');

            // Copy attributes (src, type, defer, etc.)
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Copy content
            if (oldScript.innerHTML) {
                newScript.innerHTML = oldScript.innerHTML;
            }

            // Append to body (effectively executes it)
            // We append to the new content's parent or body
            document.body.appendChild(newScript);
        });

        // Init Alpine on new content (AFTER SCRIPTS)
        // Now that `window.iconPicker` and other functions are defined, Alpine can find them.
        if (window.Alpine) {
            // Wait a tick ensures scripts have fully registered functions (synchronous JS runs immediately, but good practice)
            Alpine.initTree(document.querySelector('.main-content'));
        }

    } catch (error) {
        console.error('SPA Load Error:', error);
        window.location.href = url; // Fallback to full reload
    }
}


// Initialize Loader & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();

    // SPA Navigation Interceptor
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Ignore external links, anchors, or new tabs
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || target === '_blank') return;

        // Check if host matches (internal link)
        if (link.hostname !== window.location.hostname) return;

        // Check if mapped to a file we control (rough check)
        // We only want to SPA load internal HTML pages
        if (!href.endsWith('.html') && href !== '/') return;

        e.preventDefault();
        loadPage(href);
    });

    // Handle Back/Forward Buttons
    window.addEventListener('popstate', () => {
        loadPage(window.location.pathname);
    });
});
