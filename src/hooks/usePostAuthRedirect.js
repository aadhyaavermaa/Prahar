import { getVolunteerProfile } from '../firebase'

export const getRedirectPath = async (uid, role) => {
  if (role === 'ngo') return '/ngo/dashboard'

  try {
    const volunteerProfile = await Promise.race([
      getVolunteerProfile(uid),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Volunteer profile fetch timeout')), 5000)),
    ])
    if (volunteerProfile?.profileComplete) return '/volunteer/dashboard'
  } catch (err) {
    console.error('Could not fetch volunteer profile (Firestore may be blocked):', err)
    return '/volunteer/dashboard'
  }
  return '/volunteer/onboarding'
}