/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        campus: {
          dark: '#080C14',     // Deepest background
          card: '#0F172A',     // Card surface
          cardHover: '#131F37',// Interactive card hover
          border: '#1E293B',   // Tasteful border
          borderHover: '#334155',
          muted: '#94A3B8',    // Subdued text
          primary: '#6366F1',  // Indigo primary
          primaryHover: '#4F46E5',
          secondary: '#8B5CF6',// Violet accent
          accent: '#06B6D4',   // Cyan touch
          success: '#10B981',  // Emerald
          warning: '#F59E0B',  // Amber
          danger: '#EF4444',   // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(99, 102, 241, 0.15)',
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.25)',
      }
    },
  },
  plugins: [],
}
