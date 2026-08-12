# Module PRD — SuperAdmin College Management

## 1. Goal
To provide the central Agency (SuperAdmins) the ability to onboard new Colleges into the network and provision their initial College Admin account.

## 2. Roles Involved
*   **SuperAdmin / Agency Staff:** Fills out a form with College Name and the initial College Admin's email address.
*   **College Admin:** Is programmatically created in the database, receives an invitation/reset-password link via email, and is assigned to the newly created college.

## 3. Database Touchpoints
*   `colleges` (Write) - Create the new college entity.
*   `users` (Write) - Create the new college admin profile.
*   `auth.users` (Write) - Supabase Admin API creates the auth user and injects the `college_admin` role and `college_id` into their JWT `app_metadata`.

## 4. Stage & Actor Matrix (The Ripple Effect)

### STAGE 1: College Creation
*   **Current State:** Agency Dashboard (`/agency/dashboard/colleges`)
*   **SuperAdmin Permissions:** Full access to create a college.
*   **Trigger Action:** SuperAdmin submits the "Add College" form with College Name and Admin Email.
*   **System Reflection (Transition to Stage 2):** 
    1. Insert into `colleges` table and get the new `college_id`.
    2. Use Supabase Admin Auth API to create the user account for the admin, injecting the `college_id` and `college_admin` role.
    3. Insert the user into `public.users`.
    4. Send a password reset email to the newly created college admin.

### STAGE 2: College Admin Onboarding
*   **Current State:** `invited`
*   **College Admin Permissions:** Can click the email link to set their password.
*   **Trigger Action:** College admin sets their password and logs in.
*   **System Reflection:** Middleware detects `college_admin` and `college_id` in their JWT and routes them to their isolated `/college/dashboard`.

## 5. Security & RBAC Enforcement

1. **Route/Middleware Layer:** `/agency/*` routes are strictly locked to `superadmin` and `agency_staff`.
2. **Service Layer:** The API endpoint or Server Action that creates the college and user requires the `SUPABASE_SERVICE_ROLE_KEY`. We will verify the caller's JWT has `role === 'superadmin'` before executing the Admin API call to prevent privilege escalation.
3. **Database RLS Layer:** Only `superadmin` or `agency_staff` can INSERT into `colleges`.
