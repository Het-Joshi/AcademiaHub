// postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // This is the correct package name
    autoprefixer: {},
  },
};

export default config;