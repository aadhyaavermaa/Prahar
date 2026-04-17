import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, signInWithGoogle, createUserProfile } from '../firebase'
import { getRedirectPath } from '../hooks/usePostAuthRedirect'

const ROLES = {
  VOLUNTEER_ASSOCIATED: 'volunteer_associated',
  VOLUNTEER_NEW: 'volunteer_new',
  NGO: 'ngo',
}

// Map signup role to the simplified role stored in Firestore
const toFirestoreRole = (role) => role === ROLES.NGO ? 'ngo' : 'volunteer'

const initialData = {
  firstName: '', lastName: '', email: '', contactNo: '',
  password: '', confirmPassword: '',
  ngoAssociated: '', volunteerRole: '',
  skills: '', availability: '',
  ngoName: '', ngoRegNumber: '', ngoWebsite: '', designation: '',
  agreeToTerms: false,
}

const Signup = () => {
  const [role, setRole] = useState(ROLES.VOLUNTEER_ASSOCIATED)
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [googleError, setGoogleError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const cardRef = useRef(null)

  // Scale card to fit viewport without scrolling
  useEffect(() => {
    const scaleCard = () => {
      const card = cardRef.current
      if (!card) return
      card.style.transform = 'scale(1)'
      const availableH = window.innerHeight - 80 // account for header
      const cardH = card.scrollHeight
      const scale = cardH > availableH ? availableH / cardH : 1
      card.style.transform = `scale(${scale})`
      card.style.transformOrigin = 'top center'
    }
    scaleCard()
    window.addEventListener('resize', scaleCard)
    return () => window.removeEventListener('resize', scaleCard)
  }, [role]) // recalculate when role changes (different fields shown)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const validate = () => {
    const errs = {}
    if (!formData.firstName) errs.firstName = 'First name is required'
    if (!formData.lastName) errs.lastName = 'Last name is required'
    if (!formData.email) errs.email = 'Email is required'
    if (!formData.contactNo) errs.contactNo = 'Contact number is required'
    else if (!/^\+?[\d\s\-]{7,15}$/.test(formData.contactNo)) errs.contactNo = 'Enter a valid contact number'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 8) errs.password = 'Min. 8 characters'
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (role === ROLES.VOLUNTEER_ASSOCIATED) {
      if (!formData.ngoAssociated) errs.ngoAssociated = 'NGO name is required'
      if (!formData.volunteerRole) errs.volunteerRole = 'Your role is required'
    }
    if (role === ROLES.VOLUNTEER_NEW) {
      if (!formData.skills) errs.skills = 'Skills are required'
      if (!formData.availability) errs.availability = 'Availability is required'
    }
    if (role === ROLES.NGO) {
      if (!formData.ngoName) errs.ngoName = 'NGO name is required'
      if (!formData.ngoRegNumber) errs.ngoRegNumber = 'Registration number is required'
      if (!formData.designation) errs.designation = 'Designation is required'
    }
    if (!formData.agreeToTerms) errs.agreeToTerms = 'You must agree to the terms'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const firestoreRole = toFirestoreRole(role)

      // Save user profile with role + signup metadata
      await createUserProfile(result.user.uid, {
        role: firestoreRole,
        signupRole: role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNo: formData.contactNo,
        email: formData.email,
        ...(role === ROLES.VOLUNTEER_ASSOCIATED && { ngoAssociated: formData.ngoAssociated, volunteerRole: formData.volunteerRole }),
        ...(role === ROLES.VOLUNTEER_NEW && { skills: formData.skills, availability: formData.availability }),
        ...(role === ROLES.NGO && { ngoName: formData.ngoName, ngoRegNumber: formData.ngoRegNumber, designation: formData.designation, ngoWebsite: formData.ngoWebsite }),
        createdAt: new Date(),
      })

      const path = await getRedirectPath(result.user.uid, firestoreRole)
      navigate(path)
    } catch (err) {
      setErrors({ submit: friendlyError(err.code) })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleError('')
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      const firestoreRole = toFirestoreRole(role)
      await createUserProfile(result.user.uid, {
        role: firestoreRole,
        signupRole: role,
        email: result.user.email,
        createdAt: new Date(),
      })
      const path = await getRedirectPath(result.user.uid, firestoreRole)
      navigate(path)
    } catch (err) {
      console.error(err)
      setGoogleError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists.'
      case 'auth/popup-closed-by-user': return 'Sign-in popup was closed. Please try again.'
      case 'auth/popup-blocked': return 'Popup blocked. Please allow popups for this site.'
      case 'auth/invalid-api-key': return 'Firebase is not configured. Check your API keys.'
      default: return 'Something went wrong. Please try again.'
    }
  }

  return (
    <div className="auth-page auth-page--top">
      <div className="auth-container auth-container--wide">
        <div className="auth-card" ref={cardRef}>
          <div className="auth-header">
            <h1>Join Prahar</h1>
            <p>Create your account to start making an impact</p>
          </div>

          <div className="role-cards">
            <button type="button" className={`role-card ${role === ROLES.VOLUNTEER_ASSOCIATED ? 'active' : ''}`}
              onClick={() => setRole(ROLES.VOLUNTEER_ASSOCIATED)}>
              <span className="role-card-icon">🤝</span>
              <span className="role-card-title">Volunteer</span>
              <span className="role-card-sub">Already with an NGO</span>
            </button>
            <button type="button" className={`role-card ${role === ROLES.VOLUNTEER_NEW ? 'active' : ''}`}
              onClick={() => setRole(ROLES.VOLUNTEER_NEW)}>
              <span className="role-card-icon">🌱</span>
              <span className="role-card-title">Volunteer</span>
              <span className="role-card-sub">Looking for opportunities</span>
            </button>
            <button type="button" className={`role-card ${role === ROLES.NGO ? 'active' : ''}`}
              onClick={() => setRole(ROLES.NGO)}>
              <span className="role-card-icon">🏢</span>
              <span className="role-card-title">NGO</span>
              <span className="role-card-sub">Representative</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName}
                  onChange={handleChange} className={`form-control ${errors.firstName ? 'error' : ''}`} placeholder="First name" />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName}
                  onChange={handleChange} className={`form-control ${errors.lastName ? 'error' : ''}`} placeholder="Last name" />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email}
                  onChange={handleChange} className={`form-control ${errors.email ? 'error' : ''}`} placeholder="your@email.com" />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="contactNo">Contact Number</label>
                <input type="tel" id="contactNo" name="contactNo" value={formData.contactNo}
                  onChange={handleChange} className={`form-control ${errors.contactNo ? 'error' : ''}`} placeholder="+91 XXXXX XXXXX" />
                {errors.contactNo && <span className="error-message">{errors.contactNo}</span>}
              </div>
            </div>

            {role === ROLES.VOLUNTEER_ASSOCIATED && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ngoAssociated">NGO Name</label>
                  <input type="text" id="ngoAssociated" name="ngoAssociated" value={formData.ngoAssociated}
                    onChange={handleChange} className={`form-control ${errors.ngoAssociated ? 'error' : ''}`} placeholder="Name of your NGO" />
                  {errors.ngoAssociated && <span className="error-message">{errors.ngoAssociated}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="volunteerRole">Your Role in NGO</label>
                  <input type="text" id="volunteerRole" name="volunteerRole" value={formData.volunteerRole}
                    onChange={handleChange} className={`form-control ${errors.volunteerRole ? 'error' : ''}`} placeholder="e.g. Field Coordinator" />
                  {errors.volunteerRole && <span className="error-message">{errors.volunteerRole}</span>}
                </div>
              </div>
            )}

            {role === ROLES.VOLUNTEER_NEW && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="skills">Skills / Interests</label>
                  <input type="text" id="skills" name="skills" value={formData.skills}
                    onChange={handleChange} className={`form-control ${errors.skills ? 'error' : ''}`} placeholder="e.g. Teaching, Medical, IT" />
                  {errors.skills && <span className="error-message">{errors.skills}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="availability">Availability</label>
                  <select id="availability" name="availability" value={formData.availability}
                    onChange={handleChange} className={`form-control ${errors.availability ? 'error' : ''}`}>
                    <option value="">Select availability</option>
                    <option value="weekends">Weekends only</option>
                    <option value="weekdays">Weekdays only</option>
                    <option value="fulltime">Full-time</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  {errors.availability && <span className="error-message">{errors.availability}</span>}
                </div>
              </div>
            )}

            {role === ROLES.NGO && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ngoName">NGO Name</label>
                    <input type="text" id="ngoName" name="ngoName" value={formData.ngoName}
                      onChange={handleChange} className={`form-control ${errors.ngoName ? 'error' : ''}`} placeholder="Official NGO name" />
                    {errors.ngoName && <span className="error-message">{errors.ngoName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="ngoRegNumber">Registration Number</label>
                    <input type="text" id="ngoRegNumber" name="ngoRegNumber" value={formData.ngoRegNumber}
                      onChange={handleChange} className={`form-control ${errors.ngoRegNumber ? 'error' : ''}`} placeholder="NGO registration no." />
                    {errors.ngoRegNumber && <span className="error-message">{errors.ngoRegNumber}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="designation">Your Designation</label>
                    <input type="text" id="designation" name="designation" value={formData.designation}
                      onChange={handleChange} className={`form-control ${errors.designation ? 'error' : ''}`} placeholder="e.g. Director, Manager" />
                    {errors.designation && <span className="error-message">{errors.designation}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="ngoWebsite">NGO Website <span style={{color:'#9ca3af',fontWeight:400}}>(optional)</span></label>
                    <input type="url" id="ngoWebsite" name="ngoWebsite" value={formData.ngoWebsite}
                      onChange={handleChange} className="form-control" placeholder="https://yourngo.org" />
                  </div>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" value={formData.password}
                  onChange={handleChange} className={`form-control ${errors.password ? 'error' : ''}`} placeholder="Min. 8 characters" />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} className={`form-control ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat password" />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} />
                <span className="checkmark"></span>
                I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </label>
              {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
            </div>

            {errors.submit && <span className="error-message" style={{display:'block',marginBottom:'1rem'}}>{errors.submit}</span>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="social-auth">
            <button type="button" className="btn btn-social btn-google btn-full" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            {googleError && <span className="error-message" style={{display:'block',textAlign:'center',marginTop:'0.5rem'}}>{googleError}</span>}
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
