import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Sun, Moon, LogOut } from "lucide-react";
import { Button, Avatar, cn } from "./ui-components";
import { Logo } from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface NavbarProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

/**
 * Floating glass Navbar — appears on the Landing page.
 * Premium glassmorphic with rounded floating design.
 */
export function Navbar({ isDarkMode, onToggleDarkMode }: NavbarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const isLogin = location.pathname === "/login";
    const [scrolled, setScrolled] = React.useState(false);

    // Auth — may be null on public pages
    let currentUser = null;
    let logout = async () => { };
    try {
        const auth = useAuth();
        currentUser = auth.currentUser;
        logout = auth.logout;
    } catch {
        // safety net
    }

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully.");
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Failed to log out.");
        }
    };

    // Don't render navbar on the login page
    if (isLogin) return null;

    return (
        <nav className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
            scrolled ? "w-[92%] max-w-5xl" : "w-[95%] max-w-6xl"
        )}>
            <div className={cn(
                "glass-panel rounded-[20px] px-5 h-14 flex items-center justify-between transition-all duration-500",
                scrolled && "shadow-lg"
            )}>
                {/* Logo */}
                <Logo height={32} linkTo={currentUser ? "/dashboard" : "/"} />

                {/* Center links */}
                <div className="hidden md:flex items-center gap-1">
                    {[
                        { href: "#features", label: "Features" },
                        { href: "#how-it-works", label: "How it Works" },
                    ].map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="px-3 py-1.5 text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#6366F1] dark:hover:text-[#C4B5FD] hover:bg-[rgba(139,92,246,0.06)] rounded-[10px] transition-all duration-200"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2 hover:bg-[rgba(139,92,246,0.08)] rounded-[10px] transition-all duration-200"
                        aria-label="Toggle dark mode"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#6B7280]" />}
                    </button>

                    {currentUser ? (
                        <>
                            <Link to="/dashboard">
                                <Button size="sm" className="text-sm">Dashboard</Button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-[rgba(239,68,68,0.08)] text-[#6B7280] hover:text-[#EF4444] rounded-[10px] transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="hidden md:flex text-sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="sm" className="text-sm">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
