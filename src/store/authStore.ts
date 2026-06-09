import { create } from 'zustand'
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
  magicLinkSent: boolean
  init: () => void
  sendMagicLink: (email: string) => Promise<void>
  completeMagicLink: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  magicLinkSent: false,

  init() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      get().completeMagicLink()
      // fall through so onAuthStateChanged is still subscribed
    }

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

  async sendMagicLink(email) {
    await sendSignInLinkToEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: true,
    })
    localStorage.setItem('emailForSignIn', email)
    set({ magicLinkSent: true })
  },

  async completeMagicLink() {
    let email = localStorage.getItem('emailForSignIn')
    if (!email) {
      // Link opened on a different device — ask for email in UI
      set({ loading: false })
      return
    }
    try {
      await signInWithEmailLink(auth, email, window.location.href)
      localStorage.removeItem('emailForSignIn')
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (err) {
      console.error('Magic link sign-in failed:', err)
      set({ loading: false })
    }
  },

  async signOut() {
    await fbSignOut(auth)
    set({ user: null, profile: null, role: null })
  },
}))
