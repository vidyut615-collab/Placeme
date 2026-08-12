# MODULE TEMPLATE (INSTRUCTIONAL FILE)

> **AI INSTRUCTION:** Do NOT modify this file. When the user requests a new feature, CREATE a new file (e.g., `module_expenses.md`) and copy this exact structure.

---
# Module PRD — [Feature Name]

## 1. Goal
[1-2 sentences explaining what this module achieves.]

## 2. Roles Involved
*   **[Actor A]:** [What they do]
*   **[Actor B]:** [What they do]

## 3. Database Touchpoints
*   `[table_name]` (Read/Write)
*   `[table_name]` (Read only)

## 4. Stage & Actor Matrix (The Ripple Effect)
*(AI: Map out the state machine. Explain how Actor A's action changes the state, and how that state change affects Actor B's permissions).*

### STAGE 1: [State Name, e.g., Drafting]
*   **Current State:** `[STATUS_STRING]`
*   **Actor A Permissions:** `[e.g., read, update, submit]`
*   **Actor B Permissions:** `[e.g., none]`
*   **Trigger Action:** [Actor A does X]
*   **System Reflection (Transition to Stage 2):** 
    1. Update state to `[NEW_STATUS]`.
    2. [e.g., Notify Actor B].

### STAGE 2: [State Name, e.g., Pending Approval]
*   **Current State:** `[NEW_STATUS]`
*   **Actor A Permissions:** `[e.g., read only]` (Loses update access)
*   **Actor B Permissions:** `[e.g., read, approve, reject]`
*   **Pre-Condition (Separation of Duties):** [e.g., Actor B cannot be the same user as Actor A]

## 5. Security & RBAC Enforcement
*(AI: Explicitly define how the 3-Layer defense will secure this specific module).*

1. **Route/Middleware Layer:** [e.g., Middleware will restrict `/app/grades/*` to `Teacher` and `Principal` roles only.]
2. **Service Layer:** [e.g., `grade.service.ts` will check if the assignment status is 'Submitted' before allowing the Teacher to grade it.]
3. **Database RLS Layer:** [e.g., RLS on `grades` table will ensure `auth.uid()` matches the Student's ID for SELECT queries.]