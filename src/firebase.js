import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

// Save user role doc under /users/{uid}
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

// Get user role doc
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// Get volunteer onboarding doc
export const getVolunteerProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'volunteers', uid))
  return snap.exists() ? snap.data() : null
}

// Save volunteer onboarding data
export const saveVolunteerProfile = async (uid, data) => {
  await setDoc(doc(db, 'volunteers', uid), { ...data, profileComplete: true, updatedAt: new Date() })
}

// ── Task joining (real-time) ──────────────────────────────────────────────────

// Volunteer joins a task from the map — writes to Firestore
export const joinTask = async (uid, task, zone) => {
  await addDoc(collection(db, 'joinedTasks'), {
    uid,
    taskTitle: task.title,
    taskType: task.type,
    amount: task.type === 'paid' ? task.amount : 0,
    urgencyBonus: task.urgencyBonus || 0,
    totalPay: task.type === 'paid' ? (task.amount + (task.urgencyBonus || 0)) : 0,
    duration: task.duration,
    zoneName: zone.name,
    zoneDomain: zone.domain,
    zoneScore: Math.round(zone.score),
    isEmergency: zone.score >= 70,
    isPredicted: zone.predicted || false,
    status: 'active',
    joinedAt: serverTimestamp(),
  })
}

// Listen to a volunteer's joined tasks in real-time
export const subscribeToMyTasks = (uid, callback) => {
  const q = query(collection(db, 'joinedTasks'), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(tasks)
  })
}
