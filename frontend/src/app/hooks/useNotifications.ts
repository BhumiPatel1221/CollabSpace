import * as React from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    writeBatch,
    where,
    getDocs,
    Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface Notification {
    id: string;
    type: "share" | "role_change" | "document_update";
    title: string;
    message: string;
    documentId?: string;
    documentTitle?: string;
    fromUserId?: string;
    fromUserName?: string;
    read: boolean;
    createdAt: any;
}

export function useNotifications() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        const notifRef = collection(db, "users", currentUser.uid, "notifications");
        const notifQuery = query(notifRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            notifQuery,
            (snapshot) => {
                const notifs: Notification[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Notification[];
                setNotifications(notifs);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching notifications:", err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = React.useCallback(
        async (notificationId: string) => {
            if (!currentUser) return;
            try {
                const notifRef = doc(db, "users", currentUser.uid, "notifications", notificationId);
                await updateDoc(notifRef, { read: true });
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        },
        [currentUser]
    );

    const markAllAsRead = React.useCallback(async () => {
        if (!currentUser) return;
        try {
            const notifRef = collection(db, "users", currentUser.uid, "notifications");
            const unreadQuery = query(notifRef, where("read", "==", false));
            const snapshot = await getDocs(unreadQuery);

            const batch = writeBatch(db);
            snapshot.docs.forEach((docSnap) => {
                batch.update(docSnap.ref, { read: true });
            });
            await batch.commit();
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
        }
    }, [currentUser]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
