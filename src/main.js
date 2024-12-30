// src/main.js

import * as monaco from "monaco-editor"; // from node_modules
// If you want to apply special configs, you can do so here, or rely on default

// We'll keep references to our three editors
let editorLeft, editorMiddle, editorRight;

// A "global" Go instance (from wasm_exec.js) and a WASM init flag
const go = new Go();
let wasmInitialized = false;

var examples = {
    input: `domain: localhost
gateways:
  public:
    path: /api/v1.0.0
    services:
      document:
        path: document
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
          patch: { method: "PATCH", path: "/" }
      objectives:
        path: tasks
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
          patch: { method: "PATCH", path: "/" }
          put: { method: "PUT", path: "/" }
      tags:
        path: tags
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
`,
    config: `meta:
  type: Config

rules:
  "**": { export: true }

  "**.objectives.endpoints": { declare: ObjectivesEndpoints }
  "<ObjectivesEndpoints>": { iterator: true }
  "<ObjectivesEndpoints>.*": { declare: Endpoint }

  "**.tags.endpoints": { declare: TagsEndpoints }
  "<TagsEndpoints>": { iterator: true }
  "<TagsEndpoints>.*": { declare: Endpoint }

  "**.document.endpoints": { declare: DocumentEndpoints }
  "<DocumentEndpoints>": { iterator: true }
  "<DocumentEndpoints>.*": { declare: Endpoint }

  "<Endpoint>": { accessors: ["method", "path"] }
  "<Endpoint>.method": { replace: http.Method test/http }
`,
};
/**
 * Initialize WASM:
 *   1. Fetch converter.wasm
 *   2. Instantiate and run with Go
 *   3. Expose "Convert" function globally
 */
async function initWasm() {
    try {
        const response = await fetch("./wasm-builds/main.wasm");
        const bytes = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(bytes, go.importObject);
        go.run(result.instance);
        wasmInitialized = true;
        console.log("WASM loaded and running.");
    } catch (err) {
        console.error("Error loading WASM:", err);
    }
}

function createEditors() {
    monaco.editor.defineTheme("github-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "", foreground: "c9d1d9", background: "0d1117" },
            { token: "comment", foreground: "6a737d" },
            { token: "keyword", foreground: "7ee787" },
            { token: "number", foreground: "79c0ff" },
            { token: "string", foreground: "a5d6ff" },
            { token: "identifier", foreground: "c9d1d9" },
            { token: "key", foreground: "7ee787" },
            // Add more custom rules as needed...
        ],
        colors: {
            "editor.background": "#0d1117",
            "editor.foreground": "#c9d1d9",
            "editor.lineHighlightBackground": "#161b2233",
            "editor.selectionBackground": "#24416b77",
            "editorCursor.foreground": "#c9d1d9",
            "editorIndentGuide.background": "#21262d",
            "editorIndentGuide.activeBackground": "#30363d",
        },
    });

    // Create the left editor for user input
    editorLeft = monaco.editor.create(document.getElementById("input-editor"), {
        value: examples.input,
        language: "yaml",
        automaticLayout: true,
        minimap: { enabled: false },
        theme: "github-dark",
    });

    // Middle editor for optional configuration
    editorMiddle = monaco.editor.create(document.getElementById("config-editor"), {
        value: examples.config,
        language: "yaml",
        automaticLayout: true,
        minimap: { enabled: false },
    });

    // Right editor for output (read-only)
    editorRight = monaco.editor.create(document.getElementById("output-editor"), {
        value: "// Output will appear here.",
        language: "go",
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
    });
}

function wireActions() {
    const convertBtn = document.getElementById("convertBtn");
    convertBtn.addEventListener("click", () => {
        if (!wasmInitialized) {
            alert("WASM not loaded yet. Please wait...");
            return;
        }

        // Grab content from the left and middle editors
        const inputContent = editorLeft.getValue();
        const configContent = editorMiddle.getValue();
        const inputMode = document.getElementById("fileFormat").value; // "json" or "yaml"

        try {
            // "Convert" is assumed to be a global function exported by the WASM code
            const result = Convert(inputContent, inputMode, configContent);
            editorRight.setValue(result);
        } catch (err) {
            console.error("Error calling WASM Convert:", err);
            editorRight.setValue("// Error: " + err.toString());
        }
    });
}

// On page load, create editors and init WASM
window.addEventListener("DOMContentLoaded", () => {
    createEditors();
    initWasm();
    wireActions();
});

let editorInstance;

// // Load Monaco
// require(["vs/editor/editor.main"], function () {
//     editorInstance = monaco.editor.create(document.getElementById("editors"), {
//         value: "// Type some JSON, YAML, or code here",
//         language: "json", // initial language
//         automaticLayout: true,
//         minimap: { enabled: false },
//     });

//     // Grab the <select> element
//     const languageSelect = document.getElementById("languageSelect");
//     // When user changes the select, switch the editor language
//     languageSelect.addEventListener("change", function () {
//         const newLang = this.value;
//         // Switch the first editor's language
//         monaco.editor.setModelLanguage(editorInstance.getModel(), newLang);
//     });
// });

function handleLanguageChange(event) {
    const selectedLang = event.target.value;
    console.log("Language changed to:", selectedLang);
    // Call whatever function you need here
    // yourFunction(selectedLang);
}
