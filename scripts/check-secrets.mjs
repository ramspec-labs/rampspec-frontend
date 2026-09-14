import fs from "node:fs";
import path from "node:path";

const ignored = new Set([".git", "node_modules", ".next", "pnpm-lock.yaml"]);
const secretPattern = /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(?:password|secret|token)\s*[:=]\s*['"][^'"]{12,})/i;
const roots = ["src", "scripts", "README.md", "CONTRIBUTING.md", "SECURITY.md"];
const files = [];

function collect(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) { files.push(target); return; }
  for (const entry of fs.readdirSync(target)) {
    if (!ignored.has(entry)) collect(path.join(target, entry));
  }
}

roots.forEach(collect);
const matches = files.filter((file) => file !== path.join("scripts", "check-secrets.mjs")).flatMap((file) => {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  return lines.flatMap((line, index) => secretPattern.test(line) ? [`${file}:${index + 1}`] : []);
});

if (matches.length) {
  console.error(`Potential secret pattern found at ${matches.join(", ")}`);
  process.exit(1);
}
console.log(`Scanned ${files.length} frontend files for secret patterns.`);
