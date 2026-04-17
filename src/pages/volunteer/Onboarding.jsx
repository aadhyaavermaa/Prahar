import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { saveVolunteerProfile } from '../../firebase'

const CAUSES = ['Education', 'Healthcare', 'Environment', 'Women Empowerment', 'Child Welfare', 'Elderly Care', 'Animal Welfare', 'Disaster Relief']
const SKILLS_LIST = ['Teaching', 'Medical/Healthcare', 'IT & Technology', 'Legal Aid', 'Counseling', 'Photography', 'Event Management', 'Fundraising', 'Social Media', 'Translation']

const Onboarding = () => {
  const { user, refreshProfile } = useAuth()
  // Dev fallback — remove when Firebase is configured
  const devUser = user || { uid: 'dev-user-preview' }
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = form, 2 = success
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    skills: [],
    availability: '',
    causes: [],
    bio: '',
  })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const toggleItem = (field, value) => {
    const current = formData[field]
    setFormData({
      ...formData,
      [field]: current.includes(value) ? current.filter(i => i !== value) : [...current, value]
    })
  }

  const validate = () => {
    const errs = {}
    if (!formData.fullName.trim()) errs.fullName = 'Name is required'
    if (!formData.location.trim()) errs.location = 'Location is required'
    if (formData.skills.length === 0) errs.skills = 'Select at least one skill'
    if (!formData.availability) errs.availability = 'Availability is required'
    if (formData.causes.length === 0) errs.causes = 'Select at least one cause'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      await saveVolunteerProfile(devUser.uid, formData)
      if (user) await refreshProfile()
      setStep(2)
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to save. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-success">
          <div className="success-icon">🎉</div>
          <h2>You're all set!</h2>
          <p>Your volunteer profile is complete. Let's find you some meaningful work.</p>
          <button className="btn btn-primary" onClick={() => navigate('/volunteer/dashboard')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-step-badge">Step 1 of 1</div>
          <h2>Complete your volunteer profile</h2>
          <p>This helps NGOs find the right volunteers for their work.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Name + Location */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName}
                onChange={handleChange} className={`form-control ${errors.fullName ? 'error' : ''}`}
                placeholder="Your full name" />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input type="text" id="location" name="location" value={formData.location}
                onChange={handleChange} className={`form-control ${errors.location ? 'error' : ''}`}
                placeholder="City, State" />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>
          </div>

          {/* Availability */}
          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <select id="availability" name="availability" value={formData.availability}
              onChange={handleChange} className={`form-control ${errors.availability ? 'error' : ''}`}>
              <option value="">Select your availability</option>
              <option value="weekends">Weekends only</option>
              <option value="weekdays">Weekdays only</option>
              <option value="fulltime">Full-time</option>
              <option value="flexible">Flexible</option>
            </select>
            {errors.availability && <span className="error-message">{errors.availability}</span>}
          </div>

          {/* Skills */}
          <div className="form-group">
            <label>Skills <span style={{color:'#6b7280',fontWeight:400}}>(select all that apply)</span></label>
            <div className="tag-grid">
              {SKILLS_LIST.map(skill => (
                <button key={skill} type="button"
                  className={`tag-btn ${formData.skills.includes(skill) ? 'active' : ''}`}
                  onClick={() => toggleItem('skills', skill)}>
                  {skill}
                </button>
              ))}
            </div>
            {errors.skills && <span className="error-message">{errors.skills}</span>}
          </div>

          {/* Causes */}
          <div className="form-group">
            <label>Causes you care about <span style={{color:'#6b7280',fontWeight:400}}>(select all that apply)</span></label>
            <div className="tag-grid">
              {CAUSES.map(cause => (
                <button key={cause} type="button"
                  className={`tag-btn ${formData.causes.includes(cause) ? 'active' : ''}`}
                  onClick={() => toggleItem('causes', cause)}>
                  {cause}
                </button>
              ))}
            </div>
            {errors.causes && <span className="error-message">{errors.causes}</span>}
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio">Short Bio <span style={{color:'#9ca3af',fontWeight:400}}>(optional)</span></label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange}
              className="form-control" rows={3}
              placeholder="Tell NGOs a bit about yourself and why you want to volunteer..." />
          </div>

          {errors.submit && <span className="error-message" style={{display:'block',marginBottom:'1rem'}}>{errors.submit}</span>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Onboarding
