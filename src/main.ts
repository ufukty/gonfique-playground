import * as monaco from "monaco-editor";

/**
 * Debounce utility function.
 *
 * @param func The function that should be debounced.
 * @param wait The number of milliseconds to wait before calling `func`.
 * @returns A debounced version of `func`.
 */
function debounce<T extends (...args: any[]) => void>(func: T, wait = 300) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function debouncedFunction(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

// Declare the WebAssembly Go interface (from wasm_exec.js)
declare const Go: any;

// Declare global WASM functions exposed by the Go module
declare function Convert(input: string, inputMode: string, config: string): [string, string];

let examples = {
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

// EditorManager Class
class EditorManager {
    private editors: {
        input: monaco.editor.IStandaloneCodeEditor;
        config: monaco.editor.IStandaloneCodeEditor;
        output: monaco.editor.IStandaloneCodeEditor;
    } | null = null;

    private wasmInitialized = false;

    private debouncedAutoConvert = debounce(() => this.doConversion(), 500);

    constructor() {
        this.initWasm();
        this.createEditors();
        this.wireActions();
    }

    /**
     * Initialize WebAssembly.
     */
    private async initWasm(): Promise<void> {
        const go = new Go();
        try {
            const response = await fetch("./wasm-builds/gonfique-v2.0.0-pre-alpha-9-gfd86104-js-wasm");
            const bytes = await response.arrayBuffer();
            const result = await WebAssembly.instantiate(bytes, go.importObject);
            go.run(result.instance);
            this.wasmInitialized = true;
            console.log("WASM loaded and running.");
        } catch (err) {
            console.error("Error loading WASM:", err);
        }
    }

    /**
     * Create Monaco Editor instances and set their configurations.
     */
    private createEditors(): void {
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

        this.editors = {
            // Initialize left editor
            input: monaco.editor.create(document.querySelector("#input-editor .editor-pane")!, {
                value: examples.input,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
                theme: "github-dark",
            }),

            // Initialize middle editor
            config: monaco.editor.create(document.querySelector("#config-editor .editor-pane")!, {
                value: examples.config,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
                theme: "github-dark",
            }),

            // Initialize right editor (read-only)
            output: monaco.editor.create(document.querySelector("#output-editor .editor-pane")!, {
                value: "// Output will appear here.",
                language: "go",
                readOnly: true,
                automaticLayout: true,
                minimap: { enabled: false },
            }),
        };
    }

    /**
     * Wire up actions like button clicks and live updates.
     */
    private wireActions(): void {
        const convertBtn = document.getElementById("convertBtn");
        convertBtn?.addEventListener("click", this.handleConvertClick.bind(this));

        // 2) Use the debounced function in the change event
        this.editors?.input.onDidChangeModelContent(() => this.debouncedAutoConvert());
        this.editors?.config.onDidChangeModelContent(() => this.debouncedAutoConvert());
    }

    private handleConvertClick(): void {
        this.doConversion();
    }

    private doConversion(): void {
        if (!this.wasmInitialized) {
            console.warn("WASM not loaded yet. Skipping conversion...");
            return;
        }

        const inputContent = this.editors?.input.getValue() || "";
        const configContent = this.editors?.config.getValue() || "";
        const inputMode = "yaml";

        try {
            // Destructure the two-return-values from Convert
            const [output, error] = Convert(inputContent, inputMode, configContent);

            // If there's an error, display it and log it
            if (error) {
                console.error("Error calling WASM Convert:", error);
                this.editors?.output.setValue("// Error: " + error);
            } else {
                // Otherwise set the output editor’s content
                this.editors?.output.setValue(output);
            }
        } catch (err: any) {
            // Catch any unexpected runtime exceptions
            console.error("Unexpected error calling WASM Convert:", err);
            this.editors?.output.setValue("// Error: " + err.toString());
        }
    }
}

// Initialize the EditorManager on page load
window.addEventListener("DOMContentLoaded", () => {
    new EditorManager();
});
