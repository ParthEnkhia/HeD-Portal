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
          coralDark: "#f0a17e",
          ink: "#f4f0ec",
          muted: "#a8a09a",
          line: "#2f2b29",
          paper: "#171514",
          wash: "#0f0e0d",
          blush: "#261b17",
          input: "#11100f"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};
