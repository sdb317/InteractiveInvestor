# Implementation Plan: Investment Dashboard

## Overview

Implement the investment dashboard end-to-end: Django models, a JSON API endpoint, an xlsx importer, and a React detail view (summary panel + price chart) wired into the existing SPA. Backend is Python 3.14 / Django 6 using camelCase conventions. Frontend is React 19 + React Bootstrap + Recharts inside `web/ui/`.

---

## Tasks

- [ ] 1. Register dashboard app and create Django models
  - [ ] 1.1 Register `dashboard` in `INSTALLED_APPS` inside `web/app/settings.py`
    - Add `'dashboard'` to the `INSTALLED_APPS` list so Django discovers the app's models and management commands
    - _Requirements: 3.1, 4.1_

  - [ ] 1.2 Define `Holding` and `PricePoint` models in `web/dashboard/models.py`
    - `Holding`: fields `name` (CharField), `quantity` (DecimalField, null=True), `purchaseDate` (DateField, null=True), `bookCost` (DecimalField, null=True), `currentValue` (DecimalField, null=True), `importedAt` (DateTimeField, auto_now=True); `unique_together = [('name', 'purchaseDate')]`; `ordering = ['name']`
    - `PricePoint`: FK to `Holding` (CASCADE, related_name `pricePoints`), `date` (DateField), `price` (DecimalField); `unique_together = [('holding', 'date')]`; `ordering = ['date']`
    - All field names in camelCase per project convention
    - _Requirements: 3.2, 3.3, 3.4, 4.2_

  - [ ] 1.3 Generate and apply database migrations
    - Run `python manage.py makemigrations dashboard` then `python manage.py migrate` from `web/`
    - Verify migration file is created in `web/dashboard/migrations/`
    - _Requirements: 3.1, 4.2_

- [ ] 2. Implement the holding serialiser
  - [ ] 2.1 Create `web/dashboard/holdingSerializer.py` with `serializeHolding(holding)`
    - Return a dict with keys: `id`, `name`, `quantity`, `purchaseDate`, `bookCost`, `currentValue`, `priceSeries`
    - `purchaseDate` serialised as `YYYY-MM-DD` string; numeric `Decimal` fields serialised as strings
    - `priceSeries` built from `holding.pricePoints.all()` (ordered by `date` ascending via model `Meta`); each entry `{ "date": "YYYY-MM-DD", "price": "<string>" }`
    - Returns empty list for `priceSeries` when no price points exist
    - _Requirements: 3.2, 3.3, 3.4, 3.7_

  - [ ]* 2.2 Write Hypothesis property test — Property 8: Holding serialiser shape
    - **Property 8: Holding serialiser shape**
    - For any `Holding` instance (including one with no `PricePoint` records), `serializeHolding` shall return a dict with exactly the keys `id`, `name`, `quantity`, `purchaseDate`, `bookCost`, `currentValue`, `priceSeries`; `priceSeries` shall be a list; each entry shall have a `date` key (string matching `YYYY-MM-DD`) and a `price` key (non-negative numeric string)
    - Use `hypothesis` with `django.test.TestCase`; create model instances via `@given(st.builds(...))`
    - **Validates: Requirements 3.2, 3.3, 3.7**

  - [ ]* 2.3 Write Hypothesis property test — Property 9: Price series ordering
    - **Property 9: Price series ordering**
    - For any `Holding` with one or more `PricePoint` records, the `priceSeries` list returned by `serializeHolding` shall be ordered by `date` in strictly ascending order
    - **Validates: Requirement 3.4**

