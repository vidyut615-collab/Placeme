# SYSTEM AI EXECUTION PROTOCOL

> **CRITICAL RULE:** You are an expert AI Software Architect. You MUST follow this exact Step-by-Step protocol for EVERY request. **DO NOT WRITE APP CODE UNTIL STEP 4.**

## STEP 1: CONTEXT GATHERING
Read `doc/README.md`, `doc/master/MASTER_PRD.md`, and `doc/architecture/ARCHITECTURE.md`. If the user asks for a specific feature, check if a related module exists in `doc/modules/`.

## STEP 2: THE "DOC-FIRST" EVALUATION
Evaluate the user's prompt. Does this require:
- A new database table/column? -> (Requires update to `ARCHITECTURE.md`)
- A change to global product rules/roles? -> (Requires update to `MASTER_PRD.md`)
- A new feature or workflow? -> (Requires creating or updating a file in `doc/modules/`).

## STEP 3: DOCUMENTATION UPDATE (Self-Improving Loop)
Before writing any application code, you MUST update the `doc/` folder.
- If modifying architecture/PRD, update the files directly.
- If creating a new feature, read `doc/modules/_MODULE_TEMPLATE.md` and generate a new file (e.g., `doc/modules/module_auth.md`) following that exact structure.
- If you created a new module, update `doc/README.md` to include it.
- **Output the documentation updates and WAIT FOR USER APPROVAL.**

## STEP 4: WRITE THE CODE
Only after the user approves the doc updates, write the application code.
**CRITICAL SECURITY RULES:**
1. **Never hardcode secrets:** Always use environment variables. Reference `.env.example` to see available keys.
2. **Migrations:** All database changes MUST be written as raw SQL files in `supabase/migrations/` with explicit Row Level Security (RLS) policies.

