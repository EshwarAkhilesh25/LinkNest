import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRecoverySession() {
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          const tokenParts = session.access_token.split('.')
          if (tokenParts.length === 3) {
            const base64Url = tokenParts[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const padding = '='.repeat((4 - base64.length % 4) % 4)
            const decoded = Buffer.from(base64 + padding, 'base64').toString()
            const payload = JSON.parse(decoded)
            
            const isRecovery = payload.amr && payload.amr[0] && payload.amr[0].method === 'recovery'
            setIsRecoverySession(isRecovery)
          }
        }
      } catch (e) {
        // JWT decoding failed - assume not a recovery session
      } finally {
        setLoading(false)
      }
    }

    checkRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        const tokenParts = session.access_token.split('.')
        if (tokenParts.length === 3) {
          const base64Url = tokenParts[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const padding = '='.repeat((4 - base64.length % 4) % 4)
          const decoded = Buffer.from(base64 + padding, 'base64').toString()
          const payload = JSON.parse(decoded)
          
          const isRecovery = payload.amr && payload.amr[0] && payload.amr[0].method === 'recovery'
          setIsRecoverySession(isRecovery)
        }
      } else {
        setIsRecoverySession(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { isRecoverySession, loading }
}
