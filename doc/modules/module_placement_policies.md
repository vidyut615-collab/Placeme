# Placement Policy Engine Module

## Purpose
The Placement Policy Engine enforces configurable recruitment rules established by individual colleges. It prevents unauthorized applications, handles offer upgrades, enforces dream/super-dream limits, and applies restrictions based on academic performance and previous placement outcomes (like no-shows or withdrawn applications).

## Architecture

The engine is built around the philosophy: "Placeme defines the configurable building blocks; the college defines the placement policy."

### Core Components
1. **Database Schema (`00005_placement_policy_engine.sql`)**: 
   - `placement_policies`: Stores the 20-policy JSONB configuration per college.
   - Foundation tables: `placement_levels`, `placement_categories`, `job_types`, `placement_cycles`.
   - Logging tables: `event_attendance`, `policy_overrides`, `student_training_progress`.
2. **Policy Evaluator (`src/lib/policy-engine.ts`)**: 
   - Central function `evaluatePolicies(config, studentContext, jobContext) -> PolicyResult`.
   - Before evaluating, `gatherStudentContext` constructs a comprehensive view of the student's history (offers, applications, no-shows, GPA, backlogs).
3. **UI Configuration (`src/components/PlacementPolicyEditor.tsx`)**:
   - 20 modular sub-components (one for each policy) allowing College Admins to construct their rules.
4. **Enforcement (`src/app/(dashboards)/student/actions.ts`)**:
   - Hooked directly into `applyForJob`. If a student violates an active policy, the action is blocked and a detailed violation message is returned.

## 20 Truskill Policies Implemented
1. **Registration & Participation**: Mandatory vs optional cycle registration.
2. **Job Eligibility Criteria**: GPA, backlogs, gaps, 10th/12th minimums.
3. **Application Limits**: Max total, active, per-cycle, or daily/weekly applications.
4. **Application Withdrawal**: Whether withdrawing is allowed post-shortlist.
5. **No-Show / Absenteeism**: Restrictions for unexcused absences.
6. **Number of Offers**: Max offers a student can hold or accept.
7. **Upgrade / Next Offer**: Minimum CTC increment required to apply for a new job while holding an offer.
8. **Job Type Classification**: Rules mapping to Core vs Non-Core jobs.
9. **Placement Levels / Tiers**: Standard tiering hierarchy.
10. **Placement Categories**: Groupings within levels.
11. **Level / Category Movement**: Restrictions moving horizontally or vertically between tiers.
12. **Attempt / Opportunity Limits**: Capping total placement shots per student.
13. **Dream Opportunity**: Allowing a specific tier to override standard limits.
14. **Super Dream / Premium**: A higher tier overriding Dream limits.
15. **Special Exceptions**: Custom logic bypasses (e.g., PPOs).
16. **Offer Acceptance**: Time limits to accept or decline offers.
17. **Placement Completion**: Defining when a student is officially "Placed" (and thus debarred from further applications).
18. **Training Readiness**: Prerequisites for completing prep modules.
19. **Academic Clearance**: When backlogs must be cleared.
20. **Override Management**: T&P admin ability to grant specific students exceptions (`policy_overrides` table).

## Future Extensions
- Policies 8, 9, 10, 15, and 16 require additional UI screens to manage their lookup tables (e.g., creating the actual Levels, Categories, and Exceptions). The schema and engine are ready to consume them once populated.
