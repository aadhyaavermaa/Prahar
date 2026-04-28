import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBZiBScTGSXOQLd39Udg7Z4M94pfcwKvgw",
  authDomain: "prahar-b7b72.firebaseapp.com",
  projectId: "prahar-b7b72",
  storageBucket: "prahar-b7b72.firebasestorage.app",
  messagingSenderId: "550476506353",
  appId: "1:550476506353:web:79ed253939e54dd8ecb550",
  measurementId: "G-JVYMFGS9LQ"
};

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