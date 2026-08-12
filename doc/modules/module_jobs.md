# Module PRD — Job Posting

## 1. Goal
To allow both the Central Agency and individual Colleges to post jobs, with strict visibility enforcement based on who created the job.

## 2. Roles Involved
*   **SuperAdmin / Agency Staff:** Can create "Global Jobs".
*   **College Admin / College Staff:** Can create "Local Jobs".
*   **Students:** Can view jobs based on the visibility rules below.

## 3. Database Touchpoints
*   `jobs` (Read/Write)
    *   **Global Jobs:** `college_id IS NULL`. These cascade to all students.
    *   **Local Jobs:** `college_id = {JWT college_id}`. These are only visible to students in that specific college.

## 4. Sub-Modules & Views

### 1. Reusable Create Job Modal
*   **Purpose:** A unified UI component (`CreateJobModal.tsx`) that accepts a Server Action as a prop. 

### 2. Agency Job Actions (`/agency/actions.ts`)
*   **Action:** `createGlobalJob(formData)`
*   **Logic:** Enforces `superadmin` or `agency_staff` role. Inserts into `jobs` without passing a `college_id` (so it defaults to `null`).

### 3. College Job Actions (`/college/actions.ts`)
*   **Action:** `createLocalJob(formData)`
*   **Logic:** Enforces `college_admin` or `college_staff` role. The Supabase RLS policy strictly ensures that the job is inserted with the `college_id` matching their JWT token.

## 5. Security & RBAC Enforcement
1. **Row Level Security:**
    *   `CREATE POLICY "Agency can do all on jobs" ON jobs FOR ALL USING (auth_role() IN ('superadmin', 'agency_staff'));`
    *   `CREATE POLICY "College Staff can manage own college jobs" ON jobs FOR ALL USING (college_id = auth_college_id() AND auth_role() IN ('college_admin', 'college_staff'));`
2. **Action Layer:** Server actions verify the user's role explicitly before executing the database transaction.
