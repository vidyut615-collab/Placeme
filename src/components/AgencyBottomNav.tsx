'use client'

import { BottomNav } from './BottomNav'
import { agencyNavigation } from './AgencySidebar'

export function AgencyBottomNav({ role }: { role: string }) {
  const filteredNav = agencyNavigation.filter(item => {
    if (item.name === 'Manage Roles' && role !== 'superadmin') return false
    return true
  })

  return <BottomNav items={filteredNav} />
}
