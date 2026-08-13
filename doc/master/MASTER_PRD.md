# Master PRD — Placeme

> **AI INSTRUCTION:** This is a living document. Expand and update the placeholders `[...]` as you learn more about the project from the user. 

## 1. Product Vision
- **Name:** Placeme
- **Goal:** An internal job board platform for a central hiring management agency to manage their network of colleges. It centralizes job postings, tracks student applications (both global agency jobs and internal college jobs), and dynamically enforces college-specific placement policies.
- **Target Audience:** Agency Staff (SuperAdmin/Staff), College Administrators, College Staff, and Students.

## 2. Core Personas (Actors)
- **SuperAdmin (Agency):** Ultimate access. Creates colleges, adds College Admins and Staff. Responsible for inviting students (bulk/individual) to specific colleges to trigger onboarding.
- **Agency_Staff:** Can post global jobs visible to all colleges and track applications to enforce placement policies (e.g., debarment).
- **College_Admin:** Main administrator for a specific college. Has access to post internal college jobs, configure college-specific placement policies, and view their student directory/invitations. *Cannot invite users.*
- **College_Staff:** Limited access within their specific college. Can view and manually update application stages (Shortlist, Interview, Offer, Hire) for internal jobs.
- **Student:** Invited via email. Completes their own onboarding (self-authored data). Can view and apply to both global Agency jobs and their specific College's internal jobs. Chooses between offers if concurrent.

## 3. Global RBAC & Security Rules (Non-Negotiables)
1. **Fail-Closed:** If permission evaluation fails, access is DENIED.
2. **No IDOR:** Never trust IDs in request payloads; always verify against the authenticated user's token/session.
3. **State-Driven Workflow:** Permissions are NOT static. A user's access to a resource changes dynamically based on the resource's current `status` / `state`.
4. **Data Isolation (Zero-Trust):** Colleges are strictly isolated from one another. A College Admin/Staff/Student cannot see any data (users, jobs, applications) belonging to another college. The Agency has global visibility.

## 4. Scope & Phasing
- **In Scope for V1:** 
  - [x] SuperAdmin College & Staff creation, including inline quick actions (Edit, Add Admin, Secure Delete).
  - [x] College Admin isolated dashboard powered by Zero-Trust RLS.
  - [x] Central Agency Dashboard (Overview, Colleges, Jobs, Students).
  - [x] Secure ZeptoMail Onboarding Flow & Deferred DB Insertion (users only become active in DB post-password creation).
  - [x] Idempotent Invite Flow: Handles redundant invites by bypassing DB failures and smoothly resending the secure invite link for pending users.
  - [x] Configurable Onboarding Fields: SuperAdmin can pre-fix `Years`, `Types`, and `Departments` lists directly onto the college profile for Students to select from during setup.
  - [ ] Student Bulk Email invitation.
  - [x] Global Agency Job posting and College Internal Job posting.
  - [x] Unified Agency Jobs command center (search, sort, filter across all jobs).
  - [x] Application State Machine (Tabbed UI with 10 explicit applicant stages).
  - [x] 9-Core Configurable Placement Policies (Registration/Eligibility tracking, No-Show rules, Withdrawals, Disciplinary strikes, Offer Upgrades, and Smart Auto-Resolve Reinstatements).
- **Out of Scope:** [Features deferred to later versions]