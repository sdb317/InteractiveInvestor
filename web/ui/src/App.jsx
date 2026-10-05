// Feature: 
//
// App-level reducer: state shape, action types, reducer, and selectors for the
// Investment SPA.
//
// This module contains the pure state management layer (reducer,
// action types, selectors) AND the React App component that renders
// the full editor UI.
//
// Model-layer invariants enforced by this reducer:
//
//   * The Investment List is stored exactly as the API delivered it. The
//     reducer keeps the entry objects from the validated payload and never
//     copies, reformats or reorders them; display ordering is derived
//     at render time through `view.mjs` and stored nowhere.
//   * A load is a three-step transition — started, then succeeded *or* failed —
//     and `listLoading` is cleared by both terminal steps. There is no path
//     that leaves the flag set, which is what keeps Refresh from latching
//     permanently disabled.
//   * A failed load **retains** the Investment List held in memory.
//     The failure branch writes `listError` and clears `listLoading`,
//     and touches `investments` not at all.

import { useCallback, useEffect, useMemo, useRef, useState, useReducer } from 'react';
import Container from 'react-bootstrap/Container';

import { HeaderBar } from '/src/Components/Items/HeaderBar.jsx';
import { InvestmentList } from '/src/Components/Layouts/InvestmentList.jsx';

import { listInvestments, isTimeout, isUnreachable, isNonSuccess } from '../api.mjs';
import { sortInvestments } from '../view.mjs';

// ─── Action Types ────────────────────────────────────────────────────

/** A Investment List request has been sent. */
export const INVESTMENTS_LOAD_STARTED = 'investments/loadStarted';
/** A Investment List request returned a valid payload. */
export const INVESTMENTS_LOAD_SUCCEEDED = 'investments/loadSucceeded';
/** A Investment List request failed, in transport or in validation. */
export const INVESTMENTS_LOAD_FAILED = 'investments/loadFailed';

// ─── Initial State ───────────────────────────────────────────────────

/**
 * @type {{
 *   investments: Array<{ name: string, deployedAt: string }>,
 *   listLoading: boolean,
 *   listError: string | null,
 * }}
 */
export const initialState = {
  /** The Investment List as delivered, unordered and unmodified (Req 9.9). */
  investments: [],
  /** True from the moment a list request is sent until it settles. */
  listLoading: false,
  /** The failure text to display, in its final wording, or `null`. */
  listError: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────

/** Req 1.7's `<error>` for a request that did not complete in time, verbatim. */
export const LIST_ERROR_TIMED_OUT = 'the request timed out';

/**
 * Req 1.7's `<error>` for a non-success response that carries no error message,
 * verbatim.
 *
 * **Also the spelling used for a request that never reached the Run_API.**
 * Req 1.7 names three triggers — non-success, unreachable, timed out — but
 * defines `<error>` for three *cases*, of which only two are transport branches:
 * the timeout, and "a non-success response that carries no error message". An
 * unreachable Run_API produced no response and therefore no error message, so
 * this is the one spelling of the three that describes it. Inventing a fourth
 * would be inventing acceptance-criteria text; borrowing the timeout's would
 * report the wrong cause.
 */
export const LIST_ERROR_NO_MESSAGE = 'the server returned no error message';

/**
 * Req 1.7: `Failed to load investments: <error>`.
 *
 * No trailing full stop — the criterion's text ends at `<error>`, and the two
 * literals above carry none.
 *
 * @param {string} detail  One of the two constants above, or the Run_API's own
 *   error message.
 * @returns {string}
 */
export function listFailedMessage(detail) {
  return `Failed to load investments: ${detail}`;
}

/**
 * The exact message for one failed Investment List request (Req 1.7, 4.7).
 *
 * | Outcome                          | Test                                           | `<error>`                             |
 * |----------------------------------|------------------------------------------------|---------------------------------------|
 * | the 10-second budget elapsed     | `httpStatus === null`, `timeout`               | `the request timed out`               |
 * | the Run_API was unreachable      | `httpStatus === null`, `network_error`         | `the server returned no error message`|
 * | non-success carrying a `message` | numeric `httpStatus`, string `serverMessage`   | that message                          |
 * | non-success carrying none        | numeric `httpStatus`, `serverMessage === null` | `the server returned no error message`|
 *
 * The branches are told apart with `api.mjs`'s own predicates rather than by
 * matching on `message`, so a change to the client's wording cannot silently
 * reroute one.
 *
 * The `serverMessage` test is `typeof … === 'string'` and not a length test.
 * `api.mjs` reports `null` exactly when the body carried no string `message`,
 * which is precisely the distinction Req 1.7 draws, so an empty string is a
 * message the criterion admits.
 *
 * Anything else — an error no branch above claims — takes the "no error message"
 * spelling. It is the one of the three that asserts nothing false about a cause
 * the Runner could not classify, and the alternative is an unhandled rejection
 * that leaves the loading indicator on screen for ever.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function listFailureMessage(error) {
  if (isTimeout(error)) return listFailedMessage(LIST_ERROR_TIMED_OUT);
  if (isUnreachable(error)) return listFailedMessage(LIST_ERROR_NO_MESSAGE);
  if (isNonSuccess(error)) {
    const serverMessage = /** @type {{ serverMessage?: unknown }} */ (error)?.serverMessage;
    if (typeof serverMessage === 'string') return listFailedMessage(serverMessage);
  }
  return listFailedMessage(LIST_ERROR_NO_MESSAGE);
}

