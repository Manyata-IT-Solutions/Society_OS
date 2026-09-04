# Property CSV Import & Bulk Provisioning Pipeline

## 1. Import Workflow

The Community OS property provisioning engine uses a two-phase import design:

```
[CSV File Upload / Paste]
         │
         ▼
[Phase 1: Validation Engine]  ───(Invalid)───► [Row-by-Row Error Breakdown]
         │                                       (No DB mutation)
      (Valid)
         ▼
[Interactive Preview & Review]
         │
         ▼
[Phase 2: Atomic Batch Commit]
  ├── Upsert Sections
  ├── Upsert Buildings
  ├── Upsert Floors
  └── Upsert Units (createMany / bulk upsert in transaction)
         │
         ▼
[Job Status COMPLETED + Audit Domain Event]
```

---

## 2. CSV Specification & Header Mapping

| Header          | Required | Valid Values / Types                                                        | Description                                    |
| :-------------- | :------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `unitNumber`    | **Yes**  | String (e.g., `101`, `B-304`, `V-01`)                                       | Unit identifier unique per building            |
| `buildingCode`  | No       | String (e.g., `TWR-A`)                                                      | Target building/tower code                     |
| `buildingName`  | No       | String (e.g., `Tower A - Alpine`)                                           | Display name when creating building on-the-fly |
| `floorLabel`    | No       | String (e.g., `G`, `1`, `PH`)                                               | Floor level identifier                         |
| `sectionCode`   | No       | String (e.g., `SEC-P1`)                                                     | Phase / Section code                           |
| `unitType`      | No       | `APARTMENT`, `VILLA`, `PENTHOUSE`, `STUDIO`, `DUPLEX`, `ROW_HOUSE`, `OTHER` | Defaults to `APARTMENT`                        |
| `carpetArea`    | No       | Number (e.g. `1250.50`)                                                     | Net usable floor area                          |
| `areaUnit`      | No       | `SQFT`, `SQM`                                                               | Defaults to `SQFT`                             |
| `bedroomCount`  | No       | Integer (0 to 20)                                                           | Number of bedrooms                             |
| `bathroomCount` | No       | Integer (0 to 20)                                                           | Number of bathrooms                            |

---

## 3. Spreadsheet Formula Injection Defense

To prevent CSV injection / formula execution vulnerabilities when exported files are opened in Microsoft Excel or Google Sheets, the export engine inspects all cell values. Any field starting with formula prefix characters (`=`, `+`, `-`, `@`) is automatically escaped by prepending a single quote (`'`):

```typescript
private sanitizeForCsv(value: string): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}
```
