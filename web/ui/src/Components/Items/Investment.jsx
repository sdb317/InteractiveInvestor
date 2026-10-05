// Feature: ai-investment-run
//
// One row of the investment table: a Investment Name, its Deployment Timestamp, and
// the per-row "Run" control (Req 1.3, 5.1).
//
// Renders a `<tr>` rather than a self-contained block, because the investment
// table is a table and the browser's own column alignment is what keeps the
// Names and the Timestamps in register. The consequence is that this component
// is only valid inside a `<tbody>`; `InvestmentList` is its only caller.
//
// Presentational and stateless on purpose. It holds no fetch, no run state and
// no selection — `App` owns the Investment List and the run lifecycle, and hands
// this component one entry and one callback. Nothing about ordering is decided
// here either: the rows arrive already filtered and ordered, so Req 2.5, Req 3.9
// and Req 9.9 hold because the displayed rows are derived upstream and never
// stored, and a second derivation site here would be a second place for the
// rows to disagree with the state.
//
// Two points worth stating, because both are an *absence*:
//
//   1. **The "Run" button carries no `aria-label` and no `title`.** Req 5.1
//      fixes its visible label as "Run", and that text content *is* its
//      accessible name, so either attribute could only make the two disagree.
//      Req 10.10's `aria-label`/`title` pairing governs icon-only controls, and
//      this button carries text. Several rows therefore expose several buttons
//      all named "Run"; what tells them apart is the row, which is why the Name
//      cell is a `<th scope="row">` — a screen reader announces that header with
//      the row's cells, so the button is unambiguous in context without an
//      invented per-row label.
//
//   2. **The button is never disabled.** Req 5.8 makes every control outside an
//      open Run Dialog unresponsive, but it does so through the dialog's
//      backdrop and focus trap, not through this attribute. Nor is it disabled
//      while a Investment List request is in flight: Req 1.5 replaces the table
//      *body* with the loading indicator for that period, so there is no row on
//      screen to disable.
//
// The Deployment Timestamp is passed through `formatTimestamp` from `view.mjs`
// rather than formatted here, so Req 1.4's `YYYY-MM-DD HH:MM` local-time
// rendering has exactly one definition and the row cannot drift from it.
//
// Requirements: 1.3, 1.4, 5.1, 9.9

import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

/**
 * The visible label, and therefore the accessible name, of a row's "Run"
 * button (Req 5.1).
 *
 * @type {string}
 */
export const RUN_BUTTON_LABEL = 'Run';

/**
 * A single row of the investment table.
 *
 * @param {{
 *   investment: { name: string, deployedAt: string },
 *   onRun?: (name: string) => void,
 * }} props
 * @param props.investment  One Investment List entry, exactly as the Run_API
 *   delivered it. Never reformatted or copied (Req 9.9).
 * @param props.onRun     Invoked with the Investment Name when "Run" is
 *   activated (Req 5.2).
 */
function Investment({ investment, onRun }) {
  const name = investment?.name ?? '';
  const deployedAt = investment?.deployedAt ?? '';

  return (
    <tr className="investment">
      {/* `scope="row"` and not a `<td>`: this cell names the row, which is what
          lets the bare "Run" label above stay unambiguous. It is not one of
          Req 10.11's three `scope="col"` header cells. */}
      <th scope="row" className="align-middle fw-normal">
        <span className="investment__name font-monospace">{name}</span>
      </th>
      <td className="align-middle text-nowrap">
        {/* The raw Req 9.2 value stays in `dateTime`, while the visible text is
            the truncated local-time form Req 1.4 prescribes. */}
        <time className="investment__deployed-at text-body-secondary" dateTime={deployedAt}>
          {deployedAt}
        </time>
      </td>
      <td className="align-middle text-end">
        <Button variant="outline-primary" size="sm" onClick={() => onRun?.(name)}>
          <FontAwesomeIcon icon={faPlay} className="me-1" aria-hidden="true" />
          {RUN_BUTTON_LABEL}
        </Button>
      </td>
    </tr>
  );
}

export default Investment;
export { Investment };
