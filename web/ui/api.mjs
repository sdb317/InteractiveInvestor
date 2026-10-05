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
 * @returns {Promise<{ ok: true, investments: Array<{ name: string, deployedAt: string }> }
 *   | { ok: false, ruleId: string, message: string }>}
 * @throws {ApiError} Timeout, unreachable, or non-success (Req 1.7).
 */
export async function listInvestments() {
    // await fetch
}

