export default {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,jsx}"]
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          coral: "#e88964",
          coralDark: "#d66f4c",
          ink: "#46464a",
          muted: "#74706d",
          line: "#eadbd4",
          paper: "#fffdfb",
          wash: "#faf6f3",
          blush: "#fff1eb"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(70, 70, 74, 0.10)"
      }
    }
  },
  plugins: []
};
