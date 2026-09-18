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

const comments = rows
  .map((row) => row["Comment Text"])
  .filter((value) => typeof value === "string" && value.trim() !== "");

console.log(`Non-empty comments: ${comments.length}`);
console.log("\nFirst 10 comments:");

for (const comment of comments.slice(0, 10)) {
  console.log("\n---");
  console.log(comment);
}
