import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, signInWithGoogle, getUserProfile } from '../firebase'
import { getRedirectPath } from '../hooks/usePostAuthRedirect'
import { useLang } from '../context/LanguageContext'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', userType: 'volunteer' })
  const [errors, setErrors] = useState({})
  const [googleError, setGoogleError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = lang === 'hi' ? 'ईमेल आवश्यक है' : 'Email is required'
    if (!formData.password) errs.password = lang === 'hi' ? 'पासवर्ड आवश्यक है' : 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      const profile = await getUserProfile(result.user.uid)
      const role = profile?.role || formData.userType
      const path = await getRedirectPath(result.user.uid, role)
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
      const profile = await getUserProfile(result.user.uid)
      const role = profile?.role || formData.userType
      const path = await getRedirectPath(result.user.uid, role)
      navigate(path)
    } catch (err) {
      setGoogleError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const friendlyError = (code) => {
    const isHi = lang === 'hi'
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return isHi ? 'गलत ईमेल या पासवर्ड।' : 'Invalid email or password.'
      case 'auth/popup-closed-by-user': return isHi ? 'पॉपअप बंद हो गया। दोबारा कोशिश करें।' : 'Sign-in popup was closed. Please try again.'
      case 'auth/popup-blocked': return isHi ? 'पॉपअप ब्लॉक है। पॉपअप की अनुमति दें।' : 'Popup blocked. Please allow popups for this site.'
      default: return isHi ? 'कुछ गलत हुआ। दोबारा कोशिश करें।' : 'Something went wrong. Please try again.'
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t('welcomeBack')}</h1>
            <p>{t('signInSubtitle')}</p>
          </div>

          <div className="role-toggle">
            <button type="button" className={`role-btn ${formData.userType === 'volunteer' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, userType: 'volunteer' })}>
              🙋 {t('volunteer')}
            </button>
            <button type="button" className={`role-btn ${formData.userType === 'ngo' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, userType: 'ngo' })}>
              🏢 {t('ngoRep')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('emailAddress')}</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder={lang === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email'} />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('password')}</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder={lang === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'} />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {errors.submit && <span className="error-message" style={{display:'block',marginBottom:'1rem'}}>{errors.submit}</span>}

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" name="remember" />
                <span className="checkmark"></span>
                {t('rememberMe')}
              </label>
              <Link to="/forgot-password" className="forgot-link">{t('forgotPassword')}</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="auth-divider"><span>{t('orDivider')}</span></div>

          <div className="social-auth">
            <button type="button" className="btn btn-social btn-google btn-full" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('continueGoogle')}
            </button>
            {googleError && <span className="error-message" style={{display:'block',textAlign:'center',marginTop:'0.5rem'}}>{googleError}</span>}
          </div>

          <div className="auth-footer">
            <p>{t('noAccount')} <Link to="/signup">{lang === 'hi' ? 'साइन अप करें' : 'Sign up'}</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
