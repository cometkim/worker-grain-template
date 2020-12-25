// linked via `yarn link @grain/runtime`
// also need a few modification to resolve module name conflict
import { GrainModule } from '@grain/runtime/src/core/grain-module';
import { buildGrainRunner } from '@grain/runtime';

// const external = {
//   'stdlib-external/runtime': Buffer.from(__RUNTIME_STDLIB_EXTERNAL, 'base64'),
// };

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  // FIXME: custom locator...?
  const runner = buildGrainRunner();

  // `wasm` is a WebAssembly.Module object injected by Wrangler
  const mod = new GrainModule(wasm, 'main');
  // This gonna fail because the Grain module has external dependency: stdlib-external/*
  await runner.load('main', mod);

  // However, the Wrangler does load *a single asset* with the wasm extension.
  // So we cannot use URI locator for this case.
  //
  // I had also tried to inject external runtime via webpack define plugin
  //  for (const [name, buffer] of Object.entries(external)) {
  //    await runner.loadBuffer(name, buffer);
  //  }
  // But got this error:
  //   WebAssembly.compile(): Wasm code generation disallowed by embedder
  // Because Cloudflare workers doesn't allow dynamic assets for the security concerns.

  return new Response(
    // This is what we want to do:
    mod.exports.greet(),
    { headers: { 'content-type': 'text/plain' } },
  );
}
