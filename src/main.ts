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
    config: `### Please note that this version of Gonfique is a pre-alpha
### version and it is still under development. 
### Its design and implementation will change before release.

### Gonfique Live (where you are now) is a separate project 
### that puts Gonfique into your browser to let you try it 
### before installing to system, and it is under development 
### too.

### Use links to provide feedback on each project and ask 
### questions:
### https://github.com/ufukty/gonfique (switch dev for docs)
### https://github.com/ufukty/gonfique-live

### Toggle each comment block under rules section at once
### to switch between demos

rules:

  # "**": { export: true }

  # "**.endpoints": { export: true }
  # "**.endpoints.*": { declare: Endpoint }

  # "**.path": { declare: Path }
  # "**.endpoints.*": { declare: Endpoint }
  # "<Endpoint>.path": { replace: Path }
  # "<Endpoint>.method": { replace: "http.Method module/http" }

  # "**.path": { declare: Path }
  # "**.endpoints": { dict: map, declare: Endpoints }
  # "**.endpoints.[value]": { declare: Endpoint }
  # "<Endpoint>.path": { declare: Path }
  # "<Endpoint>.method": { replace: "http.Method module/http" }
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
        this.initWasm().then(() => {
            this.createEditors();
            this.wireActions();
            this.doConversion(); // initial generation
        });
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
                { token: "bool", foreground: "79c0ff" },
                { token: "builtin", foreground: "ffa657" },
                { token: "comment", foreground: "6a737d", fontStyle: "italic" },
                { token: "delimiter", foreground: "c9d1d9" },
                { token: "function.declaration", foreground: "d2a8ff" },
                { token: "function", foreground: "d2a8ff" },
                { token: "identifier", foreground: "c9d1d9" },
                { token: "key", foreground: "7ee787" },
                { token: "keyword", foreground: "ff7b72" },
                { token: "number", foreground: "79c0ff" },
                { token: "operator", foreground: "c9d1d9" },
                { token: "string", foreground: "a5d6ff" },
                { token: "type.identifier", foreground: "ffa657" },
                { token: "type", foreground: "ffa657" },
            ],
            colors: {
                "editor.background": "#0d1117",
                "editor.foreground": "#c9d1d9",
                "editor.lineHighlightBackground": "#161b2233",
                "editor.selectionBackground": "#24416b77",
                "editorCursor.foreground": "#c9d1d9",
                "editorIndentGuide.activeBackground": "#30363d",
                "editorIndentGuide.background": "#21262d",
                "scrollbarSlider.activeBackground": "#484f58",
                "scrollbarSlider.background": "#484f58",
                "scrollbarSlider.hoverBackground": "#484f58cc",
            },
        });

        this.editors = {
            // Initialize left editor
            input: monaco.editor.create(document.querySelector("#input-editor .editor-pane")!, {
                value: examples.input,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
            }),

            // Initialize middle editor
            config: monaco.editor.create(document.querySelector("#config-editor .editor-pane")!, {
                value: examples.config,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
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

        monaco.editor.setTheme("github-dark");
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
