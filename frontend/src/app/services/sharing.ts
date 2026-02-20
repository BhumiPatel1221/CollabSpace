import {
    doc,
    updateDoc,
    deleteField,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

export interface Collaborator {
    uid: string;
    email: string;
    displayName: string;
    role: "editor" | "viewer";
}

/**
 * Look up a user by email from the users collection.
 */
export async function findUserByEmail(email: string) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const userData = snapshot.docs[0].data();
    return {
        uid: snapshot.docs[0].id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
    };
}

/**
 * Create a notification for a user.
 */
async function createNotification(
    userId: string,
    data: {
        type: "share" | "role_change" | "document_update";
        title: string;
        message: string;
        documentId?: string;
        documentTitle?: string;
        fromUserId?: string;
        fromUserName?: string;
    }
) {
    try {
        const notifRef = collection(db, "users", userId, "notifications");
        await addDoc(notifRef, {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
}

/**
 * Add a collaborator to a document by email.
 */
export async function addCollaborator(
    docId: string,
    email: string,
    role: "editor" | "viewer",
    currentUserName?: string,
    currentUserId?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return { success: false, message: "No user found with that email address." };
        }

        const docRef = doc(db, "documents", docId);
        await updateDoc(docRef, {
            [`collaborators.${user.uid}`]: {
                email: user.email,
                displayName: user.displayName,
                role,
            },
        });

        // Get document title for notification
        let documentTitle = "a document";
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                documentTitle = docSnap.data().title || "a document";
            }
        } catch { }

        // Create notification for the shared user
        await createNotification(user.uid, {
            type: "share",
            title: "Document Shared With You",
            message: `${currentUserName || "Someone"} shared "${documentTitle}" with you as ${role === "editor" ? "an editor" : "a viewer"}.`,
            documentId: docId,
            documentTitle,
            fromUserId: currentUserId,
            fromUserName: currentUserName,
        });

        return { success: true, message: `${user.displayName} added as ${role}.` };
    } catch (err) {
        console.error("Failed to add collaborator:", err);
        return { success: false, message: "Failed to add collaborator." };
    }
}

/**
 * Update a collaborator's role.
 */
export async function updateCollaboratorRole(
    docId: string,
    uid: string,
    newRole: "editor" | "viewer"
): Promise<void> {
    const docRef = doc(db, "documents", docId);
    await updateDoc(docRef, {
        [`collaborators.${uid}.role`]: newRole,
    });
}

/**
 * Remove a collaborator from a document.
 */
export async function removeCollaborator(docId: string, uid: string): Promise<void> {
    const docRef = doc(db, "documents", docId);
    await updateDoc(docRef, {
        [`collaborators.${uid}`]: deleteField(),
    });
}