// ─── Reducer ─────────────────────────────────────────────────────────

/**
 * Pure reducer managing the top-level AppState.
 *
 * @param {typeof initialState} state
 * @param {{ type: string, [key: string]: unknown }} action
 * @returns {typeof initialState}
 */
export function reducer(state, action) {
  switch (action.type) {
    case INVESTMENTS_LOAD_STARTED: {
      // Req 1.5 forbids displaying an error message while a request is in
      // flight, so the previous failure is dropped here rather than guarded
      // against at the render site. `investments` is carried by the spread: the
      // list stays in memory for the whole request, which is what lets Req 4.7
      // "continue to display the rows displayed immediately before that
      // request" hold if this one fails.
      return { ...state, listLoading: true, listError: null };
    }

    case INVESTMENTS_LOAD_SUCCEEDED: {
      const investments = Array.isArray(action.investments) ? action.investments : [];
      return { ...state, investments, listLoading: false, listError: null };
    }

    case INVESTMENTS_LOAD_FAILED: {
      // Every non-accepting terminal outcome arrives here — a non-success
      // response, an unreachable Run_API, a timeout (Req 1.7), and a payload
      // that violates a Requirement 9 rule (Req 4.8) — because all four specify
      // the same transition: retain the list, drop the loading indicator, show a
      // message, re-enable "Refresh". They differ only in the message, which is
      // why it is passed in rather than composed here: Req 9's rule messages
      // come back from `validateInvestmentListPayload` already interpolated, while
      // Req 1.7's sentence is shaped from the transport branch by the caller.
      //
      // `investments` is **not** written. Req 1.7 retains "the Investment List that
      // was held in memory immediately before the request", and Req 1.10 then
      // requires one row per retained entry to stay displayed beneath the
      // message. The spread is what carries it, so a field added to the state
      // later is retained by default rather than dropped.
      return {
        ...state,
        listLoading: false,
        listError:
          typeof action.message === 'string'
            ? action.message
            : listFailedMessage(LIST_ERROR_NO_MESSAGE),
      };
    }

    default:
      return state;
  }
}

// ─── Selectors ───────────────────────────────────────────────────────

/** The stored Investment List, in delivery order. */
export const selectInvestments = (state) => state.investments;

/** True while a Investment List request is in flight. */
export const selectListLoading = (state) => state.listLoading;

/** The Investment List failure text, or `null`. */
export const selectListError = (state) => state.listError;

// ─── App Component ───────────────────────────────────────────────────

