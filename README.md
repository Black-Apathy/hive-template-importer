# Hive Template Importer

A small web application that imports exported Spectora inspection templates into a structured, editable backend model.

## Live Demo

- Frontend: https://hive-template-importer-nine.vercel.app/
- Backend: https://hive-template-importer.onrender.com

No login is required.

The live demo is seeded with the committed Spectora sample export.

## What it does

The importer accepts a Spectora `Export HTML Text` `.xls` export and preserves:

- Template → Section → Subsection → Field hierarchy
- Original ordering
- Field/comment names
- Comment text, including HTML content
- Comment type
- Categories
- Answer types supported by the importer
- Multiple-choice options
- Unit options
- Recommendations
- Default values and units
- Estimate ranges
- Field settings
- Default photo references and captions

Imported templates can then be:

- Viewed in the template library
- Edited at section, subsection, and field level
- Saved to the database
- Duplicated as independent copies

Unsupported content is surfaced as an import warning rather than silently discarded.

## Architecture

```text
React + Vite
      │
      │ HTTP
      ▼
Node + Express + TypeScript
      │
      ├── Spectora XLS parser
      ├── Import validation/issues
      └── Prisma
             │
             ▼
        PostgreSQL / Supabase
```

## Data model

Imported templates are stored as structured relational data rather than as an opaque spreadsheet or HTML blob.

```text
Template
└── Section
    └── Subsection
        └── Field
            └── Photo
```

Import problems are stored separately as `ImportIssue` records.

See [DESIGN.md](./DESIGN.md) for the full data model.

## Running locally

### Requirements

- Node.js
- PostgreSQL
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Black-Apathy/hive-template-importer.git
cd hive-template-importer
```

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL=<your PostgreSQL connection string>
DIRECT_URL=<your PostgreSQL direct connection string>
```

Do not commit real database credentials.

### 3. Install and run the backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run build
npm start
```

The backend uses port `3000` locally by default. Set `PORT` to override it.

### 4. Configure and run the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Then:

```bash
cd ../frontend
npm install
npm run dev
```

Open the Vite development URL shown in the terminal.

## Sample data

A committed Spectora export is provided at:

```text
sample-data/Residential Template-2026-09-14.xls
```

Upload it through the **Import a Spectora template** section of the application.

The sample imports as:

- 13 sections
- 69 subsections
- 392 fields

## Verification

The repository includes a parser-level verification script:

```bash
cd backend
npx tsx src/scripts/verify-import.ts
```

The verification checks:

- Section preservation and ordering
- Subsection preservation
- Field preservation
- Field names
- Comment text
- Comment types
- Categories
- Answer types
- Multiple-choice options
- Unit options
- Recommendations
- Default values
- Estimate ranges
- Rich HTML content
- Import issues

The committed clean export passes **5,886 verification checks** with zero import issues.

A separate script can generate a failure-case export containing an unsupported answer type:

```bash
npx tsx src/scripts/create-failure-test.ts
```

The importer surfaces unsupported content as an explicit warning instead of silently dropping it.

## Repository structure

```text
.
├── backend/
│   ├── prisma/
│   └── src/
│       ├── importer/
│       ├── lib/
│       └── scripts/
├── frontend/
│   └── src/
├── sample-data/
│   └── Residential Template-2026-09-14.xls
├── DESIGN.md
├── README.md
└── NOTES.md
```

## Environment files

Example environment files are provided at:

```text
backend/.env.example
frontend/.env.example
```

Real credentials and environment files are excluded from version control.

## Implementation notes

See [NOTES.md](./NOTES.md) for implementation decisions, supported input, limitations, verification results, AI-assisted development, and intentionally omitted features.
