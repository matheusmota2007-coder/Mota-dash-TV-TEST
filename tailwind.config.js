/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'mota-dark': '#0a0e19', // Cor de fundo do seu dashboard original
                'mota-panel': '#1e293b', // Cor dos containers
            },
        },
    },
    plugins: [],
}