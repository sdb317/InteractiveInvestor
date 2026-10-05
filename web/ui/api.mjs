// Feature: 
//
// The API client: the only module that speaks to the actual API.
//
// The endpoints this module speaks to:
//
//   listInvestments()                                 GET  /api/investments
//
/* ------------------------------------------------------------------------- */
/* GET /api/investments                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Requests one Workflow List and validates the payload (Req 1.1, 4.2, 9.3-9.11).
 *
 * The body is read as **bytes**, not as text or through `response.json()`,
 * because three of Req 9.3's clauses are stated over bytes: UTF-8
 * decodability, a leading byte order mark, and the 1 MiB size cap. Handing
 * `payload.mjs` the bytes lets it decide all three; `response.json()` would
 * have already silently replaced ill-formed sequences with U+FFFD and thrown
 * away the BOM question.
 *
 * The two kinds of failure are reported differently on purpose:
 *
 *   * a transport failure **throws** an {@link ApiError} — the caller shapes
 *     `Failed to load investments: <error>` from the branch (Req 1.7);
 *   * a payload failure is **returned** as `{ ok: false, ruleId, message }`
 *     straight from `validateWorkflowListPayload`, whose `message` is already
 *     the exact text Req 9.3-9.10 prescribe and must be displayed verbatim.
 *
 * Folding the second into an `ApiError` would give it a numeric `httpStatus`
 * (the response *was* a success) and the caller would then mistake it for the
 * non-success branch and wrap it in the wrong sentence.
 *
 * The 10-second budget is the only abort this function admits — no caller
 * signal is accepted. Req 1.1 allows exactly one list request on load and one
 * per Refresh activation, and Req 4.5 keeps Refresh disabled while one is in
 * flight, so there is no legitimate caller-side cancellation to expose; adding
 * one would give the caller a fourth failure branch the requirements have no
 * message for.
 *
 * @returns {Promise<{ ok: true, investments: Array<{ name: string, deployedAt: string }> }
 *   | { ok: false, ruleId: string, message: string }>}
 * @throws {ApiError} Timeout, unreachable, or non-success (Req 1.7).
 */
export async function listInvestments() {
    // await fetch
}

