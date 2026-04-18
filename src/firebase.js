import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

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

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export const getVolunteerProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'volunteers', uid))
  return snap.exists() ? snap.data() : null
}

export const saveVolunteerProfile = async (uid, data) => {
  await setDoc(doc(db, 'volunteers', uid), { ...data, profileComplete: true, updatedAt: new Date() })
}

export const joinTask = async (uid, task, zone) => {
  await setDoc(doc(db, 'volunteers', uid, 'activeTasks', String(task.id)), {
    taskId: task.id,
    taskTitle: task.title,
    zoneId: zone.id,
    zoneName: zone.name,
    joinedAt: new Date(),
    duration: task.duration,
  })
}