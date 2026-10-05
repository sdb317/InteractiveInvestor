# Requirements Document

## Introduction

The Investment Dashboard is a personal portfolio viewer for an Interactive Investor brokerage account. It provides a detail view for a single stock holding, displaying key investment facts (stock name, current value, gain/loss, purchase info) alongside a line chart of the stock's closing price from the purchase date to the present day. Data originates from `.xlsx` exports stored in `data/` and is served through the existing Django backend. The UI is built with React + React Bootstrap inside `web/ui/`.

---

## Glossary

- **Dashboard**: The full-page detail view rendered when a user selects a holding from the investment list.
- **Holding**: A single stock position held in the Interactive Investor account (one row in the source data).
- **Purchase Date**: The date on which the holding was first acquired, as recorded in the source data.
- **Current Value**: The present market value of the holding, calculated as current price × quantity held.
- **Book Cost**: The total amount paid to acquire the holding (purchase price × quantity, excluding any subsequent reinvestment).
- **Gain/Loss**: The difference between Current Value and Book Cost, expressed both as an absolute GBP amount and as a percentage.
- **Price Series**: The ordered sequence of daily closing prices for the holding's stock, from Purchase Date to today.
- **Price Chart**: The line chart rendered from the Price Series.
- **Dashboard_API**: The Django REST endpoint that supplies holding detail and price series data.
- **Dashboard_View**: The React component tree that renders the Dashboard.
- **Chart_Component**: The React component responsible for rendering the Price Chart.
- **Data_Importer**: The Django management command or utility that reads `.xlsx` exports and writes data to the database.
- **Investment_List**: The existing React component that lists all holdings.
- **Open control**: The per-row action button in the Investment_List that opens the Dashboard_View for that holding.

---

## Requirements

### Requirement 1: Display investment detail summary

**User Story:** As a portfolio owner, I want to see the key facts about a holding in one place, so that I can quickly assess the position without navigating away.

#### Acceptance Criteria

1. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the stock name.
2. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the quantity of shares held.
3. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the Purchase Date in `YYYY-MM-DD` format.
4. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the Book Cost in GBP formatted to two decimal places with a `£` prefix.
5. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the Current Value in GBP formatted to two decimal places with a `£` prefix.
6. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the Gain/Loss as a GBP amount formatted to two decimal places with a `£` prefix.
7. WHEN the user activates the Open control for a holding, THE Dashboard_View SHALL display the Gain/Loss as a percentage calculated as `((currentValue - bookCost) / bookCost) × 100`, formatted to two decimal places with a `%` suffix.
8. WHEN the Gain/Loss is positive, THE Dashboard_View SHALL render the Gain/Loss values in green and prefix the amount with `+`.
9. WHEN the Gain/Loss is negative, THE Dashboard_View SHALL render the Gain/Loss values in red and prefix the amount with `−`.
10. WHEN the Gain/Loss is zero, THE Dashboard_View SHALL render the Gain/Loss values in the default body text colour with no sign prefix.
11. IF a holding field (quantity, book cost, or current value) is unavailable, THEN THE Dashboard_View SHALL display a `—` placeholder for that field and any fields derived from it.

---

### Requirement 2: Display a price chart for the holding

**User Story:** As a portfolio owner, I want to see a line chart of the stock price over the life of my holding, so that I can judge performance in context.

#### Acceptance Criteria

1. WHEN a holding is selected, THE Chart_Component SHALL render a line chart using the Price Series for that holding.
2. THE Chart_Component SHALL plot closing price on the Y axis and date on the X axis.
3. THE Chart_Component SHALL label the Y axis "Price (GBp)" to reflect pence-denominated UK equities.
4. THE Chart_Component SHALL display date labels on the X axis in `YYYY-MM-DD` format.
5. THE Chart_Component SHALL span the X axis from the Purchase Date to the most recent available date in the Price Series.
6. WHILE the Price Series is loading, THE Chart_Component SHALL display a loading indicator in place of the chart.
7. IF the Price Series contains fewer than two data points, THEN THE Chart_Component SHALL display the message "Not enough price data to display a chart" in place of the chart.
8. THE Chart_Component SHALL carry an `aria-label` of the form "Stock price chart for {stock name} from {startDate} to {endDate}".
9. IF the Price Series fetch fails, THEN THE Chart_Component SHALL display the message "Failed to load price data" in place of the chart.
10. THE Chart_Component SHALL render no more than 12 X-axis tick labels regardless of the total number of data points, distributing them evenly across the date range.

