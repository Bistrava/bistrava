import { access, cp } from "node:fs/promises";
import { resolve } from "node:path";

// Next traces server dependencies but leaves public and static assets separate.
const output = resolve(".next/standalone");
await access(resolve(output, "server.js"));
await Promise.all([
  cp(resolve("public"), resolve(output, "public"), { recursive: true }),
  cp(resolve(".next/static"), resolve(output, ".next/static"), { recursive: true }),
]);
console.log("Standalone server and public assets are ready in .next/standalone.");
