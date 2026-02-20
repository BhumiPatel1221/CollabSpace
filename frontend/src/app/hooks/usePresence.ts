import * as React from "react";
import {
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface PresenceUser {
    uid: string;
    displayName: string;
    photoURL: string;
    lastSeen: any;
}

export function usePresence(docId: string | undefined) {
    const { currentUser } = useAuth();
    const [onlineUsers, setOnlineUsers] = React.useState<PresenceUser[]>([]);

    // Set presence when user opens document
    React.useEffect(() => {
        if (!docId || !currentUser) return;

        const presenceRef = doc(db, "presence", docId, "users", currentUser.uid);

        // Set presence
        setDoc(presenceRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            photoURL: currentUser.photoURL || "",
            lastSeen: serverTimestamp(),
        });

        // Heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
            setDoc(presenceRef, {
                uid: currentUser.uid,
                displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
                photoURL: currentUser.photoURL || "",
                lastSeen: serverTimestamp(),
            });
        }, 30000);

        // Remove presence on leave
        return () => {
            clearInterval(heartbeat);
            deleteDoc(presenceRef).catch(console.error);
        };
    }, [docId, currentUser]);

    // Listen to online users
    React.useEffect(() => {
        if (!docId) return;

        const presenceCollection = collection(db, "presence", docId, "users");
        const unsubscribe = onSnapshot(presenceCollection, (snapshot) => {
            const now = Date.now();
            const users: PresenceUser[] = [];

            snapshot.docs.forEach((doc) => {
                const data = doc.data() as PresenceUser;
                const lastSeen = data.lastSeen?.toMillis?.() || 0;
                // Consider users online if seen within the last 60 seconds
                if (now - lastSeen < 60000) {
                    users.push(data);
                }
            });

            setOnlineUsers(users);
        });

        return () => unsubscribe();
    }, [docId]);

    return { onlineUsers };
}
