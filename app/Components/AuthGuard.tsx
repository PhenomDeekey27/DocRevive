// AuthGuard.tsx
'use client'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()

  console.log()

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [userId, isLoaded, router])

  if (!userId) return null
  return <>{children}</>
}
export default AuthGuard