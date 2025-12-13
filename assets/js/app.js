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
