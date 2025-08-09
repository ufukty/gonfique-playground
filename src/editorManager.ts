import * as monaco from "monaco-editor";
import { examples } from "./examples";
import { debounce } from "./debounce";
import { githubDarkTheme, githubLightTheme } from "./monacoThemes";

declare const Go: any;

declare function Convert(input: string, inputMode: string, config: string): [string, string];

const buildURL = "gonfique-wasm/v2.0.0-pre-alpha-11-g5e534d7.wasm";

export class EditorManager {
  private editors: {
    input: monaco.editor.IStandaloneCodeEditor;
    config: monaco.editor.IStandaloneCodeEditor;
    output: monaco.editor.IStandaloneCodeEditor;
  } | null = null;
  private colorSchemeWatcher: MediaQueryList;
  private wasmInitialized = false;

  constructor() {
    this.colorSchemeWatcher = window.matchMedia("(prefers-color-scheme: dark)");
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
    monaco.editor.defineTheme("github-dark", githubDarkTheme);
    monaco.editor.defineTheme("github-light", githubLightTheme);

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

    this.applyTheme();
  }

  private applyTheme() {
    monaco.editor.setTheme(this.colorSchemeWatcher.matches ? "github-dark" : "github-light");
  }

  private addListeners(): void {
    const debouncedAutoConvert = debounce(() => this.update(), 500);
    this.editors?.input.onDidChangeModelContent(() => debouncedAutoConvert());
    this.editors?.config.onDidChangeModelContent(() => debouncedAutoConvert());
    this.colorSchemeWatcher.addEventListener("change", this.applyTheme.bind(this));
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
