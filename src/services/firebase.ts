import { deleteApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

function createFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testFirestoreConnection();

/**
 * Cria uma conta de funcionário no Firebase Auth usando uma instância secundária
 * para não terminar a sessão do dono do negócio.
 */
export async function createStaffAuthAccount(internalEmail: string, password: string): Promise<string> {
  const secondaryName = `staffCreator_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, internalEmail, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export function mapAuthErrorToPortuguese(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este número de telefone já tem uma conta registada.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Telefone ou palavra-passe incorrectos. Verifique os dados.';
    case 'auth/weak-password':
      return 'A palavra-passe deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-phone-number':
      return 'Número de telefone inválido. Verifique os dígitos introduzidos.';
    case 'auth/unauthorized-domain':
      return 'Este domínio ainda não está autorizado no Firebase Console (Authentication → Settings → Authorized domains).';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups ou use o acesso por telefone.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'O método Telefone/Palavra-passe precisa de ser activado no Firebase Console (Authentication → Sign-in method → Email/Password) ou use "Entrar com Google".';
    case 'auth/popup-closed-by-user':
      return 'O início de sessão com Google foi cancelado.';
    case 'auth/network-request-failed':
      return 'Sem ligação à internet para autenticar. Tente novamente com rede.';
    default:
      return error instanceof Error ? error.message : 'Ocorreu um erro na autenticação.';
  }
}
