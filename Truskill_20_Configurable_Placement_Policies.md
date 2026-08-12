# Truskill – Configurable Placement Policy Framework

## 20 Policy Modules for College-Controlled Placement Management

### Product Principle

Truskill provides the policy framework and rule engine; the college defines the actual rules, thresholds, classifications, conditions, exceptions and consequences.

Terms such as **Upgrade, Dream, Super Dream, Level, Category, Tier, Offer and Placed** are college-configurable and do not carry a fixed Truskill definition.

---

# Common Configuration Available Across Policies

Every policy should support a common configuration layer.

| Configuration Area | College Control |
|---|---|
| Policy Status | Active / Inactive |
| Policy Name | Fully editable |
| Policy Description | Fully editable |
| Applicability | College / School / Program / Branch / Batch / Semester / Student Group / Individual Student |
| Trigger | College-defined event or placement status |
| Conditions | Student, company, opportunity, offer, academic, training and custom conditions |
| Operators | =, ≠, >, <, ≥, ≤, BETWEEN, IN, NOT IN, etc. |
| Logic | AND / OR / NOT |
| Action | Allow / Restrict / Approval Required / Warning / College-defined action |
| Exceptions | College-defined by company, student, batch, program, opportunity, etc. |
| Override | T&P-controlled override with reason and audit trail |
| Effective Period | Start date, end date, version and priority |

---

# 1. Placement Registration & Participation Policy

### Purpose

Defines who is registered and permitted to participate in the college placement cycle.

### College-Configurable Controls

- Registration requirement: Mandatory / Optional.
- Registration window.
- Registration deadline.
- Late registration rules.
- Approval requirement for late registration.
- Student statuses such as Registered, Eligible, Blocked, Opted Out, Withdrawn or college-defined statuses.
- Applicability by college, school, program, branch, batch, semester, student group or individual student.
- Placement orientation requirement.
- Placement training completion requirement.
- Minimum attendance requirement.
- Academic clearance requirement.
- Placement assessment requirement.
- Action: Allow participation, restrict participation, require T&P approval or apply a college-defined restriction.

---

# 2. Company / Job Eligibility Policy

### Purpose

Determines whether a student can apply to a specific company or job opportunity.

### College-Configurable Controls

#### Academic Criteria

- 10th percentage.
- 12th percentage.
- Diploma percentage.
- Graduation percentage.
- CGPA.
- Semester CGPA.

#### Backlog Criteria

- Active backlogs.
- Historical backlogs.
- Maximum allowed backlogs.
- Backlog clearance requirement.

#### Academic Gap

- Gap allowed / not allowed.
- Maximum permitted gap.

#### Student Attributes

- Program.
- Branch.
- Specialization.
- Batch.
- Passing year.
- College-defined student attributes.

#### Skills & Readiness

- Required skills.
- Certifications.
- Training completion.
- Assessment scores.
- Other college-defined requirements.

#### Rule Logic

Support:

- AND
- OR
- NOT

With operators such as:

- Equal to.
- Not equal to.
- Greater than.
- Greater than or equal to.
- Less than.
- Less than or equal to.
- Between.
- In.
- Not in.
- Contains.
- Does not contain.

---

# 3. Application Limit Policy

### Purpose

Controls how many placement applications a student may submit or maintain.

### College-Configurable Controls

#### Maximum Applications

- Overall.
- Per placement cycle.
- Per level.
- Per category.
- Per company type.
- Per job type.
- Per period.

#### Active Applications

- Maximum active applications.
- Maximum simultaneous applications.

#### Time-Based Limits

- Per day.
- Per week.
- Per month.
- Custom period.

#### Offer-Based Limits

College can define different limits:

- Before first offer.
- After first offer.
- After second offer.
- After selected status.
- After offer acceptance.

#### What Counts as an Application?

College defines whether an application is counted when:

- Student clicks Apply.
- Student confirms application.
- Application is submitted.
- Student is shortlisted.
- Student attends assessment.
- Other college-defined event occurs.

---

# 4. Application Withdrawal Policy

### Purpose

Controls when and under what conditions a student may withdraw from a recruitment process.

### College-Configurable Controls

The college can configure each stage independently:

