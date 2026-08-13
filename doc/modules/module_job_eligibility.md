# Module: Job Eligibility Setup

## 1. Overview
The Job Eligibility module allows College Admins and Agency Staff to configure strict application requirements when posting a job. These requirements are evaluated against a student's `profile_data` before allowing them to apply.

## 2. Core Components
- **Job Creation Form**: Modal (`CreateJobModal.tsx`) extended to capture eligibility metrics.
- **Database Storage**: The `eligibility_criteria` JSONB column on the `jobs` table.

## 3. Supported Criteria
The JSONB structure supports the following fields:
- `min_cgpa` (Number, nullable): Minimum CGPA required.
- `min_10th` (Number, nullable): Minimum 10th-grade percentage required.
- `min_12th` (Number, nullable): Minimum 12th-grade percentage required.
- `max_active_backlogs` (Number, nullable): Maximum currently active backlogs permitted.
- `max_historical_backlogs` (Number, nullable): Maximum overall historical backlogs permitted.
- `allowed_departments` (Array of strings): Specific branches/departments eligible to apply.
- `allowed_genders` (Array of strings): Allowed genders (e.g. ['male'], ['female'], or empty for any).

## 4. Implementation Details
- The server actions (`createLocalJob` and `createGlobalJob`) parse these inputs from `FormData` and pack them into the JSONB column.
- Future application logic will pull this JSONB block and compare it against the student's `profile_data` json to either allow or block the application attempt.
