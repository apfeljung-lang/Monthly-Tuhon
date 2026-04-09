import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// 환경 변수에서 구성을 가져오거나 JSON 파일에서 폴백을 사용합니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId
};

// 설정값 검증: 플레이스홀더가 그대로 있거나 비어있는지 확인
const checkConfig = () => {
  const missing = [];
  if (firebaseConfig.apiKey === 'YOUR_API_KEY' || !firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (firebaseConfig.authDomain === 'YOUR_AUTH_DOMAIN' || !firebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (firebaseConfig.projectId === 'YOUR_PROJECT_ID' || !firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (firebaseConfig.storageBucket === 'YOUR_STORAGE_BUCKET' || !firebaseConfig.storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
  if (firebaseConfig.messagingSenderId === 'YOUR_MESSAGING_SENDER_ID' || !firebaseConfig.messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  if (firebaseConfig.appId === 'YOUR_APP_ID' || !firebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID');
  if (firebaseConfig.firestoreDatabaseId === 'YOUR_DATABASE_ID' || !firebaseConfig.firestoreDatabaseId) missing.push('VITE_FIREBASE_DATABASE_ID');
  return missing;
};

export const missingConfigKeys = checkConfig();
export const isConfigMissing = missingConfigKeys.length > 0;

if (isConfigMissing) {
  console.error('❌ Firebase 설정이 누락되었습니다. 다음 항목을 등록해 주세요:', missingConfigKeys.join(', '));
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// 프로젝트 구성에 명시된 특정 데이터베이스 ID를 사용하여 연결
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection test successful');
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
