'use client'

import { useRouter } from 'next/navigation'
import { MobileUserMenu } from './MobileUserMenu'

export function CollegeMobileUserMenu() {
  const router = useRouter()

  return (
    <MobileUserMenu onEditProfile={() => router.push('/college/my-profile')} />
  )
}