---

### Requirement 3: Serve holding detail and price series from the backend

**User Story:** As a portfolio owner, I want the dashboard data to come from the database so that it reflects imported brokerage exports.

#### Acceptance Criteria

1. THE Dashboard_API SHALL expose a `GET /api/holdings/{id}/` endpoint that returns holding detail and price series for the specified holding.
2. WHEN a valid holding `id` is provided, THE Dashboard_API SHALL return a JSON response containing: `id`, `name`, `quantity`, `purchaseDate`, `bookCost`, `currentValue`, and a `priceSeries` array.
3. THE Dashboard_API SHALL return each `priceSeries` entry as an object with a `date` field in `YYYY-MM-DD` format and a `price` field as a non-negative numeric value in GBp rounded to two decimal places.
4. THE Dashboard_API SHALL return the `priceSeries` array ordered by `date` ascending.
5. IF a requested holding `id` does not exist, THEN THE Dashboard_API SHALL return HTTP 404 with a JSON body `{ "detail": "Not found." }`.
6. IF the server encounters an unexpected error, THEN THE Dashboard_API SHALL return HTTP 500 with a JSON body `{ "detail": "<error description>" }`.
7. WHEN a valid holding `id` is provided and the holding has no associated price series entries, THE Dashboard_API SHALL return the full holding detail response with `priceSeries` set to an empty array `[]`.
8. IF the `id` path parameter is not a valid positive integer, THEN THE Dashboard_API SHALL return HTTP 400 with a JSON body `{ "detail": "Invalid id." }`.

---

### Requirement 4: Import holding data from xlsx exports

**User Story:** As a portfolio owner, I want to load my Interactive Investor export into the database so that the dashboard has data to display.

#### Acceptance Criteria

1. THE Data_Importer SHALL read holding records from `.xlsx` files located in the `data/` directory.
2. WHEN an `.xlsx` file is processed, THE Data_Importer SHALL persist each row as a Holding record in the database, mapping stock name, quantity, purchase date, and book cost from the source columns.
3. WHEN a Holding record with the same stock name and purchase date already exists, THE Data_Importer SHALL update the quantity and book cost fields of the existing record rather than creating a duplicate.
4. IF a required source column (stock name, quantity, purchase date, or book cost) is missing from the `.xlsx` file, THEN THE Data_Importer SHALL log an error message identifying the missing column name and halt processing of that file without persisting any records from it.
5. WHEN an import completes without errors, THE Data_Importer SHALL log the count of records created and the count of records updated.
6. IF a row contains a non-numeric value in the quantity or book cost column, or a value that cannot be parsed as a date in the purchase date column, THEN THE Data_Importer SHALL skip that row, log an error message identifying the row number and the invalid field, and continue processing the remaining rows.
7. IF the `.xlsx` file cannot be opened or read, THEN THE Data_Importer SHALL log an error message identifying the filename and halt processing of that file without persisting any records from it.

---

### Requirement 5: Navigate to and from the dashboard

**User Story:** As a portfolio owner, I want to open the dashboard for any holding in the list and return to the list, so that I can compare holdings without losing my place.

#### Acceptance Criteria

1. WHEN the user activates the Open control for a holding in the investment list, THE Dashboard_View SHALL be displayed for that holding.
2. WHILE THE Dashboard_View is displayed, THE Dashboard_View SHALL provide a back control with the visible label "Back".
3. WHEN the back control is activated, THE Dashboard_View SHALL be dismissed and THE Investment_List SHALL be displayed.
4. WHEN the back control is activated, THE Investment_List SHALL return focus to the Open control of the holding that was opened.
