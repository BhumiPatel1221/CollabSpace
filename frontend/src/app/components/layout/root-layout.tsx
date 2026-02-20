import * as React from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { LogOut, LayoutDashboard, Settings, FileText, Share2, Bell, Menu, Sun, Moon, Check, ExternalLink, X } from "lucide-react";
import { cn, Avatar, Badge } from "../ui-components";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Logo } from "../Logo";
import { Navbar } from "../Navbar";
import { useNotifications } from "../../hooks/useNotifications";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Auth — may be null on public pages (landing/login)
  let currentUser = null;
  let logout = async () => { };
  try {
    const auth = useAuth();
    currentUser = auth.currentUser;
    logout = auth.logout;
  } catch {
    // useAuth throws if outside AuthProvider — won't happen since we wrap in App,
    // but this is a safety net.
  }

  // Notifications
  let notifications: any[] = [];
  let unreadCount = 0;
  let markAsRead = async (_id: string) => { };
  let markAllAsRead = async () => { };
  try {
    const notifHook = useNotifications();
    notifications = notifHook.notifications;
    unreadCount = notifHook.unreadCount;
    markAsRead = notifHook.markAsRead;
    markAllAsRead = notifHook.markAllAsRead;
  } catch {
    // Safety net
  }

  const isLanding = location.pathname === "/";
  const isLogin = location.pathname === "/login";
  const isDashboard = location.pathname === "/dashboard";
  const isEditor = location.pathname.startsWith("/editor/");

  // Close notification panel on click outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

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

  function getInitials(name: string | null | undefined): string {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  function formatNotifTime(timestamp: any): string {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Landing page & Login page — use the public Navbar component
  if (isLanding || isLogin) {
    return (
      <div className={cn("min-h-screen aurora-bg grain-texture", isDarkMode && "dark")}>
        {!isLogin && (
          <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        )}
        <Outlet />
      </div>
    );
  }

  // Dashboard & Editor — Floating Modular Layout
  return (
    <div className={cn("flex flex-col h-screen aurora-bg grain-texture overflow-hidden", isDarkMode && "dark")}>
      {/* ──── Floating Top Nav Bar ──── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1 z-30">
        <header className="glass-panel rounded-[18px] h-14 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle / menu */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[rgba(139,92,246,0.08)] rounded-[10px] transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-[#6B7280]" />
            </button>
            <Logo height={28} linkTo="/dashboard" />
          </div>

          {/* Center: Workspace Switcher */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-1 glass-panel rounded-[12px] px-1 py-0.5">
              <NavTab to="/dashboard?tab=my-documents" active={isDashboard && (location.search === "" || location.search.includes("my-documents"))} icon={FileText} label="Documents" />
              <NavTab to="/dashboard?tab=shared-with-me" active={location.search.includes("shared-with-me")} icon={Share2} label="Shared" />
              <NavTab to="/dashboard?tab=settings" active={location.search.includes("settings")} icon={Settings} label="Settings" />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 hover:bg-[rgba(139,92,246,0.08)] rounded-[10px] transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#6B7280]" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-[rgba(139,92,246,0.08)] rounded-[10px] relative transition-colors"
              >
                <Bell className="w-4 h-4 text-[#6B7280]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-[#0F0D1F]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-96 max-h-[480px] glass-panel-strong rounded-[18px] overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(139,92,246,0.1)]">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Notifications</h3>
                        {unreadCount > 0 && (
                          <Badge variant="default">{unreadCount} new</Badge>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs font-medium text-[#6366F1] dark:text-[#C4B5FD] hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[380px] overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <Bell className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">No notifications yet</p>
                          <p className="text-xs text-[#9CA3AF] mt-1">You'll be notified when someone shares a document with you</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              if (notif.documentId) {
                                navigate(`/editor/${notif.documentId}`);
                                setShowNotifications(false);
                              }
                            }}
                            className={cn(
                              "w-full text-left px-5 py-4 border-b border-[rgba(139,92,246,0.06)] last:border-b-0 hover:bg-[rgba(139,92,246,0.04)] transition-colors flex gap-3",
                              !notif.read && "bg-[rgba(99,102,241,0.05)]"
                            )}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center",
                                notif.type === "share"
                                  ? "bg-[rgba(99,102,241,0.1)] text-[#6366F1]"
                                  : "bg-[rgba(110,231,183,0.12)] text-[#059669] dark:text-[#6EE7B7]"
                              )}>
                                {notif.type === "share" ? <Share2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-sm line-clamp-1",
                                  !notif.read ? "font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" : "font-medium text-[#6B7280] dark:text-[#9CA3AF]"
                                )}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-[#6366F1] rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 line-clamp-2">{notif.message}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-[#9CA3AF]">{formatNotifTime(notif.createdAt)}</span>
                                {notif.documentId && (
                                  <span className="text-[10px] text-[#6366F1] dark:text-[#C4B5FD] flex items-center gap-0.5">
                                    <ExternalLink className="w-2.5 h-2.5" /> Open
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar + logout */}
            <div className="flex items-center gap-2 ml-1">
              <Avatar
                fallback={getInitials(displayName)}
                src={currentUser?.photoURL || undefined}
                size="sm"
              />
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-[rgba(239,68,68,0.08)] text-[#6B7280] hover:text-[#EF4444] rounded-[10px] transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* ──── Floating sidebar (icons-only) + Main Content ──── */}
      <div className="flex-1 flex overflow-hidden px-4 pb-3 gap-3">
        {/* Left: Collapsible floating mini-panel (icons only on desktop) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 60 }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="hidden md:flex flex-shrink-0 flex-col items-center py-3 gap-2 glass-panel rounded-[18px] overflow-hidden"
            >
              <SidebarIcon icon={LayoutDashboard} to="/dashboard" active={isDashboard && !location.search.includes("settings")} tooltip="Dashboard" />
              <SidebarIcon icon={FileText} to="/dashboard?tab=my-documents" active={isDashboard && (location.search === "" || location.search.includes("my-documents"))} tooltip="My Docs" />
              <SidebarIcon icon={Share2} to="/dashboard?tab=shared-with-me" active={location.search.includes("shared-with-me")} tooltip="Shared" />
              <div className="flex-1" />
              <SidebarIcon icon={Settings} to="/dashboard?tab=settings" active={location.search.includes("settings")} tooltip="Settings" />

              {/* Mini user avatar at bottom */}
              <div className="pt-2 pb-1 border-t border-[rgba(139,92,246,0.1)]">
                <Avatar
                  fallback={getInitials(displayName)}
                  src={currentUser?.photoURL || undefined}
                  size="sm"
                  online
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="flex-1 overflow-auto rounded-[18px] glass-panel">
          <Outlet />
        </main>
      </div>

      {/* ──── Bottom Activity Bar ──── */}
      <div className="flex-shrink-0 px-4 pb-3 md:block hidden">
        <div className="glass-panel rounded-[14px] h-9 flex items-center justify-between px-5">
          <div className="flex items-center gap-4 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
              Connected
            </span>
            <span>CollabSpace v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
            <span>{displayName}</span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7]" />
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mini icon sidebar button ─── */
function SidebarIcon({ icon: Icon, to, active, tooltip }: { icon: any; to: string; active?: boolean; tooltip: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "relative group w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-200",
        active
          ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25"
          : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[rgba(139,92,246,0.08)] hover:text-[#6366F1] dark:hover:text-[#C4B5FD]"
      )}
    >
      <Icon className="w-5 h-5" />
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1E1B4B] dark:bg-[#E8E6F0] text-white dark:text-[#1E1B4B] text-[11px] font-medium rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </Link>
  );
}

/* ─── Center nav tab ─── */
function NavTab({ to, active, icon: Icon, label }: { to: string; active?: boolean; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm"
          : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#6366F1] dark:hover:text-[#C4B5FD] hover:bg-[rgba(139,92,246,0.06)]"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}
