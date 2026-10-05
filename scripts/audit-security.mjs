import { execSync } from "node:child_process";

const acceptedDevTooling = new Set([
  "@next/eslint-plugin-next",
  "braces",
  "chokidar",
  "eslint-config-next",
  "fast-glob",
  "micromatch",
  "tailwindcss",
]);

function audit(args = []) {
  const command = ["npm", "audit", "--json", ...args].join(" ");
  const cleanEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith("npm_")),
  );
  try {
    const stdout = execSync(command, {
      encoding: "utf8",
      env: cleanEnv,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (!error.stdout) {
      throw error;
    }
    return JSON.parse(error.stdout.toString("utf8"));
  }
}

function countHighOrCritical(report) {
  const vulnerabilities = report.metadata?.vulnerabilities ?? {};
  return (vulnerabilities.high ?? 0) + (vulnerabilities.critical ?? 0);
}

const productionReport = audit(["--omit=dev", "--audit-level=high"]);
const productionHighOrCritical = countHighOrCritical(productionReport);

if (productionHighOrCritical > 0) {
  console.error("Production npm audit failed.");
  console.error(JSON.stringify(productionReport.metadata?.vulnerabilities ?? {}, null, 2));
  process.exit(1);
}

const fullReport = audit(["--include=dev", "--audit-level=high"]);
const vulnerabilities = fullReport.vulnerabilities ?? {};
const highOrCriticalNames = Object.entries(vulnerabilities)
  .filter(([, vulnerability]) => ["high", "critical"].includes(vulnerability.severity))
  .map(([name]) => name)
  .sort();

const unexpected = highOrCriticalNames.filter((name) => !acceptedDevTooling.has(name));

if (unexpected.length > 0) {
  console.error("Unexpected high/critical npm audit findings:");
  for (const name of unexpected) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log("Production npm audit: 0 high/critical.");
console.log(
  "Accepted dev-tooling audit findings:",
  highOrCriticalNames.length === 0 ? "none" : highOrCriticalNames.join(", "),
);
console.log(
  "Risk note: current high findings are build/lint tooling only. Do not ship devDependencies in runtime images.",
);
