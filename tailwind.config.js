/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],  // Allows dark mode when the 'dark' class is added
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',  // Include ts/tsx files for full compatibility
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',  // Ensure 'lib' folder is included too
  ],
  prefix: "",  // No prefix needed, you can remove this line if not using a custom one
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],  // Ensure this plugin is installed
}
