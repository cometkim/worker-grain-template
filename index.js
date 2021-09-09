import { WASI } from '@wasmer/wasi';
import browserBindings from '@wasmer/wasi/lib/bindings/browser';

import { WasmFs } from '@wasmer/wasmfs';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  let { stdout } = await program();

  return new Response(
    stdout,
    { headers: { 'content-type': 'text/plain' } },
  );
}

async function program() {
  let wasmFs = new WasmFs();
  let wasi = new WASI({
    bindings: {
      ...browserBindings,
      fs: wasmFs.fs,
    },
  });

  let instance = new WebAssembly.Instance(WASM_MODULE, {
    ...wasi.getImports(WASM_MODULE),
  });

  wasi.start(instance);
  let stdout = await wasmFs.getStdOut();

  return {
    stdout,
    exports: instance.exports,
  };
}
