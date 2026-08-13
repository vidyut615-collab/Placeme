# Module: Application Management System

## 1. Overview
The Application Management System is the core engine for tracking a student's journey through a specific job posting. It provides a structured, multi-stage pipeline for College Admins, College Staff, and Agency Staff to review, screen, and progress applicants.

## 2. Core Components
- **Job Details View (`/college/jobs/[jobId]`)**: A tab-based interface separating the job overview from the various applicant stages.
- **Application Status Enum**: Defines the possible states of an application.

## 3. The Pipeline (Stages/Tabs)
When navigating to a Job, the sticky tab bar presents the following views in sequence:
1. **Overview**: Displays a comprehensive dashboard grid showing the job description, company name, CTC/Fixed/Variable compensation, deadline countdown, and classification badges (type, level, category, cycle).
2. **Application**: Students who have applied but have not yet been processed.
3. **Screened**: Students who have passed initial profile screening.
4. **PPT (Pre-Placement Talk)**: Students eligible/attending the Pre-Placement Talk.
5. **Stage 1**: Custom assessment/interview stage 1.
6. **Stage 2**: Custom assessment/interview stage 2.
7. **Stage 3**: Custom assessment/interview stage 3.
8. **Shortlisted**: Students who have passed all stages and are shortlisted for final selection/offers.
9. **Hired**: Students who have been formally hired.
10. **Dropped**: Students who were rejected, withdrew, or did not show up.

## 4. State Machine (Application Statuses)
The `application_status` ENUM in the database maps to these tabs:
- `applied` -> Application
- `screened` -> Screened
- `ppt` -> PPT
- `stage1` -> Stage 1
- `stage2` -> Stage 2
- `stage3` -> Stage 3
- `shortlisted` -> Shortlisted
- `hired` -> Hired
- `dropped` -> Dropped

## 5. Implementation Details
- The UI uses URL Search Parameters (e.g., `?tab=overview`) to manage tab state, keeping the URL shareable and allowing Next.js Server Components to render the appropriate view without client-side hydration bloat.
- Each tab will eventually contain specific Data Tables and action buttons relevant to that stage (e.g., bulk actions to move students to the next stage).