| Recruitment Stage | College Rule |
|---|---|
| Before Application Deadline | Allow / Not Allowed / Approval Required |
| After Application | Allow / Not Allowed / Approval Required |
| After Shortlisting | Allow / Not Allowed / Approval Required |
| After PPT | Allow / Not Allowed / Approval Required |
| Before Assessment | Allow / Not Allowed / Approval Required |
| After Assessment | Allow / Not Allowed / Approval Required |
| Before Interview | Allow / Not Allowed / Approval Required |
| After Interview | Allow / Not Allowed / Approval Required |
| After Selection | Allow / Not Allowed / Approval Required |
| After Offer | Allow / Not Allowed / Approval Required |
| After Offer Acceptance | Allow / Not Allowed / Approval Required |

### Consequences

- No consequence.
- Warning.
- Placement-policy violation.
- Temporary restriction.
- Placement suspension.
- T&P review.
- College-defined consequence.

### Additional Controls

- Permitted withdrawal reasons.
- Supporting document requirement.
- Approval authority.
- T&P override.
- Audit trail.

---

# 5. No-Show / Absenteeism Policy

### Purpose

Controls consequences when a student registers but does not participate in a scheduled recruitment activity.

### Recruitment Events

College can configure separately for:

- Pre-Placement Talk.
- Assessment.
- Group Discussion.
- Technical Interview.
- HR Interview.
- Final Interview.
- Joining.
- Any custom recruitment event.

### College-Configurable Controls

- Number of permitted no-shows.
- First no-show consequence.
- Second no-show consequence.
- Third and subsequent no-show consequences.
- Restriction duration.
- Suspension rules.
- T&P review requirement.

### Possible Consequences

- No action.
- Warning.
- Temporary restriction.
- Application restriction.
- Placement suspension.
- T&P disciplinary review.
- College-defined action.

### Valid Absence

College can define valid reasons such as:

- Medical.
- Academic.
- Emergency.
- Placement conflict.
- Other approved reason.

The college can also configure:

- Supporting document requirement.
- Approval authority.
- Whether approved absence is excluded from the no-show count.

---

# 6. Number of Offers Policy

### Purpose

Determines how many placement offers a student may receive, retain or accept.

### College-Configurable Controls

#### Maximum Offers

- Maximum offers overall.
- Maximum active offers.
- Maximum accepted offers.
- Maximum offers by level.
- Maximum offers by category.
- Maximum offers by job type.
- Maximum offers by company type.

#### What Constitutes an Offer?

College can define the triggering status:

- Selected.
- Offer generated.
- Offer received.
- Offer accepted.
- Joining confirmed.
- Joined.
- Custom placement status.

#### Offer Coexistence

College can define whether:

- Multiple offers can coexist.
- Only the highest offer remains active.
- Only the latest offer remains active.
- Student chooses one.
- T&P decides.

#### Participation Completion

College defines when placement participation ends:

- First offer.
- Maximum offer count.
- Accepted offer.
- Joining.
- Custom status.

---

# 7. Next Offer / Upgrade Policy

### Purpose

Defines when a student with an existing offer may pursue another placement opportunity.

> **Important:** Truskill does not define what an "Upgrade" means. The college defines it.

### Compensation-Based Upgrade

College can choose:

- CTC.
- Fixed CTC.
- Gross salary.
- Base salary.
- First-year compensation.
- Total compensation.
- Monthly salary.
- Custom compensation field.

### Comparison Rules

College can define:

- New compensation > existing compensation.
- New compensation ≥ existing compensation.
- New compensation ≥ existing compensation + fixed amount.
- New compensation ≥ existing compensation + percentage.
- New compensation ≥ existing compensation × multiplier.
- Fixed pay must also be higher.
- Multiple compensation conditions.

### Non-Compensation Upgrade Criteria

Upgrade may additionally depend on:

- Company classification.
- Placement level.
- Placement category.
- Job type.
- Role.
- Core / Non-Core classification.
- Dream classification.
- Super Dream classification.
- College-defined criteria.

### Logic

College can combine rules using:

- AND.
- OR.
- NOT.

### Additional Configuration

- Number of upgrade attempts.
- Number of upgrade selections.
- What counts as an attempt.
- Whether rejection consumes an attempt.
- Whether no-show consumes an attempt.
- Whether withdrawal consumes an attempt.
- Whether a new offer replaces the old offer.
- Whether the old offer remains active.
- Whether the student can return to the previous offer.
- T&P override.

---

# 8. Job Type / Opportunity Type Policy

### Purpose

Allows the college to classify placement opportunities and define participation rules across different types.

### College Creates Its Own Types

Examples may include:

