import * as React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center aurora-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-[16px] flex items-center justify-center animate-pulse shadow-xl shadow-[#6366F1]/20">
                        <div className="w-6 h-6 bg-white rounded-full opacity-80" />
                    </div>
                    <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
