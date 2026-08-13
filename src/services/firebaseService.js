const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

class FirebaseService {
  constructor() {
    this.enabled = false;
    this.db = null;
    this.memory = new Map();
    this.boot();
  }

  async boot() {
    if (firebaseConfig.apiKey.startsWith('YOUR_')) return;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.enabled = true;
  }

  async loadProfile(uid) {
    if (!this.enabled) return this.memory.get(`profile:${uid}`) ?? null;
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const snapshot = await getDoc(doc(this.db, 'profiles', uid));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async saveProfile(profile) {
    this.memory.set(`profile:${profile.uid}`, profile);
    if (!this.enabled) return;
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    await setDoc(doc(this.db, 'profiles', profile.uid), profile, { merge: true });
  }

  async recordMatchResult(uid, reward) {
    if (!this.enabled) return;
    const { addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    await addDoc(collection(this.db, 'matchResults'), { uid, reward, createdAt: serverTimestamp() });
  }

  async requestPayout(payout) {
    this.memory.set(`payout:${Date.now()}`, payout);
    if (!this.enabled) return;
    const { addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    await addDoc(collection(this.db, 'payoutRequests'), { ...payout, createdAt: serverTimestamp() });
  }
}

export const firebaseService = new FirebaseService();
