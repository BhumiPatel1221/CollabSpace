import * as React from "react";
import {
  Plus, Search, FileText, MoreVertical, Share2, Clock, Users,
  Trash2, Loader2, AlertCircle, FolderOpen, Settings, User, Lock, Mail, Palette, ChevronRight, Sparkles
} from "lucide-react";
import { Button, Input, Badge, Avatar, Modal, cn } from "../components/ui-components";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../contexts/AuthContext";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { updateProfile } from "firebase/auth";

type TabKey = "my-documents" | "shared-with-me" | "settings";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "my-documents", label: "My Documents", icon: FileText },
  { key: "shared-with-me", label: "Shared with Me", icon: Share2 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { documents, ownedDocuments, sharedDocuments, loading, error, createDocument } = useDocuments();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [docTitle, setDocTitle] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Sync tab with URL query params
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = tabParam && TABS.some(t => t.key === tabParam) ? tabParam : "my-documents";

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
    setSearchQuery("");
  };

  // Settings state
  const [settingsName, setSettingsName] = React.useState(currentUser?.displayName || "");
  const [savingSettings, setSavingSettings] = React.useState(false);

  React.useEffect(() => {
    if (currentUser?.displayName) {
      setSettingsName(currentUser.displayName);
    }
  }, [currentUser?.displayName]);

  // Prevent duplicate creations with a ref
  const creatingRef = React.useRef(false);

  const handleQuickCreate = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setIsCreating(true);

    try {
      const newDocId = await createDocument("Untitled Document");
      toast.success("Document created successfully!");
      navigate(`/editor/${newDocId}`);
    } catch (err) {
      console.error("Failed to create document:", err);
      toast.error("Failed to create document. Please try again.");
    } finally {
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || creatingRef.current) return;
    creatingRef.current = true;
    setIsCreating(true);

    try {
      const newDocId = await createDocument(docTitle);
      setIsModalOpen(false);
      setDocTitle("");
      toast.success("Document created successfully!");
      navigate(`/editor/${newDocId}`);
    } catch (err) {
      console.error("Failed to create document:", err);
      toast.error("Failed to create document. Please try again.");
    } finally {
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(doc(db, "documents", docId));
      toast.success("Document deleted.");
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser || !settingsName.trim()) return;
    setSavingSettings(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, { displayName: settingsName.trim() });
      // Update Firestore profile
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: settingsName.trim(),
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile.");
    }
    setSavingSettings(false);
  };

  const getActiveDocuments = (): typeof documents => {
    if (activeTab === "my-documents") return ownedDocuments;
    if (activeTab === "shared-with-me") return sharedDocuments;
    return [];
  };

  const activeDocuments = getActiveDocuments();

  const filteredDocuments = activeDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatTimestamp(timestamp: any): string {
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

  function getCollaboratorInitials(collaborators: Record<string, any>): string[] {
    return Object.values(collaborators || {}).map((c: any) => {
      const name = c.displayName || c.email || "?";
      return name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    });
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-[#EF4444]" />
          <p className="text-[#EF4444] font-bold text-lg">{error}</p>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B4B] dark:text-[#E8E6F0] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Welcome back, <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px]">
            {documents.length === 0
              ? "Create your first document to get started."
              : `You have ${documents.length} document${documents.length > 1 ? "s" : ""} across your workspace.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleQuickCreate}
            isLoading={isCreating && !isModalOpen}
            className="h-11 px-5 font-bold"
          >
            <Plus className="mr-2 w-4 h-4" /> New Document
          </Button>
          <Button
            variant="glass"
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-3 font-bold"
            title="Create with custom title"
          >
            <FileText className="w-5 h-5" />
          </Button>
        </div>
      </div>



      {/* Settings Tab */}
      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className="glass-panel rounded-[20px] overflow-hidden glow-border">
            {/* Profile Section */}
            <div className="p-8 border-b border-[rgba(139,92,246,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-[12px] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Profile Settings</h2>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Manage your account information</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <Avatar
                    fallback={displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                    src={currentUser?.photoURL || undefined}
                    size="lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#6EE7B7] rounded-full border-2 border-white dark:border-[#1E1B4B] shadow-lg shadow-[#6EE7B7]/30" />
                </div>
                <div>
                  <p className="font-bold text-[#1E1B4B] dark:text-[#E8E6F0] text-lg">{displayName}</p>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{currentUser?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Display Name</label>
                  <Input
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Your display name"
                    className="max-w-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] glass-panel max-w-sm">
                    <Mail className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{currentUser?.email}</span>
                    <Lock className="w-3 h-3 text-[#9CA3AF] ml-auto" />
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">Email cannot be changed</p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    isLoading={savingSettings}
                    disabled={settingsName.trim() === (currentUser?.displayName || "")}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#6EE7B7] to-[#34D399] rounded-[12px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Workspace Stats</h2>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Overview of your workspace activity</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-[16px] p-5 glow-border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[#6366F1]" />
                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">My Documents</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{ownedDocuments.length}</p>
                </div>

                <div className="glass-panel rounded-[16px] p-5 glow-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-[#6EE7B7]" />
                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Shared with Me</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{sharedDocuments.length}</p>
                </div>

                <div className="glass-panel rounded-[16px] p-5 glow-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#FB7185]" />
                    <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{documents.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Document List Tabs */}
      {activeTab !== "settings" && (
        <>
          {/* Search bar */}
          {activeDocuments.length > 0 && (
            <div className="relative max-w-md mb-8">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                className="pl-10 h-10"
                placeholder={`Search ${activeTab === "my-documents" ? "your" : "shared"} documents...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Empty state */}
          {activeDocuments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-[#6366F1]/20">
                {activeTab === "my-documents" ? (
                  <FolderOpen className="w-10 h-10 text-white" />
                ) : (
                  <Share2 className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {activeTab === "my-documents" ? "No documents yet" : "No shared documents"}
              </h2>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-8 max-w-md">
                {activeTab === "my-documents"
                  ? "Start by creating your first document. You can collaborate with others in real-time."
                  : "When someone shares a document with you, it will appear here."}
              </p>
              {activeTab === "my-documents" && (
                <Button
                  onClick={handleQuickCreate}
                  isLoading={isCreating}
                  className="h-12 px-8 font-bold"
                >
                  <Plus className="mr-2 w-5 h-5" /> Create Your First Document
                </Button>
              )}
            </motion.div>
          )}

          {/* Documents Grid — Floating Glass Cards */}
          {filteredDocuments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((docItem, idx) => {
                const isOwner = docItem.ownerId === currentUser?.uid;
                const collabInitials = getCollaboratorInitials(docItem.collaborators);

                return (
                  <motion.div
                    key={docItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/editor/${docItem.id}`)}
                    className="group cursor-pointer glass-panel rounded-[20px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glow-border"
                  >
                    {/* Hover decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6366F1]/5 to-[#8B5CF6]/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-11 h-11 bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10 rounded-[12px] flex items-center justify-center text-[#6366F1] group-hover:from-[#6366F1] group-hover:to-[#8B5CF6] group-hover:text-white transition-all duration-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOwner && (
                          <button
                            onClick={(e) => handleDeleteDocument(e, docItem.id)}
                            className="p-2 hover:bg-[rgba(239,68,68,0.08)] rounded-[10px] text-[#6B7280] hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 hover:bg-[rgba(139,92,246,0.06)] rounded-[10px] text-[#6B7280]">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#1E1B4B] dark:text-[#E8E6F0] mb-1 group-hover:text-[#6366F1] dark:group-hover:text-[#C4B5FD] transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>{docItem.title}</h3>

                    <div className="flex items-center gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(docItem.updatedAt)}
                      </div>
                      <Badge variant={isOwner ? "success" : "default"}>
                        {isOwner ? "Owner" : docItem.ownerName || "Shared"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(139,92,246,0.08)]">
                      <div className="flex -space-x-2">
                        {collabInitials.slice(0, 3).map((initials, i) => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-white/50 dark:border-[#1E1B4B]/50 bg-gradient-to-br from-[#C4B5FD] to-[#818CF8] flex items-center justify-center text-[10px] font-bold text-white">
                            {initials}
                          </div>
                        ))}
                        {collabInitials.length > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white/50 dark:border-[#1E1B4B]/50 bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[10px] font-bold text-[#6366F1]">
                            +{collabInitials.length - 3}
                          </div>
                        )}
                        {collabInitials.length === 0 && (
                          <div className="text-xs text-[#9CA3AF] italic">No collaborators</div>
                        )}
                      </div>
                      <button className="text-xs font-bold text-[#6366F1] dark:text-[#C4B5FD] hover:underline flex items-center gap-1">
                        Open <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* No search results */}
          {activeDocuments.length > 0 && filteredDocuments.length === 0 && searchQuery && (
            <div className="text-center py-20">
              <Search className="w-10 h-10 text-[#9CA3AF] mx-auto mb-4" />
              <p className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">No documents match "{searchQuery}"</p>
            </div>
          )}
        </>
      )}

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-8 right-8 md:hidden">
        <button
          onClick={handleQuickCreate}
          disabled={isCreating}
          className="w-14 h-14 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-[18px] shadow-2xl shadow-[#6366F1]/30 flex items-center justify-center disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <Plus className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Create Modal (Custom Title) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Document">
        <form onSubmit={handleCreateDocument} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Document Title</label>
            <Input
              autoFocus
              placeholder="e.g. Marketing Strategy 2026"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
