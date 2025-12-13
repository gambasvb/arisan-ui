/**
 * Vibe UI Template - Tailwind Configuration
 * Defines design tokens, color palette, and dark mode strategy.
 */

tailwind.config = {
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Professional font
            },
            colors: {
                // Vibe Brand Colors (Purple)
                brand: {
                    50: '#f5f3ff', // very light purple
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6', // primary purple
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                // Dark Mode Backgrounds
                dark: {
                    bg: '#0f172a',      // Slate 900
                    surface: '#1e293b', // Slate 800
                    border: '#334155',  // Slate 700
                }
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'bounce-slow': 'bounce 3s infinite',
            }
        }
    }
}

// Apply saved theme on load
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
} else {
    document.documentElement.classList.remove('dark')
}

// Function to toggle theme manually
function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}
