/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" }, // 히스토리/리스트 페이지 폭 통일
    },
    extend: {
      fontFamily: {
        sans: ["'Noto Sans KR'", "system-ui", "sans-serif"],
      },
      colors: {
        // 🔵 공공사이트 톤(딥 블루) 팔레트: gov-950 ~ gov-50
        gov: {
          50:  "#f2f6fb",
          100: "#e6edf8",
          200: "#c5d7ee",
          300: "#a3c1e5",
          400: "#6e9fd6",
          500: "#387dcc",
          600: "#1f5fae",
          700: "#174a86",
          800: "#0f3560",
          900: "#0a2747",
          950:"#081b31",
        },
        accent: {
          50:  "#eef6ff",
          100: "#d9ecff",
          200: "#b6d8ff",
          300: "#8dc2ff",
          400: "#5baeff",
          500: "#2ea3ff",  // 포인트(버튼/링크 hover)
          600: "#1a8ae6",
          700: "#166fba",
          800: "#145c98",
          900: "#124e80",
        },
        success: "#16a34a",
        warning: "#f59e0b",
        danger:  "#dc2626",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,.06)", // 카드/모달 전용
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),       // 입력폼 일관화
    require("@tailwindcss/typography"),  // 리치 텍스트(답변 본문 등)
  ],
};