- [ ] 3. Implement the holding API view and URL routing
  - [ ] 3.1 Create `web/dashboard/holdingView.py` with `getHolding(request, holdingId)` view
    - Accept only GET; validate `holdingId` is a positive integer — return HTTP 400 `{"detail": "Invalid id."}` for any other value
    - Query `Holding.objects.get(pk=holdingId)` — return HTTP 404 `{"detail": "Not found."}` on `Holding.DoesNotExist`
    - Return HTTP 200 `JsonResponse(serializeHolding(holding))` on success
    - Wrap in broad `except Exception` returning HTTP 500 `{"detail": str(e)}`
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 3.2 Write Hypothesis property test — Property 10: API id validator
    - **Property 10: API id validator**
    - For any string that is not a representation of a positive integer (`"0"`, `"-1"`, `"abc"`, `"1.5"`, `""`), the view shall return HTTP 400 with `{"detail": "Invalid id."}`
    - Use `hypothesis` with `st.text` and `st.integers(max_value=0)`
    - **Validates: Requirement 3.8**

  - [ ] 3.3 Wire up URL routing for the API
    - Add `path('api/holdings/<int:holdingId>/', getHolding)` to `web/dashboard/urls.py`
    - Add `path('api/', include('dashboard.urls'))` to `web/app/urls.py`
    - _Requirements: 3.1_

  - [ ]* 3.4 Write Django TestCase example tests for `getHolding`
    - Test HTTP 400 returned for non-integer id `"abc"` (send via URL path as string)
    - Test HTTP 404 returned for a valid integer id that does not exist in the database
    - Test HTTP 200 returned for a known `Holding` with two `PricePoint` records, verifying full JSON shape
    - _Requirements: 3.2, 3.5, 3.8_