/**
 * Top-level App component for the AI Investment Run SPA.
 *
 */
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ─── Local UI State ───────────────────────────────────────────

  const [helpVisible, setHelpVisible] = useState(false);

  /**
   * The Investment Name whose Run Dialog is open, or `null` when none is (Req 5.2:
   * at most one Run Dialog).
   *
   * The dialog's own state — its Attachment Set, its Query Text, its submission
   * phase and its messages — is **not** held here. Only "which row opened it"
   * is, which is what makes Req 5.3 structural: the name is the dialog's `key`
   * and the dialog is unmounted while this is `null`, so a freshly opened dialog
   * is a fresh mount and the previous one's state no longer exists rather than
   * being cleared. See `RunInvestmentDialog`'s JSDoc.
   */
  const [runInvestmentName, setRunInvestmentName] = useState(null);

  /**
   * Monotonic token identifying the newest list request.
   *
   * `listInvestments` accepts no caller signal — its only abort is its own
   * 10-second budget — so an earlier request cannot be cancelled when a second
   * one starts. The token makes a superseded response a no-op instead: it is
   * compared after the await, and a reply that is no longer the newest is
   * dropped before it reaches `dispatch`. Without it, a slow first load landing
   * after a fast Refresh would overwrite the fresher list.
   */
  const loadTokenRef = useRef(0);

  // ─── Data Loading ─────────────────────────────────────────────

  /**
   * Sends one Investment List request and folds the outcome into state.
   *
   * The three outcomes `api.mjs` defines are kept distinct:
   *   * `{ ok: true }`  — the validated entries are stored;
   *   * `{ ok: false }` — a payload rule failed, and its `message` is already
   *     the exact text Req 9.3-9.10 prescribe, so it is displayed verbatim;
   *   * a throw         — a transport failure, shaped by `listFailureMessage`.
   *
   * Both failure paths dispatch the same action, because Req 4.7 and Req 4.8
   * prescribe the same state transition for them.
   */
  const loadInvestments = useCallback(async () => {
    const token = ++loadTokenRef.current;
    dispatch({ type: INVESTMENTS_LOAD_STARTED });

    try {
      const result = await listInvestments();
      if (token !== loadTokenRef.current) return;

      if (result.ok) {
        dispatch({ type: INVESTMENTS_LOAD_SUCCEEDED, investments: result.investments });
      } else {
        dispatch({ type: INVESTMENTS_LOAD_FAILED, message: result.message });
      }
    } catch (error) {
      if (token !== loadTokenRef.current) return;
      dispatch({ type: INVESTMENTS_LOAD_FAILED, message: listFailureMessage(error) });
    }
  }, []);

  // Req 1.1: one Investment List request when the page is displayed. The
  // dependency is a stable `useCallback`, so this runs on mount and not again;
  // every later load comes from Refresh.
  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  // ─── Derived View ─────────────────────────────────────────────

  // Newest deployment first.
  //
  // **This is a deliberate divergence from Req 3.2**, which fixes the initial
  // Sort Key to `name` and the initial Sort Direction to `ascending` "before it
  // displays any table row". The ordering here is a product decision taken
  // after that criterion was written: the list answers "what was deployed
  // lately", so the newest rows are the ones worth putting at the top. Req 3.2
  // needs updating to match, and until it is, this is the one place the two
  // disagree.
  //
  // Req 3.6's `descending` comparator and Req 3.7's tie-break are still honoured
  // exactly, because both live in `sortInvestments`: entries whose Deployment
  // Timestamps denote the same instant come out in ascending lowercased-`name`
  // order, since that tie-break is applied after the reversal rather than being
  // flipped with the primary key.
  //
  // Derived at render time rather than held in state, so the Investment List in
  // memory is never reordered (Req 3.9, 9.9).
  const visibleInvestments = useMemo(
    () => sortInvestments(selectInvestments(state), 'deployedAt', 'descending'),
    [state.investments],
  );

  // ─── Handlers ─────────────────────────────────────────────────

  function handleHelp() {
    setHelpVisible(true);
  }

  /**
   * Req 5.2: a row's "Run" button opens the Run Dialog for that row's investment.
   *
   * Nothing else happens here — no request is sent, because the dialog is the
   * confirmation step that precedes the Run Request, and the dialog owns the
   * submission.
   *
   * @param {string} investmentName
   */
  function handleRun(investmentName) {
    setRunInvestmentName(investmentName);
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="app-root">
      <HeaderBar
        onHelp={() => handleHelp()}
      />

      <Container as="main" className="py-4">
        <InvestmentList
          investments={visibleInvestments}
          loading={selectListLoading(state)}
          error={selectListError(state)}
          onRefresh={() => loadInvestments()}
          onRun={(name) => handleRun(name)}
        />
      </Container>

      {helpVisible && <Help open={helpVisible} onClose={() => setHelpVisible(false)} />}

      {/* Req 5.2, 5.3: at most one Run Dialog, and a freshly opened one carries
          nothing over from a previously opened one. Both hold structurally — the
          dialog is unmounted while no row is selected, and `key` makes a
          different row a different component instance — so there is no reset to
          perform here. Focus returns to the "Run" button that opened it, which
          react-bootstrap's Modal restores on hide. */}
      {runInvestmentName !== null && (
        <RunInvestmentDialog
          key={runInvestmentName}
          investmentName={runInvestmentName}
          open
          onClose={() => setRunInvestmentName(null)}
        />
      )}
    </div>
  );
}

export { App };
export default App;
