import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function UserInfoHeader({ className = "" }) {
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, xp_points, coins')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  if (!userProfile) return null

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center gap-3">
          {userProfile.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt={userProfile.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#1E258F] flex items-center justify-center text-white font-semibold text-sm font-['Poppins']">
              {getInitials(userProfile.full_name)}
            </div>
          )}
          <div>
            <p className="text-gray-800 font-semibold text-sm font-['Poppins'] truncate max-w-[120px] sm:max-w-[200px]">
              {userProfile.full_name || 'Student'}
            </p>
            <p className="text-gray-500 text-xs font-['Poppins']">Siswa</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {/* XP */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <span className="text-base">⚡</span>
            <span className="text-amber-700 font-semibold text-sm font-['Poppins']">
              {userProfile.xp_points?.toLocaleString() || 0}
            </span>
          </div>
          
          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
            <span className="text-base">🪙</span>
            <span className="text-yellow-700 font-semibold text-sm font-['Poppins']">
              {userProfile.coins?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserInfoHeader
