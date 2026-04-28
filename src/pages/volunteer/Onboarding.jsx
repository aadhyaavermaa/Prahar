import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { saveVolunteerProfile } from '../../firebase'
import { useLang } from '../../context/LanguageContext'

const CAUSES = ['Education', 'Healthcare', 'Environment', 'Women Empowerment', 'Child Welfare', 'Elderly Care', 'Animal Welfare', 'Disaster Relief']
const CAUSES_HI = ['शिक्षा', 'स्वास्थ्य सेवा', 'पर्यावरण', 'महिला सशक्तिकरण', 'बाल कल्याण', 'वृद्ध देखभाल', 'पशु कल्याण', 'आपदा राहत']
const SKILLS_LIST = ['Teaching', 'Medical/Healthcare', 'IT & Technology', 'Legal Aid', 'Counseling', 'Photography', 'Event Management', 'Fundraising', 'Social Media', 'Translation']
const SKILLS_HI = ['शिक्षण', 'चिकित्सा/स्वास्थ्य', 'IT और तकनीक', 'कानूनी सहायता', 'परामर्श', 'फोटोग्राफी', 'इवेंट मैनेजमेंट', 'फंडरेजिंग', 'सोशल मीडिया', 'अनुवाद']

const Onboarding = () => {
  const { user, refreshProfile } = useAuth()
  const devUser = user || { uid: 'dev-user-preview' }
  const navigate = useNavigate()
  const { lang } = useLang()
  const [step, setStep] = useState(1) // 1 = form, 2 = success
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const FIRESTORE_TIMEOUT_MS = 6000

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
      await Promise.race([
        saveVolunteerProfile(devUser.uid, formData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile save timeout')), FIRESTORE_TIMEOUT_MS)),
      ])

      if (user) {
        try {
          await Promise.race([
            refreshProfile(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile refresh timeout')), FIRESTORE_TIMEOUT_MS)),
          ])
        } catch (refreshErr) {
          console.warn('Profile refresh failed after onboarding save:', refreshErr)
        }
      }
      setStep(2)
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Profile save is delayed. You can continue to dashboard and retry later.' })
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-success">
          <div className="success-icon">🎉</div>
          <h2>{lang==='hi' ? 'आप तैयार हैं!' : "You're all set!"}</h2>
          <p>{lang==='hi' ? 'आपकी स्वयंसेवक प्रोफ़ाइल पूरी हो गई। आइए आपके लिए कुछ सार्थक काम खोजें।' : "Your volunteer profile is complete. Let's find you some meaningful work."}</p>
          <button className="btn btn-primary" onClick={() => navigate('/volunteer/dashboard')}>
            {lang==='hi' ? 'डैशबोर्ड पर जाएं →' : 'Go to Dashboard →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-step-badge">{lang==='hi' ? 'चरण 1 / 1' : 'Step 1 of 1'}</div>
          <h2>{lang==='hi' ? 'अपनी स्वयंसेवक प्रोफ़ाइल पूरी करें' : 'Complete your volunteer profile'}</h2>
          <p>{lang==='hi' ? 'इससे NGOs को सही स्वयंसेवक खोजने में मदद मिलती है।' : 'This helps NGOs find the right volunteers for their work.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">{lang==='hi' ? 'पूरा नाम' : 'Full Name'}</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName}
                onChange={handleChange} className={`form-control ${errors.fullName ? 'error' : ''}`}
                placeholder={lang==='hi' ? 'आपका पूरा नाम' : 'Your full name'} />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="location">{lang==='hi' ? 'स्थान' : 'Location'}</label>
              <input type="text" id="location" name="location" value={formData.location}
                onChange={handleChange} className={`form-control ${errors.location ? 'error' : ''}`}
                placeholder={lang==='hi' ? 'शहर, राज्य' : 'City, State'} />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="availability">{lang==='hi' ? 'उपलब्धता' : 'Availability'}</label>
            <select id="availability" name="availability" value={formData.availability}
              onChange={handleChange} className={`form-control ${errors.availability ? 'error' : ''}`}>
              <option value="">{lang==='hi' ? 'अपनी उपलब्धता चुनें' : 'Select your availability'}</option>
              <option value="weekends">{lang==='hi' ? 'केवल सप्ताहांत' : 'Weekends only'}</option>
              <option value="weekdays">{lang==='hi' ? 'केवल सप्ताह के दिन' : 'Weekdays only'}</option>
              <option value="fulltime">{lang==='hi' ? 'पूर्णकालिक' : 'Full-time'}</option>
              <option value="flexible">{lang==='hi' ? 'लचीला' : 'Flexible'}</option>
            </select>
            {errors.availability && <span className="error-message">{errors.availability}</span>}
          </div>

          <div className="form-group">
            <label>{lang==='hi' ? 'कौशल' : 'Skills'} <span style={{color:'#6b7280',fontWeight:400}}>({lang==='hi' ? 'सभी लागू चुनें' : 'select all that apply'})</span></label>
            <div className="tag-grid">
              {SKILLS_LIST.map((skill, i) => (
                <button key={skill} type="button"
                  className={`tag-btn ${formData.skills.includes(skill) ? 'active' : ''}`}
                  onClick={() => toggleItem('skills', skill)}>
                  {lang==='hi' ? SKILLS_HI[i] : skill}
                </button>
              ))}
            </div>
            {errors.skills && <span className="error-message">{errors.skills}</span>}
          </div>

          <div className="form-group">
            <label>{lang==='hi' ? 'आप किन कारणों की परवाह करते हैं' : 'Causes you care about'} <span style={{color:'#6b7280',fontWeight:400}}>({lang==='hi' ? 'सभी लागू चुनें' : 'select all that apply'})</span></label>
            <div className="tag-grid">
              {CAUSES.map((cause, i) => (
                <button key={cause} type="button"
                  className={`tag-btn ${formData.causes.includes(cause) ? 'active' : ''}`}
                  onClick={() => toggleItem('causes', cause)}>
                  {lang==='hi' ? CAUSES_HI[i] : cause}
                </button>
              ))}
            </div>
            {errors.causes && <span className="error-message">{errors.causes}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bio">{lang==='hi' ? 'संक्षिप्त परिचय' : 'Short Bio'} <span style={{color:'#9ca3af',fontWeight:400}}>({lang==='hi' ? 'वैकल्पिक' : 'optional'})</span></label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange}
              className="form-control" rows={3}
              placeholder={lang==='hi' ? 'NGOs को अपने बारे में और स्वयंसेवा करने की इच्छा के बारे में बताएं...' : 'Tell NGOs a bit about yourself and why you want to volunteer...'} />
          </div>

          {errors.submit && <span className="error-message" style={{display:'block',marginBottom:'1rem'}}>{errors.submit}</span>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (lang==='hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (lang==='hi' ? 'प्रोफ़ाइल पूरी करें' : 'Complete Profile')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Onboarding
