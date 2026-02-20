import * as React from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../../firebase/firebase";

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

async function saveUserToFirestore(user: User) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp(),
        });
    } else {
        // Update lastLogin
        await setDoc(
            userRef,
            {
                displayName: user.displayName || userSnap.data().displayName,
                email: user.email || userSnap.data().email,
                photoURL: user.photoURL || userSnap.data().photoURL,
                lastLogin: serverTimestamp(),
            },
            { merge: true }
        );
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    await saveUserToFirestore(user);
                } catch (err) {
                    console.error("Failed to save user to Firestore:", err);
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        await saveUserToFirestore(result.user);
    };

    const loginWithEmail = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(result.user);
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name in Firestore since createUser doesn't set it on the auth object
        await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            displayName,
            email: result.user.email || email,
            photoURL: "",
            createdAt: serverTimestamp(),
        });
    };

    const logout = async () => {
        await signOut(auth);
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
