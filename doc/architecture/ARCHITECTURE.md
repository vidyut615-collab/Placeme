# Architecture Document

> **AI INSTRUCTION:** This is the technical contract. Before writing database migrations or API endpoints, update this file. The code must ALWAYS match this schema.

## 1. Tech Stack
- **Frontend:** Next.js 15+ (App Router), React, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL DB, Row Level Security, Storage)
- **Language:** TypeScript (Strict Mode)

## 2. Global Database Schema (RBAC Core)
*(AI: Expand this schema as features are added)*

### `users`
- `id` (PK, UUID) references auth.users
- `email` (String, Unique)
- `role` (Enum: 'superadmin', 'agency_staff', 'college_admin', 'college_staff', 'student')
- `college_id` (FK, UUID, Nullable - Null for Agency roles)
- `created_at` (Timestamp)

### `colleges`
- `id` (PK, UUID)
- `name` (String)
- `website` (String, Nullable)
- `location` (String, Nullable)
- `description` (Text, Nullable)
- `contact_email` (String, Nullable)
- `contact_phone` (String, Nullable)
- `logo_url` (String, Nullable)
- `onboarding_fields` (JSONB - e.g. `{ "years": [], "types": [], "departments": [] }`)
- `created_at` (Timestamp)

### `students` (Profile Data)
- `id` (PK, UUID)
- `user_id` (FK to users, Unique)
- `college_id` (FK to colleges)
- `profile_data` (JSONB - Self-authored fields like GPA, resume, skills, academic_10th, academic_12th, etc.)
- `onboarding_status` (Enum: 'invited', 'completed')

### `jobs`
- `id` (PK, UUID)
- `title` (String)
- `description` (Text)
- `company_name` (String, Nullable)
- `compensation_ctc` (Numeric, Nullable)
- `compensation_fixed` (Numeric, Nullable)
- `compensation_variable` (Numeric, Nullable)
- `application_deadline` (Timestamp, Nullable)
- `college_id` (FK, UUID, Nullable - Null means it's an Agency global job)
- `created_by` (FK to users)
- `status` (Enum: 'active', 'paused', 'deleted')
- `job_type_id` (FK to job_types, Nullable)
- `placement_level_id` (FK to placement_levels, Nullable)
- `placement_category_id` (FK to placement_categories, Nullable)
- `cycle_id` (FK to placement_cycles, Nullable)
- `created_at` (Timestamp)

### `applications`
- `id` (PK, UUID)
- `job_id` (FK to jobs)
- `student_id` (FK to students)
- `status` (Enum: 'applied', 'shortlisted', 'interviewing', 'selected', 'offered', 'offer_accepted', 'offer_declined', 'hired', 'joined', 'not_joined', 'withdrawn', 'rejected')
- `offer_amount` (Numeric, Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `placement_policies`
- `id` (PK, UUID)
- `college_id` (FK to colleges, Unique)
- `config` (JSONB - Full configuration object for 20 Truskill policies)

### `placement_cycles`, `job_types`, `placement_levels`, `placement_categories`
- Core configuration tables supporting the policy engine dimensions.

### `invitations`
- `id` (PK, UUID)
- `email` (String)
- `role` (Enum: 'superadmin', 'agency_staff', 'college_admin', 'college_staff', 'student')
- `college_id` (FK to colleges, Nullable)
- `invited_by` (FK to users)
- `status` (Enum: 'pending', 'accepted', 'expired')
- `created_at` (Timestamp)

## 3. Secrets Management (CRITICAL)
- **Environment Variables:** API keys and database URLs must NEVER be hardcoded in the application code.
- **Security:** Real keys are stored locally in a `.env.local` file, which is strictly ignored by `.gitignore` and never committed to the repository.
- **Required Variables:** The application expects the following variable names to exist in `.env.local`. *(AI Instruction: Use these exact variable names when writing connections or API routes, but do not hardcode real values)*:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 4. API & Error Contract
- All API responses must follow: `{ "data": ... }` or `{ "error": { "message": ... } }`
- **Service Layer Abstraction:** UI components must NEVER contain database logic. All database calls must be abstracted into `src/services/` so the backend is modular and swappable.

## 5. RBAC & Security Enforcement (Defense in Depth)
Security must be enforced across THREE layers.

1. **Route Level (Next.js Middleware):** 
   - A `middleware.ts` file must intercept requests and block unauthorized route access.
   - **CRITICAL PERFORMANCE RULE:** Middleware runs on the Edge and should NOT query the database to check roles. User roles and `college_id` MUST be injected into the Supabase Auth Custom JWT (App Metadata) upon login/signup/role-assignment. Middleware will decode this JWT to route the user instantly.
2. **Action Level (Service Layer):** 
   - `src/services/` must verify state-based permissions (e.g., "Is this job in an Active state?", "Has the student already been Hired?") before executing mutations. 
3. **Data Level (Supabase RLS):** 
   - Row Level Security acts as the ultimate vault. RLS policies must read the role and `college_id` from the JWT (`auth.jwt() -> app_metadata -> role`).
   - **SuperAdmin/Agency:** `true` for all.
   - **College Admin/Staff:** `college_id = auth.jwt()->app_metadata->college_id`.
   - **Student:** Can view agency jobs (`college_id IS NULL`), college jobs (`college_id = ...`), and apply based on their own `student_id`.