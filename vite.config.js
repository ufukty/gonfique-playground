// vite.config.js
export default {
  root: "src",
  base: "./",
  server: {
    port: 3000,
  },
  build: {
    outDir: "../build",
    rollupOptions: {
      input: {
        main: "./src/index.html",
        privacyPolicy: "./src/privacy-policy.html",
      },
    },
  },
};