- Core.
- Non-Core.
- Software.
- Non-Software.
- Technical.
- Management.
- Product.
- Service.
- Consulting.
- Sales.
- Domestic.
- International.
- Internship.
- PPO.
- Any custom type.

These are examples only. The college controls the actual definitions.

### College-Configurable Controls

- Type name.
- Type description.
- Company mapping.
- Job mapping.
- Eligibility.
- Application limits.
- Offer limits.
- Movement rules.
- Upgrade rules.
- Exception rules.

### Movement

College defines whether a student can move:

- From one job type to another.
- From one job type to multiple types.
- Only to higher categories.
- Only with T&P approval.

---

# 9. Placement Level / Tier Policy

### Purpose

Creates a college-defined hierarchy for placement opportunities.

### College Creates Levels

The college can create any number of levels.

Examples:

- Level 1 / Level 2 / Level 3.
- Standard / Premium / Dream.
- Regular / Dream / Super Dream.
- Any custom naming.

### Level Configuration

Each level can have:

- Level name.
- Description.
- Rank.
- Package criteria.
- Company mapping.
- Job mapping.
- Job type.
- Category mapping.
- Eligibility criteria.
- Application limits.
- Offer limits.
- Attempt limits.
- Manual classification.

### Important

Truskill does not define what any level means.

---

# 10. Placement Category Policy

### Purpose

Allows each placement level to contain college-defined categories.

### Category Configuration

College can define:

- Category name.
- Category description.
- Parent level.
- Rank.
- Company mapping.
- Job mapping.
- Package range.
- Job type.
- Eligibility.
- Application limits.
- Offer limits.
- Attempt limits.
- Movement rules.

### Example

A college may create:

**Level: Premium**

- Software.
- Non-Software.
- Core.

Another college may create completely different categories.

---

# 11. Level / Category Movement Policy

### Purpose

Defines which placement opportunities a student may pursue based on their current offer, level or category.

### Movement Matrix

College configures each movement:

| Existing Position | New Position | Rule |
|---|---|---|
| Level A | Level A | College-defined |
| Level A | Level B | College-defined |
| Level A | Level C | College-defined |
| Category A | Category B | College-defined |

Each movement can be:

- Allowed.
- Not Allowed.
- Approval Required.

### Additional Conditions

Movement can depend on:

- Higher package.
- Higher fixed salary.
- Higher level.
- Dream classification.
- Super Dream classification.
- Job type.
- Core / Non-Core.
- Student eligibility.
- Number of previous offers.
- Number of previous attempts.

### Scope

Rules can vary by:

- Program.
- Batch.
- Branch.
- Student group.
- Company.
- Job type.
- Placement cycle.

---

# 12. Attempt / Opportunity Limit Policy

### Purpose

Controls the number of recruitment attempts or additional opportunities available to a student.

### College Defines

#### First Offer Attempts

Maximum attempts allowed before obtaining the first offer.

#### Additional Offer Attempts

Maximum attempts allowed after obtaining an offer.

### What Counts as an Attempt?

College chooses:

- Application.
- Shortlist.
- Assessment.
- Assessment attendance.
- GD.
- Technical interview.
- HR interview.
- Final round.
- Selection.
- Other custom event.

### Attempt Scope

Limits can apply:

- Overall.
- Per company.
- Per level.
- Per category.
- Per job type.
- Per Dream category.
- Per Super Dream category.
- Per placement cycle.

### Attempt Consumption

College defines whether:

- Rejection consumes an attempt.
- No-show consumes an attempt.
- Withdrawal consumes an attempt.
- Selection consumes an attempt.
- Successful offer consumes an attempt.

---

# 13. Dream Opportunity Policy

### Purpose

Allows the college to define and manage its own "Dream" opportunity classification.

> **Truskill does not impose a definition of Dream.**

### Dream Definition

College can define Dream based on:

- CTC.
- Fixed pay.
- Company.
- Job role.
- Job type.
- Placement level.
- Placement category.
- Tier.
- Manual classification.
- Combination of conditions.

### Example Rules

College may define:

> CTC ≥ X

or

> CTC ≥ X AND Level = Y

or

> Company manually classified as Dream

### Participation Rules

College defines:

- Who can apply.
- Whether students with existing offers can apply.
- Minimum existing offer.
- Minimum upgrade requirement.
- Number of Dream attempts.
- Number of Dream offers.
- Whether Dream replaces previous offer.
- Whether Dream ends placement participation.

### Attempt Consumption

