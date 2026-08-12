# Module PRD — Application Management

## 1. Goal
To provide Superadmins, Agency Staff, and College Admins/Staff with a complete dashboard to view, evaluate, and update the status of student applications for any given job.

## 2. Roles Involved
*   **Superadmin & Agency Staff:** Can manage applications for ALL jobs (both Global Agency jobs and Local College jobs).
*   **College Admin & College Staff:** Can manage applications ONLY for jobs posted within their specific `college_id`.

## 3. Database Touchpoints
*   `applications` (Read/Write) - Track and update the `status`.
*   `jobs` (Read) - Fetch the context of the application.
*   `students` (Read) - Fetch the student's profile data (GPA, resume, full name) to display to the admin.

## 4. Sub-Modules & Views

### 1. Job Applications View (`/agency/jobs/[jobId]` & `/college/jobs/[jobId]`)
*   **Purpose:** Lists all students who applied to the specific job.
*   **Data Displayed:** Student Name, Email, Academic Info (Year, Type, Department), GPA, Date Applied, and Current Status.

### 2. Status Progression
*   **Purpose:** Allows admins to update a student's status.
*   **Workflow:** `applied` -> `shortlisted` -> `interviewing` -> `offered` -> `hired`.

## 5. Security & RBAC Enforcement
1. **Route Layer:** The route includes the `jobId`. Admins access the page, and the page checks if they have permission to view the job (via RLS).
2. **Server Action Level:** The `updateApplicationStatus` server action validates the user's role and checks if they have permission to update an application for that specific job.
3. **Database Layer:** The RLS policy on `applications` dictates that College Admins can only UPDATE applications where `job_id IN (SELECT id FROM jobs WHERE college_id = auth_college_id())`. Agency has full access.
