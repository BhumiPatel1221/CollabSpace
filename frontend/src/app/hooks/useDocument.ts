import * as React from "react";
import {
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    addDoc,
    collection,
    query,
    orderBy,
    getDocs,
    getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface DocumentContent {
    id: string;
    title: string;
    content: string;
    ownerId: string;
    ownerName: string;
    collaborators: Record<string, { email: string; displayName: string; role: "editor" | "viewer" }>;
    createdAt: any;
    updatedAt: any;
}

export interface Version {
    id: string;
    content: string;
    editorId: string;
    editorName: string;
    timestamp: any;
    description: string;
}

export function useDocument(docId: string | undefined) {
    const { currentUser } = useAuth();
    const [document, setDocument] = React.useState<DocumentContent | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [userRole, setUserRole] = React.useState<"owner" | "editor" | "viewer" | null>(null);
    const [versions, setVersions] = React.useState<Version[]>([]);
    const [versionsLoading, setVersionsLoading] = React.useState(false);

    // Track whether the local user caused the latest content change
    const isLocalUpdate = React.useRef(false);
    const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Listen to doc changes in real-time
    React.useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const docRef = doc(db, "documents", docId);
        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setError("Document not found");
                    setDocument(null);
                    setLoading(false);
                    return;
                }

                const data = { id: snapshot.id, ...snapshot.data() } as DocumentContent;

                // Determine user role
                if (currentUser) {
                    if (data.ownerId === currentUser.uid) {
                        setUserRole("owner");
                    } else if (data.collaborators?.[currentUser.uid]) {
                        setUserRole(data.collaborators[currentUser.uid].role);
                    } else {
                        setUserRole(null);
                    }
                }

                // Only update content from remote if it's not a local update
                if (isLocalUpdate.current) {
                    isLocalUpdate.current = false;
                    // Still update metadata
                    setDocument((prev) => (prev ? { ...data, content: prev.content } : data));
                } else {
                    setDocument(data);
                }

                setLoading(false);
            },
            (err) => {
                console.error("Error listening to document:", err);
                setError("Failed to load document");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [docId, currentUser]);

    // Update document content with debounced save
    const updateContent = React.useCallback(
        (newContent: string) => {
            if (!docId || !currentUser) return;

            isLocalUpdate.current = true;
            setDocument((prev) => (prev ? { ...prev, content: newContent } : prev));
            setSaving(true);

            // Clear previous timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Debounce: save after 800ms of inactivity
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    // Save the previous content as a version before updating
                    const docRef = doc(db, "documents", docId);
                    const currentSnap = await getDoc(docRef);

                    if (currentSnap.exists()) {
                        const currentData = currentSnap.data();
                        // Only save a version if content actually changed and is non-empty
                        if (currentData.content && currentData.content !== newContent && currentData.content.trim() !== "") {
                            await addDoc(collection(db, "documents", docId, "versions"), {
                                content: currentData.content,
                                editorId: currentUser.uid,
                                editorName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
                                timestamp: serverTimestamp(),
                                description: "Auto-saved version",
                            });
                        }
                    }

                    await updateDoc(docRef, {
                        content: newContent,
                        updatedAt: serverTimestamp(),
                    });

                    setSaving(false);
                } catch (err) {
                    console.error("Failed to save document:", err);
                    setSaving(false);
                }
            }, 800);
        },
        [docId, currentUser]
    );

    // Update document title
    const updateTitle = React.useCallback(
        async (newTitle: string) => {
            if (!docId) return;
            try {
                const docRef = doc(db, "documents", docId);
                await updateDoc(docRef, {
                    title: newTitle,
                    updatedAt: serverTimestamp(),
                });
            } catch (err) {
                console.error("Failed to update title:", err);
            }
        },
        [docId]
    );

    // Fetch version history
    const fetchVersions = React.useCallback(async () => {
        if (!docId) return;
        setVersionsLoading(true);
        try {
            const versionsRef = collection(db, "documents", docId, "versions");
            const versionsQuery = query(versionsRef, orderBy("timestamp", "desc"));
            const snapshot = await getDocs(versionsQuery);
            setVersions(
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Version[]
            );
        } catch (err) {
            console.error("Failed to fetch versions:", err);
        }
        setVersionsLoading(false);
    }, [docId]);

    // Restore a specific version
    const restoreVersion = React.useCallback(
        async (versionId: string) => {
            if (!docId || !currentUser) return;
            try {
                const versionRef = doc(db, "documents", docId, "versions", versionId);
                const versionSnap = await getDoc(versionRef);

                if (!versionSnap.exists()) return;

                const versionData = versionSnap.data();

                // Save current content as a version first
                const docRef = doc(db, "documents", docId);
                const currentSnap = await getDoc(docRef);
                if (currentSnap.exists()) {
                    await addDoc(collection(db, "documents", docId, "versions"), {
                        content: currentSnap.data().content,
                        editorId: currentUser.uid,
                        editorName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
                        timestamp: serverTimestamp(),
                        description: "Before restore",
                    });
                }

                // Restore
                await updateDoc(docRef, {
                    content: versionData.content,
                    updatedAt: serverTimestamp(),
                });

                await fetchVersions();
            } catch (err) {
                console.error("Failed to restore version:", err);
            }
        },
        [docId, currentUser, fetchVersions]
    );

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const canEdit = userRole === "owner" || userRole === "editor";

    return {
        document,
        loading,
        error,
        saving,
        userRole,
        canEdit,
        updateContent,
        updateTitle,
        versions,
        versionsLoading,
        fetchVersions,
        restoreVersion,
    };
}
