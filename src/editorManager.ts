import * as monaco from "monaco-editor";
import { examples } from "./examples";
import { debounce } from "./debounce";

declare const Go: any;

declare function Convert(input: string, inputMode: string, config: string): [string, string];

const buildURL = "gonfique-wasm/v2.0.0-pre-alpha-11-g5e534d7.wasm";

export class EditorManager {
    private editors: {
        input: monaco.editor.IStandaloneCodeEditor;
        config: monaco.editor.IStandaloneCodeEditor;
        output: monaco.editor.IStandaloneCodeEditor;
    } | null = null;

    private wasmInitialized = false;

    constructor() {
        this.initWasm().then(() => {
            this.createEditors();
            this.addListeners();
            this.update();
        });
    }

    private async initWasm(): Promise<void> {
        const go = new Go();
        try {
            const response = await fetch(buildURL);
            const bytes = await response.arrayBuffer();
            const result = await WebAssembly.instantiate(bytes, go.importObject);
            go.run(result.instance);
            this.wasmInitialized = true;
            console.log("WASM loaded and running.");
        } catch (err) {
            console.error("Error loading WASM:", err);
        }
    }

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

        monaco.editor.defineTheme("github-light", {
            base: "vs",
            inherit: true,
            rules: [
                { token: "", foreground: "24292f", background: "ffffff" },
                { token: "bool", foreground: "0550ae" },
                { token: "builtin", foreground: "953800" },
                { token: "comment", foreground: "6e7781", fontStyle: "italic" },
                { token: "delimiter", foreground: "24292f" },
                { token: "function.declaration", foreground: "8250df" },
                { token: "function", foreground: "8250df" },
                { token: "identifier", foreground: "24292f" },
                { token: "key", foreground: "116329" },
                { token: "keyword", foreground: "cf222e" },
                { token: "number", foreground: "0550ae" },
                { token: "operator", foreground: "24292f" },
                { token: "string", foreground: "0a3069" },
                { token: "type.identifier", foreground: "953800" },
                { token: "type", foreground: "953800" },
            ],
            colors: {
                "editor.background": "#ffffff",
                "editor.foreground": "#24292f",
                "editor.lineHighlightBackground": "#eaeef280",
                "editor.selectionBackground": "#9cd1ff66",
                "editorCursor.foreground": "#24292f",
                "editorIndentGuide.activeBackground": "#d0d7de",
                "editorIndentGuide.background": "#eaeef2",
                "scrollbarSlider.activeBackground": "#8c959f",
                "scrollbarSlider.background": "#8c959f",
                "scrollbarSlider.hoverBackground": "#8c959fcc",
            },
        });

        this.editors = {
            input: monaco.editor.create(document.querySelector("#input-editor .editor-pane")!, {
                value: examples.input,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
                tabSize: 2,
            }),

            config: monaco.editor.create(document.querySelector("#config-editor .editor-pane")!, {
                value: examples.config,
                language: "yaml",
                automaticLayout: true,
                minimap: { enabled: false },
                tabSize: 2,
            }),

            output: monaco.editor.create(document.querySelector("#output-editor .editor-pane")!, {
                language: "go",
                readOnly: true,
                automaticLayout: true,
                minimap: { enabled: false },
                tabSize: 2,
            }),
        };

        this.applyTheme(this.getPreferredTheme());
        this.watchSystemThemeChanges();
    }

    private applyTheme(name: "github-dark" | "github-light") {
        monaco.editor.setTheme(name);
    }

    private getPreferredTheme(): "github-dark" | "github-light" {
        // If you also support a manual toggle, check localStorage first.
        const stored = localStorage.getItem("theme"); // "dark" | "light" | null
        if (stored === "dark") return "github-dark";
        if (stored === "light") return "github-light";

        // Fallback to OS preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "github-dark" : "github-light";
    }

    private watchSystemThemeChanges() {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        // modern browsers
        media.addEventListener("change", (e) => {
            const stored = localStorage.getItem("theme");
            // Only react to system changes if user hasn’t explicitly chosen a theme
            if (!stored) this.applyTheme(e.matches ? "github-dark" : "github-light");
        });
    }

    private addListeners(): void {
        const debouncedAutoConvert = debounce(() => this.update(), 500);
        this.editors?.input.onDidChangeModelContent(() => debouncedAutoConvert());
        this.editors?.config.onDidChangeModelContent(() => debouncedAutoConvert());
    }

    private update(): void {
        if (!this.wasmInitialized) {
            console.warn("WASM not loaded yet. Skipping conversion...");
            return;
        }

        const inputContent = this.editors?.input.getValue() || "";
        const configContent = this.editors?.config.getValue() || "";
        const inputMode = "yaml";

        try {
            const [output, error] = Convert(inputContent, inputMode, configContent);

            if (error) {
                console.error("Error calling WASM Convert:", error);
                this.editors?.output.setValue("// Error: " + error);
            } else {
                this.editors?.output.setValue(output);
            }
        } catch (err: any) {
            console.error("Unexpected error calling WASM Convert:", err);
            this.editors?.output.setValue("// Error: " + err.toString());
        }
    }
}
