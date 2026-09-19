# Implementation Notes

## 1. Assignment Scope

This project implements a Spectora template importer for Hive Inspect.

The goal was to import a Spectora `Export HTML Text` spreadsheet into a structured, editable template model while preserving the source hierarchy, ordering, field data, and comment content.

The implementation focuses on the core importer workflow and the specific requirements described in the assignment rather than attempting to build a complete inspection-reporting system.

## 2. Supported Input

The importer currently accepts Spectora `Export HTML Text` `.xls` exports.

The committed sample input is:

`sample-data/Residential Template-2026-09-14.xls`

The implementation was developed and verified against this export.

The importer preserves:

- Template → Section → Subsection → Field hierarchy
- Original ordering
- Field names
- Comment names/text
- Comment types
- Categories
- Multiple-choice options
- Unit options
- Recommendations
- Default values and units
- Estimate ranges
- Field settings
- Default photo references and captions

Comment HTML is preserved as source content rather than stripped or rewritten. HTML is sanitized before rendering in the frontend.

## 3. Data Model

The imported template is stored as structured relational data rather than as an opaque copy of the source spreadsheet.

The main entities are:

- `Template`
- `Section`
- `Subsection`
- `Field`
- `Photo`
- `ImportIssue`

The hierarchy is represented through foreign-key relationships:

```text
Template
  └── Section
       └── Subsection
            └── Field
                 └── Photo
```

Import issues are associated with the template so that problems encountered during import remain visible after the import completes.

## 4. Import Mapping

The Spectora spreadsheet is parsed row by row.

Section and subsection names are used to construct the hierarchy, while field-level columns are mapped into the structured `Field` model.

The importer explicitly handles supported answer types and source values instead of treating the entire spreadsheet as an opaque document.

The importer currently supports these answer types:

- `boolean`
- `checkbox`
- `number`
- `text`

Other answer types are reported as unsupported rather than silently converted.

## 5. Preservation and Failure Handling

A key design decision was to distinguish between content that is absent from the source export and content that the importer does not currently support.

Two issue types are recorded:

- `missing_from_export`
- `unsupported_by_importer`

Rows missing required hierarchy information are reported as missing from the export and skipped.

Rows containing an answer type that the importer does not currently support are reported as unsupported.

This makes import limitations visible instead of silently dropping or inventing content.

## 6. Verification

The committed sample export was used as the baseline for verification.

The importer verification checks:

- Section count and ordering
- Subsection count and ordering
- Field count and ordering
- Field names
- Comment content
- Comment types
- Categories
- Answer types
- Multiple-choice options
- Unit options
- Recommendations
- Default values and units
- Estimate ranges
- Preservation of HTML-containing comments
- Import issue count

The final verification result was:

- 13 sections preserved
- 69 subsections preserved
- 392 fields preserved
- 5,886 verification checks passed
- 0 import issues for the clean source export

The verification script is located at:

`backend/src/scripts/verify-import.ts`

## 7. Deliberate Failure Test

I also created a modified copy of the source export with an otherwise supported field changed to an unsupported answer type (`date`).

The importer did not silently drop the field. Instead, the import completed with a visible warning identifying:

- the issue as unsupported content
- the source row
- the section/subsection/field location
- the unsupported answer type

This was used to verify the failure path independently from the clean import.

## 8. Editing and Persistence

Imported templates can be edited at:

- Section level
- Subsection level
- Field level
- Comment level

Changes are stored in PostgreSQL rather than only in frontend state.

The implementation was tested by editing sections, subsections, fields, and comment content, refreshing the application, and reopening the template.

HTML comment content was also tested using:

`<b>Hello World</b>`

The formatting was preserved and rendered safely after reload.

## 9. Template Duplication

Templates can be duplicated as independent copies.

The duplicate receives its own database records and can be edited without modifying the original template.

This was tested by modifying a duplicated template and verifying that the original remained unchanged.

## 10. Performance

The initial implementation used many individual database operations when creating and duplicating large templates.

This was replaced with bulk inserts and transactions.

Approximate local measurements:

- Template creation: ~40.5s → ~4.8s
- Template duplication: ~51.4s → ~5.5s

Template library counts were also moved to a PostgreSQL aggregation query rather than loading the complete hierarchy into application memory.

## 11. AI-Assisted Development

AI coding tools were used during development, as permitted by the assignment.

AI assistance was used for implementation support, debugging, code review, and exploring implementation approaches.

The importer itself does not rely on an LLM to decide how source rows should be mapped. Mapping is deterministic and based on explicit source columns and supported values.

This was intentional because deterministic mapping makes preservation and failure behavior easier to validate.

## 12. Intentionally Omitted Features

Given the assignment scope and available development time, I deliberately did not attempt to implement:

- Full inspection report generation
- Scheduling
- Payments
- Homeowner-facing reports or portals
- Full parity with every possible Spectora answer type
- Binsr import
- A complete replacement for Hive's template editor
- Advanced photo/file storage
- Authentication and multi-user permissions

The focus was on making the Spectora import trustworthy, inspectable, editable, persistent, and independently verifiable.

## 13. Development Time

Approximate focused development time: 3 days

This includes exploration of the Hive/Spectora workflows, implementation, database setup, verification, deployment, and final testing.

## 14. Existing Code / Starters

The implementation was built specifically for this assignment.

No existing Hive Inspect application code was used as the application implementation.

The Spectora export used for development is included in `sample-data/` as the committed sample input.