College defines whether:

- Application consumes an attempt.
- Assessment consumes an attempt.
- Interview consumes an attempt.
- Rejection consumes an attempt.
- No-show consumes an attempt.
- Withdrawal consumes an attempt.

---

# 14. Super Dream / Premium Opportunity Policy

### Purpose

Provides a second configurable premium opportunity classification.

> **The college defines what Super Dream / Premium means.**

### Criteria

College may use:

- CTC.
- Fixed pay.
- Company classification.
- Placement level.
- Placement category.
- Job role.
- Job type.
- Manual classification.
- Any combination.

### College Defines

- Eligibility.
- Existing offer requirement.
- Minimum upgrade.
- Number of attempts.
- Number of offers.
- Movement rules.
- Offer replacement rules.
- Participation completion.
- Exceptions.

### Customization

College may:

- Rename the category.
- Disable the category.
- Create multiple premium categories.
- Define different rules for different programs/batches.

---

# 15. Special / Exception Opportunity Policy

### Purpose

Handles college-defined exceptions where normal placement rules do not apply.

### Possible Use Cases

Examples only:

- Core vs Non-Core.
- Product vs Service.
- International opportunity.
- PPO.
- Special recruiter.
- Special job profile.
- Government/public sector opportunity.
- College-defined special opportunity.

### College Defines

#### Exception Trigger

Example:

> Existing Job Type = Non-Core

AND

> New Job Type = Core

### Exception Action

- Allow additional application.
- Allow additional attempt.
- Allow additional offer.
- Allow movement.
- Bypass specific eligibility condition.
- Require T&P approval.
- Other college-defined action.

### Scope

Exception can apply to:

- Student.
- Batch.
- Program.
- Branch.
- Company.
- Job.
- Level.
- Category.
- Placement cycle.

---

# 16. Offer Selection & Acceptance Policy

### Purpose

Controls the transition from selection to offer to acceptance.

### College Defines the Trigger

Restriction can begin at:

- Selection.
- Offer generated.
- Offer received.
- Offer accepted.
- Joining confirmed.
- Joined.
- Custom status.

### Acceptance Window

College can define:

- Number of hours.
- Number of days.
- Specific date.
- Manual confirmation.

### Offer Outcomes

College defines treatment of:

- Pending offer.
- Accepted offer.
- Declined offer.
- Expired offer.
- Withdrawn offer.
- Rescinded offer.
- Deferred offer.

### If Student Declines

College can configure:

- Restore eligibility automatically.
- Restore with restrictions.
- Require T&P approval.
- Do not restore eligibility.
- College-defined action.

---

# 17. Placement Status / Placement Completion Policy

### Purpose

Defines when a student is considered "Placed" and how offer changes affect placement status.

### Placement Completion Trigger

College chooses:

- Selected.
- Offer received.
- Offer accepted.
- Joining confirmed.
- Joined.
- Custom placement status.

### Offer Changes

College defines treatment when an offer is:

- Withdrawn by employer.
- Rescinded.
- Deferred.
- Cancelled.
- Declined by student.
- Not joined.
- Delayed.
- Modified by employer.

### Student Status

College can define statuses such as:

- Not Placed.
- In Process.
- Selected.
- Offer Received.
- Offer Accepted.
- Placed.
- Joined.
- Offer Withdrawn.
- Offer Declined.
- Not Joined.
- Placement Reopened.
- Custom status.

### Placement Statistics

College defines which status counts for official placement reporting:

- Selection.
- Offer.
- Acceptance.
- Joining.
- Other college-defined status.

---

# 18. Training / Placement Readiness Requirement

### Purpose

Allows the college to make training or readiness activities prerequisites for placement participation.

### Required Activities

College can configure:

- Aptitude.
- Communication.
- Soft Skills.
- Resume.
- Group Discussion.
- Interview preparation.
- Technical training.
- Mock tests.
- Certifications.
- Mock interviews.
- Custom activities.

### Completion Criteria

- Attendance percentage.
- Assessment score.
- Module completion.
- Assignment completion.
- Certification.
- Mock interview completion.
- Trainer approval.
- T&P approval.

### Rule Logic

Multiple prerequisites can use:

- AND.
- OR.
- NOT.

### Scope

Requirement can apply to:

- All placement opportunities.
- Specific company.
- Specific level.
- Specific category.
- Dream opportunity.
- Super Dream opportunity.
- Specific program.
- Specific batch.
- Specific branch.

