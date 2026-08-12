# Module PRD — Student Dashboard

## 1. Goal
To provide students with a personal command center where they can view their profile, discover job opportunities (both from their college and globally from the agency), and track their applications.

## 2. Roles Involved
*   **Student:** The primary user of this module.

## 3. Database Touchpoints
*   `students` (Read) - Fetch profile data (GPA, resume, department, year, type).
*   `colleges` (Read) - Fetch college name and details.
*   `jobs` (Read) - View jobs available to them (where `college_id` matches theirs OR `college_id IS NULL`).
*   `applications` (Read/Write) - Track their own job applications.

## 4. Sub-Modules & Views

### 1. Student Dashboard (`/student/dashboard`)
*   **Purpose:** Welcome screen displaying their profile summary and high-level metrics (e.g., pending applications, new jobs).
*   **Data Displayed:** Full Name, Email, College Name, Graduation Year, Degree Type, Department.

### 2. Jobs Board (`/student/jobs`)
*   **Purpose:** Discover and apply to jobs.
*   **Data Displayed:** Agency global jobs + College-specific internal jobs.

### 3. Applications Tracker (`/student/applications`)
*   **Purpose:** Track the status of their submitted applications (`applied` -> `shortlisted` -> `interviewing` -> `offered` -> `hired`).

### 4. Profile (`/student/profile`)
*   **Purpose:** View and update their `profile_data` (resume, GPA).

## 5. Security & RBAC Enforcement
1. **Route Layer:** The `/(dashboards)/student/*` route group is protected by middleware, ensuring only users with the `student` role can access it.
2. **Database Layer:** The RLS policies on `students`, `jobs`, and `applications` strictly ensure the student only sees data matching their `auth.uid()` and their assigned `college_id`.
