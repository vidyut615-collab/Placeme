import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { AddCollegeModal } from '@/components/AddCollegeModal'
import { CollegeActionsMenu } from '@/components/CollegeActionsMenu'
import { SearchInput } from '@/components/SearchInput'
import { formatDate } from '@/lib/utils'
import { Building2, MapPin, Mail, Calendar } from 'lucide-react'

export default async function AgencyColleges({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''

  const supabase = await createClient()

  // Fetch colleges and their associated admins
  let query = supabase
    .from('colleges')
    .select(`
      id, 
      name, 
      website,
      location,
      description,
      contact_email,
      contact_phone,
      created_at,
      users!users_college_id_fkey(email, role)
    `)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: colleges, error } = await query

  if (error) {
    console.error("Colleges fetch error:", error)
  }

  return (
    <div className="flex flex-1 flex-col p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Registered Colleges</h1>
            <p className="text-zinc-500 mt-2">Manage your network of partner colleges.</p>
          </div>
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Search colleges..." />
            <AddCollegeModal />
          </div>
        </div>

        {colleges && colleges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {colleges.map((college) => {
              // Find the college_admin from the joined users array
              const adminUser = college.users?.find((u: any) => u.role === 'college_admin')
              
              return (
                <div key={college.id} className="group flex flex-col rounded-xl border bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 dark:border-zinc-800 overflow-hidden relative cursor-pointer">
                  
                  {/* Invisible link overlay covering the entire card */}
                  <Link href={`/agency/colleges/${college.id}`} className="absolute inset-0 z-0" aria-label={`View ${college.name}`} />

                  {/* Top Header */}
                  <div className="p-5 pb-4 relative z-10 pointer-events-none">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      {/* Restore pointer events only for the action menu so it's clickable */}
                      <div className="shrink-0 -mr-2 -mt-2 pointer-events-auto">
                        <CollegeActionsMenu 
                          collegeId={college.id} 
                          collegeName={college.name} 
                          collegeDetails={{
                            name: college.name,
                            website: college.website,
                            location: college.location,
                            description: college.description,
                            contact_email: college.contact_email,
                            contact_phone: college.contact_phone
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                        {college.name}
                      </h3>
                    </div>
                    
                    {college.location && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{college.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Body/Footer section */}
                  <div className="mt-auto border-t bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-3 relative z-10 pointer-events-none">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1">Primary Admin</p>
                      <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="truncate" title={adminUser ? adminUser.email : 'No admin assigned'}>
                          {adminUser ? adminUser.email : 'No admin assigned'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Added {formatDate(college.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-white dark:bg-zinc-900 shadow-sm border-dashed">
            <Building2 className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No colleges found</h3>
            <p className="text-zinc-500 mt-2 max-w-sm">
              {q ? 'Try adjusting your search query.' : 'Get started by adding your first partner college to the platform.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
