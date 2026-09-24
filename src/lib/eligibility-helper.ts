/**
 * Helper to check if a student's profile meets a job's academic eligibility criteria.
 */
export function isStudentAcademicallyEligible(
  profileData: Record<string, any> | null | undefined,
  criteria: Record<string, any> | null | undefined
): boolean {
  if (!profileData) return false
  if (!criteria || Object.keys(criteria).length === 0) return true

  // 1. Min CGPA
  if (criteria.min_cgpa !== null && criteria.min_cgpa !== undefined && criteria.min_cgpa !== '') {
    const studentGpa = Number(profileData.gpa) || 0
    if (studentGpa < Number(criteria.min_cgpa)) return false
  }

  // 2. Min 10th %
  if (criteria.min_10th !== null && criteria.min_10th !== undefined && criteria.min_10th !== '') {
    const student10th = Number(profileData.academic_10th) || 0
    if (student10th < Number(criteria.min_10th)) return false
  }

  // 3. Min 12th %
  if (criteria.min_12th !== null && criteria.min_12th !== undefined && criteria.min_12th !== '') {
    const student12th = Number(profileData.academic_12th) || 0
    if (student12th < Number(criteria.min_12th)) return false
  }

  // 4. Max Active Backlogs
  if (criteria.max_active_backlogs !== null && criteria.max_active_backlogs !== undefined && criteria.max_active_backlogs !== '') {
    const activeBacklogs = Number(profileData.active_backlogs) || 0
    if (activeBacklogs > Number(criteria.max_active_backlogs)) return false
  }

  // 5. Max Historical Backlogs
  if (criteria.max_historical_backlogs !== null && criteria.max_historical_backlogs !== undefined && criteria.max_historical_backlogs !== '') {
    const histBacklogs = Number(profileData.historical_backlogs) || 0
    if (histBacklogs > Number(criteria.max_historical_backlogs)) return false
  }

  // 6. Allowed Departments (if specified and not empty)
  if (Array.isArray(criteria.allowed_departments) && criteria.allowed_departments.length > 0) {
    const studentDept = (profileData.department || '').trim().toUpperCase()
    const allowed = criteria.allowed_departments.map((d: string) => d.trim().toUpperCase())
    if (!studentDept || !allowed.includes(studentDept)) return false
  }

  // 7. Allowed Degrees / Types (if specified)
  if (Array.isArray(criteria.allowed_degrees) && criteria.allowed_degrees.length > 0) {
    const studentType = (profileData.type || '').trim().toUpperCase()
    const allowed = criteria.allowed_degrees.map((d: string) => d.trim().toUpperCase())
    if (!studentType || !allowed.includes(studentType)) return false
  }

  // 8. Allowed Graduation Years (if specified)
  if (Array.isArray(criteria.allowed_years) && criteria.allowed_years.length > 0) {
    const studentYear = (profileData.year || '').toString().trim()
    const allowed = criteria.allowed_years.map((y: string | number) => y.toString().trim())
    if (!studentYear || !allowed.includes(studentYear)) return false
  }

  // 9. Allowed Genders (if specified)
  if (Array.isArray(criteria.allowed_genders) && criteria.allowed_genders.length > 0) {
    const studentGender = (profileData.gender || '').trim().toLowerCase()
    const allowed = criteria.allowed_genders.map((g: string) => g.trim().toLowerCase())
    if (!studentGender || !allowed.includes(studentGender)) return false
  }

  return true
}
