import * as React from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    type DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface CollabDocument {
    id: string;
    title: string;
    content: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    collaborators: Record<string, { email: string; displayName: string; role: "editor" | "viewer" }>;
    createdAt: any;
    updatedAt: any;
}

export function useDocuments() {
    const { currentUser } = useAuth();
    const [ownedDocuments, setOwnedDocuments] = React.useState<CollabDocument[]>([]);
    const [sharedDocuments, setSharedDocuments] = React.useState<CollabDocument[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!currentUser) {
            setOwnedDocuments([]);
            setSharedDocuments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let ownedDocs: CollabDocument[] = [];
        let sharedDocs: CollabDocument[] = [];
        let ownedLoaded = false;
        let sharedLoaded = false;

        // Query for documents owned by the user
        const ownedQuery = query(
            collection(db, "documents"),
            where("ownerId", "==", currentUser.uid)
        );

        const unsubOwned = onSnapshot(
            ownedQuery,
            (snapshot) => {
                ownedDocs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as CollabDocument[];

                // Sort by updatedAt
                ownedDocs.sort((a, b) => {
                    const aTime = a.updatedAt?.toMillis?.() || 0;
                    const bTime = b.updatedAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                setOwnedDocuments(ownedDocs);
                ownedLoaded = true;
                if (ownedLoaded && sharedLoaded) setLoading(false);
            },
            (err) => {
                console.error("Error fetching owned documents:", err);
                setError("Failed to load your documents");
                setLoading(false);
            }
        );

        // Query for documents where user is a collaborator
        const sharedQuery = query(
            collection(db, "documents"),
            where(`collaborators.${currentUser.uid}.email`, "!=", "")
        );

        const unsubShared = onSnapshot(
            sharedQuery,
            (snapshot) => {
                sharedDocs = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .filter((d: any) => d.ownerId !== currentUser.uid) as CollabDocument[];

                // Sort by updatedAt
                sharedDocs.sort((a, b) => {
                    const aTime = a.updatedAt?.toMillis?.() || 0;
                    const bTime = b.updatedAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                setSharedDocuments(sharedDocs);
                sharedLoaded = true;
                if (ownedLoaded && sharedLoaded) setLoading(false);
            },
            (err) => {
                // This query may fail if no index exists — fallback silently
                console.warn("Shared documents query needs a Firestore index:", err);
                sharedLoaded = true;
                if (ownedLoaded && sharedLoaded) setLoading(false);
            }
        );

        // Set loading to false after a timeout in case one query never resolves
        const timeout = setTimeout(() => setLoading(false), 5000);

        return () => {
            unsubOwned();
            unsubShared();
            clearTimeout(timeout);
        };
    }, [currentUser]);

    // Combined documents (for backward compatibility)
    const documents = React.useMemo(() => {
        const merged = new Map<string, CollabDocument>();
        [...ownedDocuments, ...sharedDocuments].forEach((doc) => {
            merged.set(doc.id, doc);
        });

        return Array.from(merged.values()).sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
        });
    }, [ownedDocuments, sharedDocuments]);

    const createDocument = async (title: string): Promise<string> => {
        if (!currentUser) throw new Error("User must be authenticated");

        // Get user's display name from Firestore profile (more reliable than auth)
        let displayName = currentUser.displayName || "";
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                displayName = userDoc.data().displayName || displayName;
            }
        } catch { }

        // Final fallback: use email prefix instead of "Anonymous"
        if (!displayName) {
            displayName = currentUser.email?.split("@")[0] || "User";
        }

        const docRef = await addDoc(collection(db, "documents"), {
            title: title.trim(),
            content: "",
            ownerId: currentUser.uid,
            ownerName: displayName,
            ownerEmail: currentUser.email || "",
            collaborators: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    };

    return { documents, ownedDocuments, sharedDocuments, loading, error, createDocument };
}
