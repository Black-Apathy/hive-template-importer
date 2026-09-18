import XLSX from "xlsx";
import { parseSpectora } from "../importer/parseSpectora.js";
import { createTemplate } from "./repositories/templateRepository.js";

async function main() {
  const workbook = XLSX.readFile(
    "../sample-data/Residential Template-2026-09-14.xls",
  );

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("No worksheet found in the spreadsheet.");
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" could not be loaded.`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  const template = parseSpectora(rows, "Residential Template");

  const savedTemplate = await createTemplate(template);

  console.log("Saved template:", savedTemplate.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