- [ ] 4. Implement the xlsx importer
  - [ ] 4.1 Create `web/dashboard/management/commands/importHoldings.py`
    - Locate `data/History.xlsx` relative to the Django `BASE_DIR`
    - Use `openpyxl` to read the file; log an error and exit non-zero if the file cannot be opened (`Req 4.7`)
    - Validate that required columns (`Stock`, `Quantity`, `Value (£)`, `Purchase date`) are present (case-insensitive strip); log the missing column name and halt without persisting if any are absent (`Req 4.4`)
    - For each data row: validate `quantity` is numeric, `bookCost` is numeric, `purchaseDate` is parseable as a date; skip + log row number + field name on failure (`Req 4.6`)
    - `update_or_create(name=name, purchaseDate=purchaseDate, defaults={"quantity": ..., "currentValue": ..., "importedAt": ...})`
    - After upsert, create two `PricePoint` records: one at `purchaseDate` (implied price = `bookCost / quantity`), one at today's date (price = `currentValue / quantity`); use `update_or_create` to avoid duplicates
    - Log `"Created: N, Updated: M"` on completion (`Req 4.5`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.2 Write Hypothesis property test — Property 11: Row field validator
    - **Property 11: Row field validator**
    - For any import row dict where `quantity`, `bookCost`, or `purchaseDate` is not parseable as the expected type, `validateRow(row)` shall return an error result identifying the field name and row index, and shall not raise an exception
    - Extract `validateRow` as a pure helper and test it in isolation with `hypothesis` `st.text` and `st.integers`
    - **Validates: Requirement 4.6**

  - [ ]* 4.3 Write Django TestCase example tests for the importer
    - Test that a second run on the same synthetic `.xlsx` fixture updates rather than duplicates records (assert `Holding.objects.count()` unchanged on second run)
    - Test that a file with a missing required column halts without persisting any records
    - _Requirements: 4.3, 4.4_

- [ ] 5. Checkpoint — backend
  - Ensure all backend tests pass (`python manage.py test dashboard` from `web/`), ask the user if questions arise.

- [ ] 6. Install Recharts and create frontend formatter utilities
  - [ ] 6.1 Install `recharts` as a production dependency
    - Run `npm install recharts` from `web/ui/`
    - Confirm `recharts` entry appears in `package.json` dependencies
    - _Requirements: 2.1_

  - [ ] 6.2 Create `web/ui/src/holdingFormatters.mjs` with all pure formatter/utility functions
    - `formatGbp(value)` — returns `'£N.NN'` for finite numbers, `'—'` (U+2014) for null/undefined
    - `calcGainLossPct(currentValue, bookCost)` — returns `((currentValue - bookCost) / bookCost) × 100`, or `null` when `bookCost` is 0 or unavailable
    - `formatGainLossGbp(value)` — `'±£N.NN'` with U+2212 for negative; `'—'` for null/undefined
    - `classifyGainLoss(value)` — returns `'positive' | 'negative' | 'zero' | 'unavailable'`
    - `buildChartAriaLabel(name, startDate, endDate)` — returns `"Stock price chart for {name} from {startDate} to {endDate}"`
    - `selectTicks(series, maxTicks)` — returns an array of at most `maxTicks` evenly-spaced date strings from `series`
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 2.8, 2.10_

  - [ ]* 6.3 Write fast-check property test — Property 1: GBP currency formatter shape
    - **Property 1: GBP currency formatter shape**
    - For any finite numeric value, `formatGbp(value)` returns a string starting with `£` and matching `£\d+\.\d{2}$`
    - **Validates: Requirements 1.4, 1.5, 1.6**

  - [ ]* 6.4 Write fast-check property test — Property 2: Gain/loss percentage formula
    - **Property 2: Gain/loss percentage formula**
    - For any pair `(currentValue, bookCost)` where `bookCost` is non-zero finite, `calcGainLossPct` returns `((currentValue - bookCost) / bookCost) × 100` within 1e-9 tolerance
    - **Validates: Requirement 1.7**

  - [ ]* 6.5 Write fast-check property test — Property 3: Gain/loss sign classifier
    - **Property 3: Gain/loss sign classifier**
    - For any finite numeric `value`, `classifyGainLoss` returns `'positive'` iff `value > 0`, `'negative'` iff `value < 0`, `'zero'` iff `value === 0`; `formatGainLossGbp` prefixes with `+` when positive, `−` (U+2212) when negative, no sign when zero
    - **Validates: Requirements 1.8, 1.9, 1.10**

  - [ ]* 6.6 Write fast-check property test — Property 4: Null field placeholder
    - **Property 4: Null field placeholder**
    - `formatGbp(null)`, `formatGbp(undefined)`, `formatGainLossGbp(null)`, `formatGainLossGbp(undefined)` all return `'—'` (U+2014)
    - **Validates: Requirement 1.11**

  - [ ]* 6.7 Write fast-check property test — Property 5: Chart aria-label template
    - **Property 5: Chart aria-label template**
    - For any non-empty strings `name`, `startDate`, `endDate`, `buildChartAriaLabel` returns `"Stock price chart for " + name + " from " + startDate + " to " + endDate`
    - **Validates: Requirement 2.8**

  - [ ]* 6.8 Write fast-check property test — Property 6: Tick count bound
    - **Property 6: Tick count bound**
    - For any series of any length ≥ 0 and any `maxTicks` ≥ 1, `selectTicks` returns an array whose length is at most `min(maxTicks, series.length)`
    - **Validates: Requirement 2.10**

- [ ] 7. Create the holding API client
  - [ ] 7.1 Create `web/ui/src/holdingApi.mjs` with `getHolding(id)` function
    - `GET /api/holdings/{id}/` with a fetch call mirroring the pattern in the existing `api.mjs`
    - On 2xx: parse response JSON, convert string decimal fields (`quantity`, `bookCost`, `currentValue`) and each `price` in `priceSeries` to `number` via `parseFloat`; return `{ ok: true, detail: HoldingDetail }`
    - On non-2xx or network failure: return `{ ok: false, message: string }`
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.8_

- [ ] 8. Update Investment row and InvestmentList to support Open
  - [ ] 8.1 Update `web/ui/src/Components/Items/Investment.jsx` — add Open button and `openRef` prop
    - Add `onOpen?: (name: string) => void` and `openRef?: React.RefObject<HTMLButtonElement>` props
    - Add a second action button inside the existing `<td>` actions cell: `variant="outline-secondary"`, label "Open", `faFolderOpen` icon, calls `onOpen?.(name)`; attach `openRef` to this button
    - Export `OPEN_BUTTON_LABEL` constant
    - _Requirements: 5.1, 5.4_

  - [ ] 8.2 Update `web/ui/src/Components/Layouts/InvestmentList.jsx` — thread `onOpen` and `openRef` through
    - Accept `onOpen?: (name: string) => void` prop (already accepted per existing code; verify it is passed down to each `<Investment>` row)
    - Pass a per-row `openRef` only for the currently-open holding so `App` can restore focus on Back
    - _Requirements: 5.1, 5.4_

- [ ] 9. Create HoldingSummary component
  - [ ] 9.1 Create `web/ui/src/Components/Items/HoldingSummary.jsx`
    - Props: `detail: HoldingDetail | null`, `loading: boolean`, `error: string | null`
    - Render a Bootstrap `Card` with a `<dl>` definition-list grid showing: Stock, Quantity, Purchase Date, Book Cost, Current Value, Gain/Loss amount, Gain/Loss percentage
    - Use `formatGbp` for monetary fields; use `calcGainLossPct`, `formatGainLossGbp`, `classifyGainLoss` for gain/loss rendering
    - Gain/Loss row: apply Bootstrap `text-success` / `text-danger` based on `classifyGainLoss`; prefix `+` (positive) or `−` U+2212 (negative)
    - Unavailable fields (null/undefined) display `'—'` (already handled by formatter functions)
    - Show loading skeleton or spinner while `loading=true`; show error alert when `error` is set
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ]* 9.2 Write Vitest unit tests for HoldingSummary
    - Test that each field renders `—` when the corresponding `detail` field is null
    - Test that Gain/Loss receives `text-success` class when positive and `text-danger` when negative
    - Test that loading spinner renders when `loading=true`
    - _Requirements: 1.8, 1.9, 1.11_

