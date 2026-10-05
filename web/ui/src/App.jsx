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
  /** The Investment List as delivered, unordered and unmodified. */
  investments: [],
  /** True from the moment a list request is sent until it settles. */
  listLoading: false,
  /** The failure text to display, in its final wording, or `null`. */
  listError: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────

export const LIST_ERROR_TIMED_OUT = 'The request timed out';
export const LIST_ERROR_NO_MESSAGE = 'The server returned no error message';

/**
 * @param {string} detail  One of the two constants above, or the API's own
 *   error message.
 * @returns {string}
 */
export function listFailedMessage(detail) {
  return `Failed to load investments: ${detail}`;
}

/**
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
      return { ...state, listLoading: true, listError: null };
    }

    case INVESTMENTS_LOAD_SUCCEEDED: {
      const investments = Array.isArray(action.investments) ? action.investments : [];
      return { ...state, investments, listLoading: false, listError: null };
    }

    case INVESTMENTS_LOAD_FAILED: {
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
 * Top-level App component.
 *
 */
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ─── Local UI State ───────────────────────────────────────────

  const [helpVisible, setHelpVisible] = useState(false);

  const [openInvestmentName, setOpenInvestmentName] = useState(null);

  const loadTokenRef = useRef(0);

  // ─── Data Loading ─────────────────────────────────────────────

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

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  // ─── Derived View ─────────────────────────────────────────────

  const visibleInvestments = useMemo(
    () => sortInvestments(selectInvestments(state), 'deployedAt', 'descending'),
    [state.investments],
  );

  // ─── Handlers ─────────────────────────────────────────────────

  function handleHelp() {
    setHelpVisible(true);
  }

  /**
   * @param {string} investmentName
   */
  function handleOpen(investmentName) {
    setOpenInvestmentName(investmentName);
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
          onOpen={(name) => handleOpen(name)}
        />
      </Container>

      {helpVisible && <Help open={helpVisible} onClose={() => setHelpVisible(false)} />}
    </div>
  );
}

export { App };
export default App;
