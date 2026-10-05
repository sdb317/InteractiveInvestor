---
inclusion: fileMatch
fileMatchPattern: "**/*.py"
---

# Python Coding Standards

This document outlines the conventions and standards adopted across the codebase. Adherence to these guidelines ensures code consistency, readability, and maintainability for all developers.

---

## 1. General Principles

*   **Readability:** Code must prioritize readability. Use meaningful names, concise comments, and logical structure.
*   **Style Guide:** The code generally follows **camelCase** for identifiers. While PEP 8 is the Python standard, the project follows established camelCase conventions.
*   **Consistency:** Maintain consistent patterns across modules, especially within Django/DRF components.

## 2. Naming Conventions

| Element | Convention | Example | Notes |
| :--- | :--- | :--- | :--- |
| **Modules/Files** | `camelCase` | `campaignView.py`, `baseSerializer.py` | Follow standard project file naming. |
| **Classes** | `PascalCase` | `CampaignViewSet`, `BaseSerializer` | Used for defining classes. |
| **Functions/Methods** | `camelCase` | `getResponse`, `createUser` | Used for functions and methods. |
| **Variables/Attributes** | `camelCase` | `campaignData`, `userId` | Local variables and instance attributes. |
| **Constants** | `UPPER_SNAKE_CASE` | `API_AUDIENCE`, `MAX_USERS` | Module-level constants (e.g., API keys, magic numbers). |

## 3. Docstrings and Comments

### A. Docstrings
*   **Purpose:** Use docstrings (triple quotes `"""..."""`) for all classes and public methods/functions.
*   **Content:** Docstrings should briefly explain what the element does, what arguments it takes, and what it returns.
*   **File Headers:** When implementing core modules (like `CampaignViewSet.py`), maintain block comments detailing the file's purpose (`## File : ...`, `## Description : ...`).

### B. Comments
*   Use inline comments (`#`) only to explain *why* a piece of code exists, not *what* it does (the code should explain the 'what').
*   Use descriptive comments for complex sections or temporary workarounds (e.g., `!!!TEMPORARY!!!`).

## 4. Imports and Structure

*   **Ordering:** Follow the standard order:
    1.  Standard Library imports (e.g., `import re`, `import json`, `from datetime import datetime`).
    2.  Third-party/Framework imports (e.g., `from rest_framework import status`, `from jose import jwt`).
    3.  Local application/module imports (e.g., `from . import definitions`, `from interactiveInvestor import settings`).
*   **Relative Imports:** Use relative imports (`from . import definitions`) when referring to modules within the same package.

## 5. Error Handling and Logging

*   **Error Handling:**
    *   Use `try...except` blocks liberally, but always attempt to catch the **most specific exception** possible (e.g., `jwt.ExpiredSignatureError`, `jwt.JWTClaimsError`) rather than catching generic `Exception`.
    *   For API responses, use specific HTTP status codes (e.g., `status.HTTP_401_UNAUTHORIZED`, `status.HTTP_500_INTERNAL_SERVER_ERROR`).
*   **Logging:**
    *   Initialize logging early (e.g., `logging.basicConfig(level=logging.DEBUG)`).
    *   Use `logging.info()` for general flow tracking (e.g., "View/ViewSet method entered").
    *   Use `logging.error()` for failure points that require external attention.

## 6. Function and Method Implementation Details

### A. Middleware (e.g., `GoogleSignInMiddleware.py`)
*   The `__call__(self, request)` method must handle authorization logic flow:
    1.  Check if the path requires authentication.
    2.  If authentication is needed, extract and validate the token (Bearer schema, RS256 algorithm).
    3.  Handle specific JWT errors (`ExpiredSignatureError`, `JWTClaimsError`) and return appropriate 401 responses with structured error bodies (`{"code": "...", "description": "..."}`).
    4.  Pass the request to the next middleware/view only if authentication is successful.

### B. Serializers and Views (e.g., `BaseSerializer.py`, `CampaignViewSet.py`)
*   **Abstract Base Classes:** Utilize `BaseSerializer` and `BaseViewSet` when repeating common logic (e.g., `toInternalValue`, `list`, `update`).
*   **State Management:** When implementing state transitions (e.g., Activating a Campaign), business logic should be handled explicitly (e.g., checking if `data['state'] == dataCurrent['state']`) before calling `super()` methods.
*   **Data Manipulation:** Be cautious with data fetching and manipulation, especially involving external services (like the Workflow Engine). Use deep copies (`copy.deepcopy()`) when modifying data retrieved from the request body to avoid altering the original object.

### C. Database Interaction (`audienceQuery.py`)
*   **Security/Data Integrity:** When querying or saving data, always handle string conversions carefully, especially when JSON data is stored in SQL columns.
*   **Database Interaction:** Use parametrized queries (`%s`) and explicit methods like `self.ParseValue()` to prevent SQL injection.
*   **Return Types:** Be explicit about how data types change (e.g., converting a list of dicts to a JSON string for database storage and converting it back when retrieving).

---
**Review Status:**
*   **Status:** Complete.
*   **Next Steps:** Developers should review and adhere to these standards moving forward.
