import { create } from 'zustand'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export type UserRole = 'ic' | 'admin'

export interface UserProfile {
  email: string
  displayName: string
  role: UserRole
}

interface AuthStore {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  allUsers: UserProfile[]
  init: () => void
  signIn: (email: string, password: string) => Promise<void>
  createAccount: (name: string, email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loadAllUsers: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  allUsers: [],

  init() {
    let timeout: ReturnType<typeof setTimeout>

    const unsub = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout)
      if (!user) {
        set({ user: null, profile: null, role: null, loading: false })
        return
      }
      try {
        const profileRef = doc(db, 'users', user.uid)
        const snap = await getDoc(profileRef)

        let profile: UserProfile
        if (snap.exists()) {
          profile = snap.data() as UserProfile
        } else {
          profile = {
            email: user.email!,
            displayName: user.email!.split('@')[0],
            role: 'ic',
          }
          await setDoc(profileRef, { ...profile, createdAt: serverTimestamp() })
        }
        set({ user, profile, role: profile.role, loading: false })
      } catch (err) {
        console.error('Profile load failed:', err)
        const profile: UserProfile = {
          email: user.email!,
          displayName: user.email!.split('@')[0],
          role: 'ic',
        }
        set({ user, profile, role: 'ic', loading: false })
      }
    })

    // Hard fallback — if Firebase never fires, unblock the UI after 8s
    timeout = setTimeout(() => {
      unsub()
      set({ user: null, profile: null, role: null, loading: false })
    }, 8000)
  },

  async signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged handles state update
  },

  async createAccount(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const profile: UserProfile = {
      email,
      displayName: name.trim(),
      role: 'ic',
    }
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    })
    // onAuthStateChanged fires and sets user/profile state
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  },

  async loadAllUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'))
      const users = snap.docs.map(d => d.data() as UserProfile)
      set({ allUsers: users })
    } catch (err) {
      console.error('loadAllUsers failed:', err)
    }
  },

  async signOut() {
    await fbSignOut(auth)
    set({ user: null, profile: null, role: null, allUsers: [] })
  },
}))
