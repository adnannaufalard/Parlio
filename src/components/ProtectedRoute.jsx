import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function ProtectedRoute({ children, allowedRoles }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }
      // Fetch user profile to get role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (error || !allowedRoles.includes(profile?.role)) {
        navigate('/login')
        return
      }
      setLoading(false)
    }
    checkAccess()
  }, [navigate, allowedRoles])

  if (loading) {
    return <div>Loading...</div>
  }

  return children
}

export default ProtectedRoute