- [ ] 10. Create PriceChart component
  - [ ] 10.1 Create `web/ui/src/Components/Charts/PriceChart.jsx`
    - Props: `priceSeries: Array<{ date: string, price: number }> | null`, `stockName: string`, `loading: boolean`, `error: string | null`
    - Render `<ResponsiveContainer width="100%" height={300}><LineChart>` from Recharts with `<XAxis>`, `<YAxis label={{ value: 'Price (GBp)', angle: -90, position: 'insideLeft' }}/>`, `<Tooltip>`, `<Line type="monotone" dataKey="price" dot={false} />`
    - X-axis: `dataKey="date"`, `tickFormatter={formatChartDate}` (format as `YYYY-MM-DD`), `ticks={selectTicks(priceSeries, 12)}`
    - Wrapping `<div>` carries `aria-label={buildChartAriaLabel(stockName, firstDate, lastDate)}`
    - States: loading spinner when `loading=true`; `"Not enough price data to display a chart"` when `priceSeries.length < 2`; error message when `error` is set
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 10.2 Write fast-check property test — Property 7: Insufficient-data guard
    - **Property 7: Insufficient-data guard**
    - For any price series of length 0 or 1, `PriceChart` shall not render an SVG chart element and shall render a text node matching `"Not enough price data to display a chart"`
    - Use `fc.array` with max size 1; mount with Vitest + jsdom
    - **Validates: Requirement 2.7**

  - [ ]* 10.3 Write Vitest unit tests for PriceChart
    - Test loading spinner renders when `loading=true`
    - Test error message renders when `error` is set
    - Test `aria-label` is present on the wrapping div when a valid series is supplied
    - _Requirements: 2.6, 2.8, 2.9_