### Override

T&P may override the requirement with:

- Reason.
- Approver.
- Date/time.
- Validity.
- Audit trail.

---

# 19. Academic / Student Clearance Policy

### Purpose

Controls placement eligibility based on academic status and student profile.

### Academic Criteria

College can define:

- Minimum 10th percentage.
- Minimum 12th percentage.
- Minimum diploma percentage.
- Minimum graduation percentage.
- Minimum CGPA.
- Minimum semester CGPA.

### Backlog Rules

College defines:

- Active backlog allowed / not allowed.
- Maximum active backlogs.
- Historical backlog allowed / not allowed.
- Maximum historical backlogs.
- Backlog clearance required before application.
- Backlog clearance required before selection.
- Backlog clearance required before offer.
- Backlog clearance required before joining.

### Academic Gap

- Gap allowed / not allowed.
- Maximum gap.
- Which academic years count.

### Passing Year

- Minimum passing year.
- Maximum passing year.

### Variable Rules

Different academic rules can apply to:

- Program.
- Batch.
- Branch.
- Company.
- Level.
- Category.
- Dream opportunity.
- Super Dream opportunity.

---

# 20. Policy Override & Exception Management

### Purpose

Provides controlled administrative overrides when a student's or opportunity's circumstances require an exception to normal placement rules.

### Override Scope

Override can apply to:

- Entire college.
- School/faculty.
- Program.
- Batch.
- Branch.
- Student group.
- Individual student.
- Company.
- Job.
- Level.
- Category.
- Recruitment drive.

### What Can Be Overridden?

- Eligibility.
- Application limits.
- Offer limits.
- Movement rules.
- Attempt limits.
- Withdrawal rules.
- No-show restrictions.
- Training requirements.
- Academic requirements.
- Placement restrictions.
- Other college-defined policies.

### Override Duration

- One-time.
- Specific recruitment drive.
- Specific date range.
- Permanent.
- Until manually revoked.

### Approval

College can define:

- Who can create override.
- Who can approve override.
- Whether dual approval is required.
- Whether reason is mandatory.
- Whether supporting documents are required.

### Audit Trail

Every override should record:

- Policy affected.
- Previous outcome.
- Revised outcome.
- Student/company/opportunity affected.
- Created by.
- Approved by.
- Date/time.
- Reason.
- Effective period.
- Revocation details, if applicable.

---

# Recommended Policy Engine Architecture

The 20 policies should not necessarily become 20 isolated modules/screens.

They should operate through a common policy engine.

```text
PLACEMENT POLICY ENGINE
│
├── 1. Master Definitions
│   ├── Job Types
│   ├── Placement Levels
│   ├── Placement Categories
│   ├── Company Classifications
│   ├── Opportunity Types
│   └── Student Groups
│
├── 2. Student & Company Conditions
│   ├── Academic
│   ├── Backlogs
│   ├── Program / Branch
│   ├── Training
│   ├── Existing Offers
│   ├── Compensation
│   └── Custom Attributes
│
├── 3. Application Rules
│   ├── Eligibility
│   ├── Application Limits
│   ├── Deadlines
│   ├── Withdrawal
│   └── No-Show
│
├── 4. Offer Rules
│   ├── Number of Offers
│   ├── Next Offer / Upgrade
│   ├── Offer Acceptance
│   └── Placement Completion
│
├── 5. Movement Rules
│   ├── Level Movement
│   ├── Category Movement
│   ├── Job Type Movement
│   ├── Dream
│   └── Super Dream
│
├── 6. Attempt Rules
│   ├── Application Attempts
│   ├── Assessment Attempts
│   ├── Interview Attempts
│   └── Additional Offer Attempts
│
├── 7. Exceptions
│   ├── Special Opportunity
│   ├── T&P Override
│   └── Student / Company Exception
│
└── 8. Governance
    ├── Policy Version
    ├── Effective Date
    ├── Priority
    ├── Approval
    └── Audit Trail
```

## Core Product Principle

> **Truskill defines the configurable building blocks. The college defines the placement policy.**

The system should never assume:

- What "Dream" means.
- What "Super Dream" means.
- What an "Upgrade" means.
- What "Tier 1" means.
- What constitutes an "Offer."
- When a student becomes "Placed."
- What "Higher Package" means.
- What "Core" or "Non-Core" means.
- How many offers a student may have.
- How many attempts a student gets.

All of these should be **college-configurable through the policy engine**.
