const allowedProjectName = "deoki-happy-bank";
const allowedProductionUrl = "deoki-happy-bank.vercel.app";

const projectName = String(process.env.VERCEL_PROJECT_NAME ?? "").trim().toLowerCase();
const productionUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "")
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

if (!projectName && !productionUrl) {
  console.log("No Vercel project metadata found. Continuing build.");
  process.exit(1);
}

if (projectName === allowedProjectName || productionUrl === allowedProductionUrl) {
  console.log(`Continuing build for ${projectName || productionUrl}.`);
  process.exit(1);
}

console.log(`Skipping build for ${projectName || productionUrl}; production URL is fixed to ${allowedProductionUrl}.`);
process.exit(0);