- [ ] 11. Create DashboardView component
  - [ ] 11.1 Create `web/ui/src/Components/Layouts/DashboardView.jsx`
    - Props: `holdingId: number`, `holdingName: string`, `onBack: () => void`
    - Local state: `detail`, `loading`, `error` (via `useState`); fetch on mount via `getHolding(holdingId)`
    - Render: `<Button variant="outline-secondary" onClick={onBack}>← Back</Button>` at top; `<HoldingSummary detail={detail} loading={loading} error={error} />`; `<PriceChart priceSeries={detail?.priceSeries ?? null} stockName={holdingName} loading={loading} error={error} />`
    - Loading/error state modelled to mirror `listLoading` / `listError` pattern from `App.jsx`
    - _Requirements: 1.1, 2.1, 5.2, 5.3_

  - [ ]* 11.2 Write Vitest unit tests for DashboardView
    - Test that `onBack` is called when the Back button is clicked
    - Test that loading spinner is shown initially (before fetch resolves), using `vi.mock` to stub `getHolding`
    - Test that `HoldingSummary` and `PriceChart` receive `detail` once fetch resolves
    - _Requirements: 5.2, 5.3_

- [ ] 12. Wire DashboardView into App.jsx
  - [ ] 12.1 Update `web/ui/src/App.jsx` — add holding state, reducer actions, and DashboardView rendering
    - Add action types `HOLDING_LOAD_STARTED`, `HOLDING_LOAD_SUCCEEDED`, `HOLDING_LOAD_FAILED` to the reducer; extend `initialState` with `selectedHoldingId: null` and `selectedHoldingName: null`
    - When `handleOpen(name)` is called, set `selectedHoldingId` by looking up the investment's id from the list; dispatch `HOLDING_LOAD_STARTED`
    - When view state has a `selectedHoldingId`, render `<DashboardView holdingId={...} holdingName={...} onBack={handleBack} />` instead of `<InvestmentList>`
    - `handleBack`: dispatch action to clear `selectedHoldingId`; restore focus to the `openRef` of the row that was opened (`Req 5.4`)
    - Pass per-row `openRef` down through `InvestmentList` for the currently-open holding
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 12.2 Write Vitest reducer unit tests for new holding actions
    - Test `HOLDING_LOAD_STARTED` sets `selectedHoldingId`, `HOLDING_LOAD_SUCCEEDED` sets detail, `HOLDING_LOAD_FAILED` sets error and clears loading
    - _Requirements: 5.1_

- [ ] 13. Add Storybook stories for new components
  - [ ]* 13.1 Create `web/ui/src/Components/Layouts/DashboardView.stories.jsx`
    - Stories: loading state, loaded state (with mock detail), error state
    - _Requirements: 1.1, 2.1, 5.2_

  - [ ]* 13.2 Create `web/ui/src/Components/Items/HoldingSummary.stories.jsx`
    - Stories: full data, all null fields, positive gain, negative gain, zero gain
    - _Requirements: 1.8, 1.9, 1.10, 1.11_

  - [ ]* 13.3 Create `web/ui/src/Components/Charts/PriceChart.stories.jsx`
    - Stories: loading, 0 points, 1 point, 2 points, 30 points, 365 points
    - _Requirements: 2.6, 2.7_

- [ ] 14. Final checkpoint — full stack
  - Ensure all backend tests pass (`python manage.py test dashboard` from `web/`) and all frontend tests pass (`npm test` from `web/ui/`). Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests (fast-check / Hypothesis) validate universal correctness properties; unit tests validate specific examples and edge cases
- `hypothesis` must be added to the Conda environment before running Property 8–11 tests: `conda install hypothesis`
- `recharts` must be installed (`npm install recharts` in `web/ui/`) before task 10.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "6.2", "4.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "3.1", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "4.2", "4.3"] },
    { "id": 5, "tasks": ["3.2", "3.3", "7.1"] },
    { "id": 6, "tasks": ["3.4", "8.1"] },
    { "id": 7, "tasks": ["8.2"] },
    { "id": 8, "tasks": ["9.1", "10.1"] },
    { "id": 9, "tasks": ["9.2", "10.2", "10.3", "11.1"] },
    { "id": 10, "tasks": ["11.2", "12.1"] },
    { "id": 11, "tasks": ["12.2", "13.1", "13.2", "13.3"] }
  ]
}
```
