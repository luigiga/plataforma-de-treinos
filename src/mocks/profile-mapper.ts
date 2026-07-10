import type { User } from '@/context/AuthContext'
import type { Profile } from '@/services/profile'

export function userToProfile(user: User): Profile {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name || user.name,
    avatar_url: user.avatar || '',
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    status: user.status || 'active',
    created_at: new Date().toISOString(),
    metadata: {
      socialLinks: user.socialLinks,
      preferences: user.preferences,
      notificationPreferences: user.notificationPreferences,
      subscriptionStatus: user.subscriptionStatus,
      plan: user.plan,
      status: user.status,
      points: user.points,
      badges: user.badges,
    },
  } as Profile
}
