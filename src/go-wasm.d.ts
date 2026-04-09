declare class Go {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

declare function Convert(input: string, inputMode: string, config: string): [string, string];
