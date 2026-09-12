// Next 16's static export writes per-segment prefetch data into nested folders
//   out/shop/__next.!KHNob3Ap/shop/__PAGE__.txt
// but the client router requests the flat name
//   /shop/__next.!KHNob3Ap.shop.__PAGE__.txt
// so on a plain static host every link prefetch 404s (navigation still works,
// just slower). This copies each nested file to the name the client asks for.
// It only adds files, so it is harmless if a later Next version fixes the layout.

import { copyFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
let copied = 0;

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesIn(p) : [p];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory() || name === "_next") continue;
    if (name.startsWith("__next.")) {
      for (const file of filesIn(p)) {
        const flat = `${name}.${relative(p, file).split(sep).join(".")}`;
        copyFileSync(file, join(dir, flat));
        copied++;
      }
    } else {
      walk(p);
    }
  }
}

walk(OUT);
console.log(`flatten-segments: ${copied} prefetch file(s) copied to flat names`);
