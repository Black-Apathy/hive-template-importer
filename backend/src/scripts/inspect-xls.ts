import path from "node:path";
import XLSX from "xlsx";

const filePath = path.resolve(
  "../sample-data/Residential Template-2026-09-14.xls",
);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];

if (!sheetName) {
  throw new Error("No sheets found in workbook");
}

const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  throw new Error(`Sheet "${sheetName}" not found`);
}

const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
  defval: null,
});

function uniqueValues(column: string) {
  const values = new Set(
    rows
      .map((row) => row[column])
      .filter((value) => value !== null && value !== ""),
  );

  console.log(`\n${column}:`);
  console.dir([...values], { depth: null });
}

uniqueValues("Comment Type (info, limit, defect)");
uniqueValues("Category (-1: Low, 0: Med, 1: High)");
uniqueValues("Answer Type (boolean, checkbox, date, number, range, text)");
