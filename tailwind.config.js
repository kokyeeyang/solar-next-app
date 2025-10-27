/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ for App Router structure
    "./components/**/*.{js,ts,jsx,tsx}", // ✅ Add this line
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
      },
      zIndex: {
        9999: "9999",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeOut: {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(0.95)' },
        },
      },
    },
  },
  safelist: [
    'z-[9999]',
    'z-[9999px]',
    'fixed',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'bg-red-600',
    'bg-stone-600',
    'bg-black',
    'bg-opacity-80',
    'h-[400px]',
    'max-h-[400px]', // Add any others you're testing
    'overflow-y-scroll',
    'overflow-y-auto',
    'w-[359px]',
    'bg-green-900',
    'h-16',
    'w-16',
     'absolute',
    'z-10',
    'z-20',
    'z-50',
    'left-0',
    'right-0',
    'top-full',
    'mt-1',
    'bg-white',
    'bg-gray-700',
    'dark:bg-gray-800',
    'text-black',
    'text-white',
    'ring-1',
    'ring-black/5',
    'overflow-auto',
    'max-h-60',
    'rounded-md',
    'shadow-lg',
    'focus:outline-none',
  ],
  // safelist: [{ pattern: /./ }], // Keep all classes
  plugins: [],
};
