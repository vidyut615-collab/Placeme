# Module PRD — College Admin Dashboard

## 1. Goal
To provide College Admins with a dedicated portal to manage their specific college's placement activities. They should be able to view their enrolled students, track applications, and post jobs that are exclusively visible to their students.

## 2. Roles Involved
*   **College Admin / College Staff:** Uses this dashboard to manage their local college data.

## 3. Database Touchpoints
*   `colleges` (Read) - View their own college details.
*   `students` (Read/Write) - View students enrolled in their college.
*   `jobs` (Read/Write) - Create and manage jobs specific to their college (`college_id = auth.jwt.app_metadata.college_id`), as well as view global agency jobs (`college_id IS NULL`).
*   `applications` (Read/Write) - Track applications for their college's jobs.

## 4. Sub-Modules & Views

### 1. College Dashboard Overview (`/college/dashboard`)
*   **Purpose:** High-level metrics for their specific college (Total Enrolled Students, Active Local Jobs, Active Global Jobs).

### 2. College Job Board (`/college/jobs`)
*   **Purpose:** Allow the College Admin to post private jobs that are only visible to students in their specific college. 
*   **Trigger Action:** College Admin creates a Job -> `college_id` is automatically set to their own `college_id`.
*   **Ripple Effect:** RLS ensures only students belonging to this college can see these jobs.

### 3. Student Directory (`/college/students`)
*   **Purpose:** A local view of all students enrolled in their specific college.

### 4. College Settings (`/college/settings`)
*   **Purpose:** A comprehensive form panel for College Admins to fill and update detailed information about their college (e.g., website, location, description, contact details).
*   **Ripple Effect:** Once updated, these details can be displayed globally across the platform (e.g., in student onboarding, agency dashboards, or public directories).

## 5. Security & RBAC Enforcement
1. **Route Layer:** The `/(dashboards)/college/*` route group is protected by middleware, ensuring only `college_admin` or `college_staff` can access these pages.
2. **Database Layer (Zero-Trust):** Unlike the Agency dashboard which uses the Admin API, the College Dashboard will use the standard authenticated Supabase client. Because the user's `college_id` is embedded in their JWT `app_metadata`, Supabase RLS will automatically filter all queries to only return data where `college_id = auth.jwt.college_id`. This prevents cross-tenant data leaks at the database level.
