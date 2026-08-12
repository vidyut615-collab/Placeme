# Module PRD — Central Agency Dashboard

## 1. Goal
To provide the Central Agency (SuperAdmin and Agency Staff) with a comprehensive command center to manage their network. This includes high-level analytics, global job management, and college oversight.

## 2. Roles Involved
*   **SuperAdmin / Agency Staff:** Uses this dashboard to oversee the entire platform.

## 3. Database Touchpoints
*   `colleges` (Read/Write) - View network size and manage partners.
*   `students` (Read) - Aggregate student metrics.
*   `jobs` (Read/Write) - Create global jobs (`college_id IS NULL`) and track global placement metrics.
*   `applications` (Read) - Track hiring success across the platform.

## 4. Sub-Modules & Views

### 1. Dashboard Overview (`/agency/dashboard`)
*   **Purpose:** High-level metrics (Total Colleges, Total Students, Active Global Jobs).
*   **Widgets:** Metric cards, recent activity feed.

### 2. Colleges Management (`/agency/colleges`)
*   **Purpose:** List partner colleges, perform Quick Actions, and dive into specific College Profiles.
*   **Features Implemented:**
    *   **Add College:** Modal to create college and optionally pre-fix Onboarding Dropdown lists (Years, Types, Departments). Invites first College Admin.
    *   **Edit College:** Rename college via Dropdown Action.
    *   **Add Admin:** Invite additional College Admins to a specific college.
    *   **Delete College:** High-security deletion (Cascade) requiring SuperAdmin password verification.
    *   **College Profile (`/agency/colleges/[id]`):** Dedicated command center for a specific college.
        *   **Configure Onboarding Fields:** Manage custom lists (Years, Types, Departments) for student self-selection.
        *   **Invite Student:** EXCLUSIVE SuperAdmin capability to send Student invitations tied to this specific college.

### 3. Global Job Board (`/agency/jobs`)
*   **Purpose:** Allow the Agency to post jobs that cascade down to ALL colleges on the platform, AND provide a command center to view, search, sort, and filter *every* job on the platform (both Global and Local).
*   **Trigger Action:** Agency creates a Job -> `college_id` is set to `NULL`.
*   **Ripple Effect:** RLS policy `Students can view agency jobs` instantly makes this job visible to all students across all colleges.

### 4. Student Directory (`/agency/students`)
*   **Purpose:** A unified global view of all students (Active and Pending) across the network for cross-college reporting and tracking.

## 5. Security & RBAC Enforcement
1. **Route Layer:** The entire `/(dashboards)/agency/*` route group will be protected by middleware, ensuring only `superadmin` and `agency_staff` can access these pages.
2. **Database Layer:** The RLS policies for `superadmin` automatically grant `ALL` privileges on all tables, bypassing college-specific isolation.
