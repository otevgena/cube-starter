/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#fbbf24",   // акцент
        ink: "#222222",    // основной текст
        page: "#f8f8f8",   // фон страницы
        field: "#e9e9e9",  // фон поля поиска
        line: "#e5e5e5",   // тонкие границы/разделители
        dark: "#111111",   // тёмные кнопки/логотип
      },
      fontFamily: {
        // основной шрифт проекта (грузится в index.html)
        tight: ['"Inter Tight"', "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      maxWidth: {
        container: "1280px", // общий контейнер страницы
      },
      height: {
        header: "64px",
      },
      keyframes: {
        svcfade: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        svcfade: "svcfade 0.18s ease-out",
      },
    },
  },
  plugins: [],
}
