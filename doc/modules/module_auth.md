# Module PRD — Authentication & Role Navigation

## 1. Goal
To establish the foundational login flow, role-based session management, and primary dashboard routing. This ensures that when a user logs in, the Edge middleware instantly knows their role and routes them to their strictly isolated dashboard.

## 2. Roles Involved
*   **All Roles (`superadmin`, `agency_staff`, `college_admin`, `college_staff`, `student`):** Log in via a **single, common login page** (`/login`) using **Email and Password only** (with a "Forgot Password" flow).
*   **Student:** Clicks an invite link to set their initial password and fill out their self-authored profile during the `/onboarding` step. Once onboarded, they use the common login page like everyone else.

## 3. Database Touchpoints
*   `auth.users` (Read/Write) - Supabase's native auth table.
*   `users` (Read/Write) - Our public profile table syncing with `auth.users`.
*   `students` (Read/Write) - To check the `onboarding_status`.

## 4. Stage & Actor Matrix (The Ripple Effect)

### STAGE 1: Unauthenticated
*   **Current State:** `no_session`
*   **All Actors Permissions:** Access to `/login`, `/auth/callback`, `/invite`, and `/api/auth` endpoints only.
*   **Trigger Action:** User submits login credentials OR clicks a secure ZeptoMail invite link (handled by `/api/auth/confirm`).
*   **Idempotent Invites:** If an invite is sent to an already-pending email, the system gracefully bypasses errors and resends a fresh recovery token link rather than blocking the action.
*   **System Reflection (Transition to Stage 2):** 
    1. Supabase authenticates user and generates JWT.
    2. JWT contains `role` and `college_id` in `app_metadata`.

### STAGE 2: Authenticated but Un-onboarded
*   **Current State:** `invited` (tracked securely via the `invitations` table; public user record is deferred until password creation).
*   **Student/Admin Permissions:** Forced to `/onboarding` route by Edge Middleware.
*   **Trigger Action:** User sets a permanent password and completes their profile (selecting pre-fixed `Years`, `Types`, `Departments` configured by SuperAdmin).
*   **System Reflection (Transition to Stage 3):** 
    1. Update `invitations.status` to `accepted`.
    2. Create official `public.users` and `public.students` records (Deferred DB Insertion).
    3. Route to respective dashboard.

### STAGE 3: Authenticated & Active
*   **Current State:** `active_session`
*   **System Reflection:** Middleware dynamically routes user from the common login page to their separate, strictly isolated dashboard based on JWT `role`:
    *   `superadmin` & `agency_staff` -> `/agency/dashboard`
    *   `college_admin` & `college_staff` -> `/college/dashboard`
    *   `student` -> `/student/dashboard`

## 5. Security & RBAC Enforcement

1. **Route/Middleware Layer:** `src/proxy.ts` decodes the JWT and intercepts any path mismatch (e.g., if a `student` tries to load `/admin/dashboard`, they are instantly redirected back).
2. **Service Layer:** `src/services/auth.ts` will strictly enforce that students can only update their *own* profile during onboarding.
3. **Database RLS Layer:** Even if route layer fails, RLS on `students` prevents a student from reading or writing to another student's profile.
