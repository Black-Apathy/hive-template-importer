# Template Data Model

## Template

A template represents one complete inspection template imported into our application.

### Properties

- `id` — unique identifier
- `name` — template name
- `source` — where the template came from (e.g. Spectora)
- `sections` — ordered list of sections
- `createdAt` — creation timestamp
- `updatedAt` — last modification timestamp

## Section

A section represents a major category within an inspection template.

### Properties

- `id` — unique identifier
- `name` — section name
- `order` — position of the section within the template
- `subsections` — ordered list of subsections

## Subsection

A subsection represents a smaller category within a section.

### Properties

- `id` — unique identifier
- `name` — subsection name
- `order` — position of the subsection within the section
- `fields` — ordered list of fields

## Field

A field represents an individual inspection field/comment within a subsection.

### Properties

- `id` — unique identifier
- `name` — field/comment name
- `commentText` — description or comment content
- `commentType` — information, limitation, or defect
- `category` — severity/category value from the source
- `answerType` — boolean, checkbox, number, text, etc.
- `order` — position of the field within the subsection

### Optional Field Properties

- `options` — multiple-choice options available for the field
- `unitOptions` — units available for numeric answers
- `recommendation` — recommendation associated with the field
- `defaultValue` — default answer/value
- `defaultValue2` — second default value, used for range-type fields
- `defaultUnitType` — default unit for numeric/range fields

### Estimate Properties

- `estimateMin` — minimum estimated cost
- `estimateMax` — maximum estimated cost

### Photo Properties

- `photos` — list of default photos associated with the field

### Photo

A default photo associated with a field.

- `url` — photo reference/location
- `caption` — photo caption

### Field Settings

- `locked` — whether the field is locked
- `simpleFormat` — whether simple formatting is enabled
- `disablePhotos` — whether photos are disabled for the field
- `uses` — usage information from the source

## Import Issue

Represents content encountered during import that could not be fully preserved.

### Properties

- `id` — unique identifier
- `templateId` — template being imported
- `sourceRow` — source spreadsheet row
- `type` — missing from export or unsupported by importer
- `message` — explanation of the issue
- `sourceData` — relevant original data for inspection
