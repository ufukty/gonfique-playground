// vite.config.js
export default {
    root: "src",
    base: "./",
    server: {
        port: 3000,
    },
    build: {
        outDir: "../build", // Build output goes outside "src"
    },
};
