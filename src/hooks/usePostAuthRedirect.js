import { getVolunteerProfile } from '../firebase'

// Call after successful login/signup to route user correctly
export const getRedirectPath = async (uid, role) => {
  if (role === 'ngo') return '/ngo/dashboard'

  // volunteer — check if onboarding is done
  const volunteerProfile = await getVolunteerProfile(uid)
  if (volunteerProfile?.profileComplete) return '/volunteer/dashboard'
  return '/volunteer/onboarding'
}
