// The investment table and the "Refresh" control above it: three column headers,
// one row per entry, and whatever stands in for the rows when there are none.

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { Investment } from '/src/Components/Items/Investment.jsx';

/** The first column's heading text, as Req 1.3 states it. */
export const NAME_COLUMN_LABEL = 'Investment Name';

/** The second column's heading text, as Req 1.3 states it. */
export const TIMESTAMP_COLUMN_LABEL = 'Deployment Timestamp';

/**
 * The action column's heading text.
 */
export const ACTION_COLUMN_LABEL = 'Actions';

/**
 * It stands in place of the table rows, inside the table, so the three column
 * headers above it stay displayed.
 */
export const NO_INVESTMENTS_MESSAGE = 'No investments found';

/**
 * The loading indicator's text.
 */
export const LOADING_TEXT = 'Loading investments...';

/**
 * The "Refresh" control's accessible name.
 */
export const REFRESH_LABEL = 'Refresh';

/** The number of columns for the `colSpan` of a full-width cell. */
const COLUMN_COUNT = 3;

/**
 * The investment table, with the "Refresh" control above it.
 *
 * @param {{
 *   investments?: Array<{ name: string, deployedAt: string }>,
 *   loading?: boolean,
 *   error?: string | null,
 *   onRefresh?: () => void,
 *   onOpen?: (name: string) => void,
 * }} props
 * @param props.investments
 * @param props.loading
 * @param props.error
 * @param props.onRefresh
 * @param props.onOpen
 */
function InvestmentList({ investments = [], loading = false, error = null, onRefresh, onOpen }) {
  const entries = Array.isArray(investments) ? investments : [];

  return (
    <Card className="investment-list">
      <Card.Header className="d-flex align-items-center justify-content-between gap-2">
        <Card.Title as="h2" className="h5 mb-0">
          Investments
          {entries.length > 0 && (
            <span className="badge text-bg-secondary ms-2 align-middle">{entries.length}</span>
          )}
        </Card.Title>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onRefresh?.()}
          disabled={loading}
          aria-label={REFRESH_LABEL}
          title={REFRESH_LABEL}
        >
          <FontAwesomeIcon icon={faArrowsRotate} spin={loading} aria-hidden="true" />
        </Button>
      </Card.Header>

      {error && (
        <Alert
          variant="danger"
          className="rounded-0 border-0 border-bottom mb-0"
          // Assertive, unlike the table's polite region: a failed load is the
          // answer to something the user just asked for.
          role="alert"
        >
          <FontAwesomeIcon icon={faTriangleExclamation} className="me-2" aria-hidden="true" />
          {error}
        </Alert>
      )}

      {/* The table's accessible name comes from `aria-label`, not a
          `visually-hidden` <caption>: Bootstrap renders captions at
          `caption-side: bottom`, and `visually-hidden` does not take
          `position: absolute` on a <caption>, so the 1px box stayed in flow —
          enough vertical overflow for `.table-responsive` (whose `overflow-y`
          computes to `auto` beside `overflow-x: auto`) to grow a scrollbar over
          the rows. */}
      <Table
        hover={entries.length > 0 && !loading}
        responsive
        className="mb-0 align-middle"
        aria-label="Deployed investments, with the time each was deployed"
        aria-busy={loading}
      >
        <thead>
          <tr>
            <th scope="col">{NAME_COLUMN_LABEL}</th>
            <th scope="col">{TIMESTAMP_COLUMN_LABEL}</th>
            <th scope="col" className="text-end">{ACTION_COLUMN_LABEL}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="py-4">
                <div className="d-flex align-items-center gap-2 text-body-secondary" role="status">
                  <Spinner animation="border" size="sm" aria-hidden="true" />
                  <span>{LOADING_TEXT}</span>
                </div>
              </td>
            </tr>
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="py-4 text-body-secondary">
                {NO_INVESTMENTS_MESSAGE}
              </td>
            </tr>
          ) : (
            entries.map((investment) => (
              <Investment key={investment.name} investment={investment} onOpen={onOpen} />
            ))
          )}
        </tbody>
      </Table>
    </Card>
  );
}

export default InvestmentList;
export { InvestmentList };
