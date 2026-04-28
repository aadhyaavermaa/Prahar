import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext(null)

export const translations = {
  en: {
    // Header
    home: 'Home',
    liveMap: '🗺️ Live Map',
    impact: '📰 Impact',
    leaderboard: '🏆 Leaderboard',
    volDashboard: 'Vol. Dashboard',
    ngoDashboard: 'NGO Dashboard',
    login: 'Login',
    signUp: 'Sign Up',
    back: '← Back',
    langToggle: '🇮🇳 हिंदी',

    // Landing
    heroTitle: 'Environmental Intelligence for',
    heroHighlight: 'Smart Resource Allocation',
    heroSubtitle: 'Satellite + API data predicts crises 48–72 hrs before they peak. AI-powered volunteer matching and dynamic workforce redistribution for NGOs.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    powerfulFeatures: 'Powerful Features',
    feature1Title: 'Dynamic Workforce Redistribution',
    feature1Desc: 'Continuously rebalances volunteers across NGOs and regions by demand',
    feature2Title: 'AI Volunteer Matching',
    feature2Desc: 'Gemini matches by skill, location, reliability, and urgency',
    feature3Title: 'Fleet Routing',
    feature3Desc: 'Multi-volunteer, multi-location deployment optimization',
    feature4Title: 'CV Impact Scoring',
    feature4Desc: 'AI scores before/after photos — proof, not self-reporting',
    feature5Title: 'Dual Gamification',
    feature5Desc: 'Points, badges & leaderboards for both volunteers AND NGOs',
    feature6Title: 'Weekly Impact Showcase',
    feature6Desc: 'Auto-compiled visual newspaper of real social impact',
    ctaTitle: 'Ready to Make an Impact?',
    ctaSubtitle: 'Join thousands of NGOs and volunteers making a difference with smart resource allocation.',
    joinVolunteer: 'Join as Volunteer',
    registerNgo: 'Register Your NGO',

    // Login
    welcomeBack: 'Welcome Back',
    signInSubtitle: 'Sign in to your Prahar account',
    volunteer: 'Volunteer',
    ngoRep: 'NGO Representative',
    emailAddress: 'Email Address',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    orDivider: 'OR',
    continueGoogle: 'Continue with Google',
    noAccount: "Don't have an account?",

    // Signup
    joinPrahar: 'Join Prahar',
    createAccount: 'Create your account to start making an impact',
    volunteerAssociated: 'Volunteer',
    volunteerAssociatedSub: 'Already with an NGO',
    volunteerNew: 'Volunteer',
    volunteerNewSub: 'Looking for opportunities',
    ngo: 'NGO',
    ngoSub: 'Representative',
    firstName: 'First Name',
    lastName: 'Last Name',
    contactNo: 'Contact Number',
    ngoName: 'NGO Name',
    yourRole: 'Your Role in NGO',
    skills: 'Skills / Interests',
    availability: 'Availability',
    regNumber: 'Registration Number',
    designation: 'Your Designation',
    ngoWebsite: 'NGO Website',
    confirmPassword: 'Confirm Password',
    agreeTerms: 'I agree to the Terms of Service and Privacy Policy',
    createAccountBtn: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyAccount: 'Already have an account?',

    // Leaderboard
    leaderboardTitle: 'Leaderboard',
    leaderboardSubtitle: "Top performers making Delhi's future cleaner",
    volunteers: '🙋 Volunteers',
    ngos: '🏢 NGOs',
    leaderboardFooter: 'Rankings update weekly · Earn points by completing verified tasks',

    // Impact
    impactTitle: '📰 This Week\'s Impact Stories',
    impactWeek: 'Week of Apr 14–20, 2026',
    aiInsight: '🤖 AI Insight:',
    aiInsightText: 'Delhi witnessed a 23% improvement in river cleanliness this week, with record volunteer turnout across 5 critical zones.',
    uploadImpact: '📤 Upload Impact',
    newsArticle: '📰 News Article',
    viewStory: '📖 View Story',
    share: '🔗 Share',
    verifiedAI: '✅ Verified by AI • Real Impact Data',
    impactScore: 'Impact Score',

    // Map
    mapTitle: 'PRAHAR Intelligence Map',
    mapSubtitle: 'Real-time disaster zone monitoring · Delhi NCR',
    systemStatus: 'System Status',
    operational: '● Operational',
    joinTask: '🙋 Join Task',
    joinEmergency: '🚨 Join Emergency Task',
    viewDetails: '📊 View Details',
    severityScore: 'Severity Score',
    availableTasks: 'Available Tasks',
    volunteersNeeded: 'Needed',
    tasks: 'Tasks',
    urgency: 'Urgency',
    ngoDoHere: '🏢 What NGOs Do Here',
    volunteerReqs: '✅ Volunteer Requirements',
    aiPrediction: '🔮 AI Prediction',

    // Dashboards
    ngoCommandCentre: 'NGO Command Centre',
    activeTasks: 'Active Tasks',
    volunteersAssigned: 'Volunteers Assigned',
    ngoPoints: 'NGO Points',
    totalTasks: 'Total Tasks',
    ngoImpactScore: 'NGO Impact Score',
    nextTier: 'Next tier at',
    createTask: '+ Create Task',
    redistribution: '🔁 Redistribution',
    loadingTasks: 'Loading tasks…',
    noTasks: 'No tasks yet. Create your first task!',
    logout: 'Logout',
  },

  hi: {
    // Header
    home: 'होम',
    liveMap: '🗺️ लाइव मैप',
    impact: '📰 प्रभाव',
    leaderboard: '🏆 लीडरबोर्ड',
    volDashboard: 'स्वयंसेवक डैशबोर्ड',
    ngoDashboard: 'NGO डैशबोर्ड',
    login: 'लॉगिन',
    signUp: 'साइन अप',
    back: '← वापस',
    langToggle: '🇬🇧 English',

    // Landing
    heroTitle: 'पर्यावरण इंटेलिजेंस',
    heroHighlight: 'स्मार्ट संसाधन आवंटन के लिए',
    heroSubtitle: 'सैटेलाइट + API डेटा संकट को 48-72 घंटे पहले पूर्वानुमानित करता है। NGOs के लिए AI-संचालित स्वयंसेवक मिलान और गतिशील कार्यबल पुनर्वितरण।',
    getStarted: 'शुरू करें',
    learnMore: 'और जानें',
    powerfulFeatures: 'शक्तिशाली विशेषताएं',
    feature1Title: 'गतिशील कार्यबल पुनर्वितरण',
    feature1Desc: 'मांग के अनुसार NGOs और क्षेत्रों में स्वयंसेवकों को लगातार पुनर्संतुलित करता है',
    feature2Title: 'AI स्वयंसेवक मिलान',
    feature2Desc: 'Gemini कौशल, स्थान, विश्वसनीयता और तात्कालिकता के आधार पर मिलान करता है',
    feature3Title: 'फ्लीट रूटिंग',
    feature3Desc: 'बहु-स्वयंसेवक, बहु-स्थान तैनाती अनुकूलन',
    feature4Title: 'CV प्रभाव स्कोरिंग',
    feature4Desc: 'AI पहले/बाद की तस्वीरें स्कोर करता है — प्रमाण, स्व-रिपोर्टिंग नहीं',
    feature5Title: 'दोहरा गेमिफिकेशन',
    feature5Desc: 'स्वयंसेवकों और NGOs दोनों के लिए पॉइंट, बैज और लीडरबोर्ड',
    feature6Title: 'साप्ताहिक प्रभाव शोकेस',
    feature6Desc: 'वास्तविक सामाजिक प्रभाव का स्वतः-संकलित दृश्य समाचार पत्र',
    ctaTitle: 'प्रभाव डालने के लिए तैयार हैं?',
    ctaSubtitle: 'स्मार्ट संसाधन आवंटन के साथ बदलाव लाने वाले हजारों NGOs और स्वयंसेवकों से जुड़ें।',
    joinVolunteer: 'स्वयंसेवक के रूप में जुड़ें',
    registerNgo: 'अपना NGO पंजीकृत करें',

    // Login
    welcomeBack: 'वापस स्वागत है',
    signInSubtitle: 'अपने Prahar खाते में साइन इन करें',
    volunteer: 'स्वयंसेवक',
    ngoRep: 'NGO प्रतिनिधि',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    rememberMe: 'मुझे याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    signIn: 'साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    orDivider: 'या',
    continueGoogle: 'Google से जारी रखें',
    noAccount: 'खाता नहीं है?',

    // Signup
    joinPrahar: 'Prahar से जुड़ें',
    createAccount: 'प्रभाव डालना शुरू करने के लिए अपना खाता बनाएं',
    volunteerAssociated: 'स्वयंसेवक',
    volunteerAssociatedSub: 'पहले से किसी NGO के साथ',
    volunteerNew: 'स्वयंसेवक',
    volunteerNewSub: 'अवसर खोज रहे हैं',
    ngo: 'NGO',
    ngoSub: 'प्रतिनिधि',
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    contactNo: 'संपर्क नंबर',
    ngoName: 'NGO का नाम',
    yourRole: 'NGO में आपकी भूमिका',
    skills: 'कौशल / रुचियां',
    availability: 'उपलब्धता',
    regNumber: 'पंजीकरण संख्या',
    designation: 'आपका पदनाम',
    ngoWebsite: 'NGO वेबसाइट',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    agreeTerms: 'मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूं',
    createAccountBtn: 'खाता बनाएं',
    creatingAccount: 'खाता बन रहा है...',
    alreadyAccount: 'पहले से खाता है?',

    // Leaderboard
    leaderboardTitle: 'लीडरबोर्ड',
    leaderboardSubtitle: 'दिल्ली का भविष्य बेहतर बनाने वाले शीर्ष प्रदर्शनकर्ता',
    volunteers: '🙋 स्वयंसेवक',
    ngos: '🏢 NGOs',
    leaderboardFooter: 'रैंकिंग साप्ताहिक अपडेट होती है · सत्यापित कार्य पूरे करके पॉइंट कमाएं',

    // Impact
    impactTitle: '📰 इस सप्ताह की प्रभाव कहानियां',
    impactWeek: '14–20 अप्रैल 2026 का सप्ताह',
    aiInsight: '🤖 AI अंतर्दृष्टि:',
    aiInsightText: 'इस सप्ताह दिल्ली में नदी की स्वच्छता में 23% सुधार हुआ, 5 महत्वपूर्ण क्षेत्रों में रिकॉर्ड स्वयंसेवक उपस्थिति के साथ।',
    uploadImpact: '📤 प्रभाव अपलोड करें',
    newsArticle: '📰 समाचार लेख',
    viewStory: '📖 कहानी देखें',
    share: '🔗 शेयर करें',
    verifiedAI: '✅ AI द्वारा सत्यापित • वास्तविक प्रभाव डेटा',
    impactScore: 'प्रभाव स्कोर',

    // Map
    mapTitle: 'PRAHAR इंटेलिजेंस मैप',
    mapSubtitle: 'रियल-टाइम आपदा क्षेत्र निगरानी · दिल्ली NCR',
    systemStatus: 'सिस्टम स्थिति',
    operational: '● चालू',
    joinTask: '🙋 कार्य में शामिल हों',
    joinEmergency: '🚨 आपातकालीन कार्य में शामिल हों',
    viewDetails: '📊 विवरण देखें',
    severityScore: 'गंभीरता स्कोर',
    availableTasks: 'उपलब्ध कार्य',
    volunteersNeeded: 'आवश्यक',
    tasks: 'कार्य',
    urgency: 'तात्कालिकता',
    ngoDoHere: '🏢 NGOs यहाँ क्या करते हैं',
    volunteerReqs: '✅ स्वयंसेवक आवश्यकताएं',
    aiPrediction: '🔮 AI पूर्वानुमान',

    // Dashboards
    ngoCommandCentre: 'NGO कमांड सेंटर',
    activeTasks: 'सक्रिय कार्य',
    volunteersAssigned: 'नियुक्त स्वयंसेवक',
    ngoPoints: 'NGO पॉइंट',
    totalTasks: 'कुल कार्य',
    ngoImpactScore: 'NGO प्रभाव स्कोर',
    nextTier: 'अगला स्तर',
    createTask: '+ कार्य बनाएं',
    redistribution: '🔁 पुनर्वितरण',
    loadingTasks: 'कार्य लोड हो रहे हैं…',
    noTasks: 'अभी कोई कार्य नहीं। अपना पहला कार्य बनाएं!',
    logout: 'लॉगआउट',
  }
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(false)

  const toggleLang = () => {
    setLoading(true)
    setTimeout(() => {
      setLang(prev => prev === 'en' ? 'hi' : 'en')
      setLoading(false)
    }, 800)
  }

  const t = (key) => translations[lang][key] || translations['en'][key] || key

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, loading, t }}>
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            {lang === 'en' ? 'हिंदी में बदल रहे हैं...' : 'Switching to English...'}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
