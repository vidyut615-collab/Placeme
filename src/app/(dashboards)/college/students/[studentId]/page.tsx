import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, AlertTriangle, Info, GraduationCap, Phone, Mail, Building2, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function StudentProfileAuditPage({ params }: { params: Promise<{ studentId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { studentId } = await params

  if (!user || user.app_metadata.role !== 'college_staff' && user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff') {
    redirect('/login')
  }

  // 1. Fetch Student Profile and Policy Data
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      college_id,
      is_blacklisted,
      blacklist_reason,
      policy_counters,
      onboarding_status,
      created_at,
      profile_data,
      users!inner ( email )
    `)
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Student Not Found</h1>
        <p className="text-zinc-500 mt-2">The student profile you are looking for does not exist or you do not have permission.</p>
        <Link href="/college/students" className="text-blue-600 hover:underline mt-4 inline-block">&larr; Back to Directory</Link>
      </div>
    )
  }

  const profile = student.profile_data || {}
  const counters = student.policy_counters || {}

  // 2. Fetch Application History (Audit Log)
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      dropped_reason,
      created_at,
      updated_at,
      jobs (
        id,
        title,
        company_name
      )
    `)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })

  const formatStatus = (status: string) => {
    switch (status) {
      case 'applied': return <Badge variant="secondary">Applied</Badge>;
      case 'shortlisted': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Shortlisted</Badge>;
      case 'interviewing': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">Interviewing</Badge>;
      case 'offered': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Offered</Badge>;
      case 'hired': return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Hired / Placed</Badge>;
      case 'dropped': return <Badge variant="destructive">Dropped</Badge>;
      case 'forfeited': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Forfeited</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  const formatDropReason = (reason: string | null) => {
    if (!reason) return '—'
    const map: Record<string, string> = {
      student_withdrew: 'Student Withdrew Mid-Process',
      student_withdrew_post_shortlist: 'Student Withdrew Post-Shortlist',
      did_not_qualify: 'Did Not Qualify',
      no_show: 'No-Show (Interview)',
      excused_absence: 'Excused Absence',
      unprofessional_conduct: 'Unprofessional Conduct',
      data_fraud: 'Data Fraud',
      revoked_by_company: 'Revoked by Company'
    }
    return map[reason] || reason
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <Link href="/college/students" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{profile.full_name || 'Incomplete Profile'}</h1>
            <p className="text-zinc-500 mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" /> {(student.users as any)?.email}
            </p>
          </div>
          {student.is_blacklisted && (
            <div className="bg-red-50 text-red-900 px-4 py-3 rounded-md border border-red-200 flex items-start gap-3 max-w-md shadow-sm">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Blacklisted Account</h3>
                <p className="text-sm mt-1">{student.blacklist_reason || 'No reason provided.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-400" />
              Academic Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 text-sm">
              <div>
                <div className="text-zinc-500 mb-1">Phone</div>
                <div className="font-medium">{profile.phone || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Graduation Year</div>
                <div className="font-medium">{profile.year || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Degree Type</div>
                <div className="font-medium">{profile.type || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Department</div>
                <div className="font-medium">{profile.department || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Current GPA</div>
                <div className="font-medium">{profile.gpa || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Onboarding</div>
                <div className="font-medium capitalize">{student.onboarding_status}</div>
              </div>

              <div className="col-span-full border-t pt-4 mt-2">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Past Academics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">10th %</div>
                    <div>{profile.academic_10th || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">12th %</div>
                    <div>{profile.academic_12th || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Diploma %</div>
                    <div>{profile.diploma_percentage || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">UG %</div>
                    <div>{profile.graduation_percentage || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Active Backlogs</div>
                    <div>{profile.active_backlogs || '0'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Hist. Backlogs</div>
                    <div>{profile.historical_backlogs || '0'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Gap Years</div>
                    <div>{profile.academic_gap_years || '0'}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Counters Card */}
        <Card className="bg-zinc-50 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-zinc-400" />
              Policy Violations
            </CardTitle>
            <CardDescription>Strikes & penalties accrued</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Standard Withdrawals</span>
              <Badge variant="outline" className={counters.withdrawals > 0 ? "bg-orange-100 text-orange-800" : ""}>
                {counters.withdrawals || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Post-Shortlist Drops</span>
              <Badge variant="outline" className={counters.post_shortlist_withdrawals > 0 ? "bg-red-100 text-red-800" : ""}>
                {counters.post_shortlist_withdrawals || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">No-Shows</span>
              <Badge variant="outline" className={counters.no_shows > 0 ? "bg-red-100 text-red-800" : ""}>
                {counters.no_shows || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Disciplinary Strikes</span>
              <Badge variant="outline" className={counters.disciplinary > 0 ? "bg-red-100 text-red-800" : ""}>
                {counters.disciplinary || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Offer Rejections</span>
              <Badge variant="outline" className={counters.offer_rejections > 0 ? "bg-red-100 text-red-800" : ""}>
                {counters.offer_rejections || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-4">
              <span className="text-sm font-medium">Upgrades Used</span>
              <Badge variant="secondary">
                {counters.upgrades_used || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log / Applications */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Application History
        </h2>
        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead>Company & Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Drop/Withdrawal Reason</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications && applications.length > 0 ? (
                applications.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{app.jobs?.company_name}</div>
                      <div className="text-xs text-zinc-500">{app.jobs?.title}</div>
                    </TableCell>
                    <TableCell>{formatStatus(app.status)}</TableCell>
                    <TableCell>
                      {app.status === 'dropped' ? (
                        <span className="text-red-600 text-sm flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {formatDropReason(app.dropped_reason)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(app.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    This student has not applied to any jobs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
