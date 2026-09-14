import fs from "node:fs";

const example = fs.readFileSync(".env.example", "utf8");
const invalid = example
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#") && !line.startsWith("NEXT_PUBLIC_"));

if (invalid.length > 0) {
  console.error(`Non-public environment keys found: ${invalid.join(", ")}`);
  process.exit(1);
}

console.log("Public environment contract is valid.");
