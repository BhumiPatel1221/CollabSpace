import * as React from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ChevronLeft, Share2, History, Plus, Check, MoreVertical, Search,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Link as LinkIcon, Trash2, UserPlus, Clock, Save, Loader2, AlertCircle, Lock, Eye
} from "lucide-react";
import { Button, Avatar, Badge, Input, Modal, cn } from "../components/ui-components";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useDocument } from "../hooks/useDocument";
import { usePresence } from "../hooks/usePresence";
import { useAuth } from "../contexts/AuthContext";
import { addCollaborator, removeCollaborator, updateCollaboratorRole } from "../services/sharing";

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    document: doc,
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
  } = useDocument(id);
  const { onlineUsers } = usePresence(id);

  const [showHistory, setShowHistory] = React.useState(false);
  const [showShare, setShowShare] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState("");
  const [shareRole, setShareRole] = React.useState<"editor" | "viewer">("editor");
  const [isSharing, setIsSharing] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editableTitle, setEditableTitle] = React.useState("");

  // Rich text editor state
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set());
  const isInternalUpdate = React.useRef(false);

  // Fetch versions when panel opens
  React.useEffect(() => {
    if (showHistory) {
      fetchVersions();
    }
  }, [showHistory, fetchVersions]);

  // Sync editable title
  React.useEffect(() => {
    if (doc) {
      setEditableTitle(doc.title);
    }
  }, [doc?.title]);

  // Set initial content in the contentEditable div
  React.useEffect(() => {
    if (doc && editorRef.current && !isInternalUpdate.current) {
      // Only set innerHTML if it differs from the doc content
      if (editorRef.current.innerHTML !== doc.content) {
        editorRef.current.innerHTML = doc.content || "";
      }
    }
    isInternalUpdate.current = false;
  }, [doc?.content]);

  // Track active formatting on selection change
  React.useEffect(() => {
    const checkFormats = () => {
      const formats = new Set<string>();
      if (document.queryCommandState("bold")) formats.add("bold");
      if (document.queryCommandState("italic")) formats.add("italic");
      if (document.queryCommandState("underline")) formats.add("underline");
      if (document.queryCommandState("insertUnorderedList")) formats.add("insertUnorderedList");
      if (document.queryCommandState("insertOrderedList")) formats.add("insertOrderedList");
      if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
      if (document.queryCommandState("justifyCenter")) formats.add("justifyCenter");
      if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
      setActiveFormats(formats);
    };

    document.addEventListener("selectionchange", checkFormats);
    return () => document.removeEventListener("selectionchange", checkFormats);
  }, []);

  const execCommand = (command: string, value?: string) => {
    if (!canEdit) return;
    document.execCommand(command, false, value);
    // Focus back to editor
    editorRef.current?.focus();
    // Update active formats
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("insertUnorderedList")) formats.add("insertUnorderedList");
    if (document.queryCommandState("insertOrderedList")) formats.add("insertOrderedList");
    if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
    if (document.queryCommandState("justifyCenter")) formats.add("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
    setActiveFormats(formats);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      updateContent(editorRef.current.innerHTML);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!canEdit) return;
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
      }
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editableTitle.trim() && editableTitle !== doc?.title) {
      updateTitle(editableTitle.trim());
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !shareEmail.trim()) return;

    // Prevent sharing with yourself
    if (shareEmail.toLowerCase().trim() === currentUser?.email?.toLowerCase()) {
      toast.error("You can't add yourself as a collaborator.");
      return;
    }

    setIsSharing(true);
    const result = await addCollaborator(
      id,
      shareEmail,
      shareRole,
      currentUser?.displayName || currentUser?.email?.split("@")[0] || "User",
      currentUser?.uid
    );
    setIsSharing(false);

    if (result.success) {
      toast.success(result.message);
      setShareEmail("");
    } else {
      toast.error(result.message);
    }
  };

  const handleRemoveCollaborator = async (uid: string) => {
    if (!id) return;
    try {
      await removeCollaborator(id, uid);
      toast.success("Collaborator removed.");
    } catch {
      toast.error("Failed to remove collaborator.");
    }
  };

  const handleRoleChange = async (uid: string, newRole: "editor" | "viewer") => {
    if (!id) return;
    try {
      await updateCollaboratorRole(id, uid, newRole);
      toast.success("Role updated.");
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await restoreVersion(versionId);
      toast.success("Version restored successfully!");
    } catch {
      toast.error("Failed to restore version.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !doc) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-[#EF4444]" />
          <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{error || "Document not found"}</h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">This document may have been deleted or you don't have access.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // No access state
  if (!userRole) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Lock className="w-10 h-10 text-[#FBBF24]" />
          <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Access Denied</h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">You don't have permission to view this document.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const collaboratorsList = Object.entries(doc.collaborators || {}).map(([uid, data]: [string, any]) => ({
    uid,
    ...data,
  }));

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="h-full flex flex-col">
      {/* Editor Top Bar — Glass */}
      <div className="h-14 flex-shrink-0 border-b border-[rgba(139,92,246,0.08)] glass-panel px-4 flex items-center justify-between z-30 rounded-t-[18px]">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-[rgba(139,92,246,0.08)] rounded-[10px] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
          </Link>
          <div className="flex flex-col">
            {isEditingTitle ? (
              <input
                autoFocus
                className="text-lg font-bold text-[#1E1B4B] dark:text-[#E8E6F0] bg-transparent border-b-2 border-[#8B5CF6] outline-none py-0.5"
                style={{ fontFamily: 'var(--font-heading)' }}
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              />
            ) : (
              <h2
                className="text-lg font-bold text-[#1E1B4B] dark:text-[#E8E6F0] line-clamp-1 cursor-pointer hover:text-[#6366F1] dark:hover:text-[#C4B5FD] transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
                onClick={() => canEdit && setIsEditingTitle(true)}
                title={canEdit ? "Click to rename" : doc.title}
              >
                {doc.title}
              </h2>
            )}
            <div className="flex items-center gap-2 text-xs">
              {saving ? (
                <span className="flex items-center gap-1 text-[#8B5CF6] animate-pulse">
                  <Save className="w-3 h-3" /> Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#6EE7B7]">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              {!canEdit && (
                <Badge variant="warning">
                  <Eye className="w-3 h-3 mr-1" /> View Only
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Presence UI */}
          <div className="hidden md:flex items-center gap-2 mr-2 pr-3 border-r border-[rgba(139,92,246,0.1)]">
            <div className="flex -space-x-2">
              {onlineUsers.map((user, i) => (
                <div key={user.uid} className="group relative">
                  <Avatar
                    fallback={getInitials(user.displayName)}
                    src={user.photoURL || undefined}
                    size="sm"
                    online
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1E1B4B] text-white text-[10px] rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {user.displayName} {user.uid === currentUser?.uid ? "(You)" : ""}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] ml-1">
              {onlineUsers.length} online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" onClick={() => setShowHistory(!showHistory)} className={cn(showHistory && "bg-[rgba(139,92,246,0.1)]")}>
              <History className="w-4 h-4 mr-1.5" /> History
            </Button>
            {(userRole === "owner") && (
              <Button size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
            )}
            <Avatar
              fallback={getInitials(displayName)}
              src={currentUser?.photoURL || undefined}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto p-4 md:p-10 pb-32">
          {/* Formatting Toolbar — Floating Glass */}
          <div className="max-w-4xl mx-auto mb-6 glass-panel rounded-[16px] p-2 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-0.5">
              <ToolbarButton icon={Bold} disabled={!canEdit} active={activeFormats.has("bold")} onClick={() => execCommand("bold")} title="Bold (Ctrl+B)" />
              <ToolbarButton icon={Italic} disabled={!canEdit} active={activeFormats.has("italic")} onClick={() => execCommand("italic")} title="Italic (Ctrl+I)" />
              <ToolbarButton icon={Underline} disabled={!canEdit} active={activeFormats.has("underline")} onClick={() => execCommand("underline")} title="Underline (Ctrl+U)" />
              <div className="w-px h-6 bg-[rgba(139,92,246,0.1)] mx-1" />
              <ToolbarButton icon={List} disabled={!canEdit} active={activeFormats.has("insertUnorderedList")} onClick={() => execCommand("insertUnorderedList")} title="Bullet List" />
              <ToolbarButton icon={ListOrdered} disabled={!canEdit} active={activeFormats.has("insertOrderedList")} onClick={() => execCommand("insertOrderedList")} title="Numbered List" />
              <div className="w-px h-6 bg-[rgba(139,92,246,0.1)] mx-1" />
              <ToolbarButton icon={AlignLeft} disabled={!canEdit} active={activeFormats.has("justifyLeft")} onClick={() => execCommand("justifyLeft")} title="Align Left" />
              <ToolbarButton icon={AlignCenter} disabled={!canEdit} active={activeFormats.has("justifyCenter")} onClick={() => execCommand("justifyCenter")} title="Align Center" />
              <ToolbarButton icon={AlignRight} disabled={!canEdit} active={activeFormats.has("justifyRight")} onClick={() => execCommand("justifyRight")} title="Align Right" />
            </div>
            <div className="flex items-center gap-0.5">
              <ToolbarButton icon={LinkIcon} disabled={!canEdit} onClick={() => {
                const url = prompt("Enter URL:");
                if (url) execCommand("createLink", url);
              }} title="Insert Link" />
              <ToolbarButton icon={ImageIcon} disabled={!canEdit} onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) execCommand("insertImage", url);
              }} title="Insert Image" />
            </div>
          </div>

          {/* Writing Area — contentEditable rich text */}
          <div className="max-w-4xl mx-auto glass-panel-strong min-h-[1000px] rounded-[18px] p-10 md:p-12 relative group glow-border">
            {/* Online users cursors (decorative for non-current users) */}
            {onlineUsers
              .filter((u) => u.uid !== currentUser?.uid)
              .slice(0, 1)
              .map((user) => (
                <motion.div
                  key={user.uid}
                  initial={{ top: "20%", left: "40%" }}
                  animate={{ top: "25%", left: "45%" }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute z-10 pointer-events-none"
                >
                  <div className="w-[2px] h-6 bg-[#34D399]" />
                  <div className="bg-[#34D399] text-white text-[10px] px-2 py-0.5 rounded-md ml-0.5 mt-0.5 font-semibold shadow-lg shadow-[#34D399]/30">
                    {user.displayName}
                  </div>
                </motion.div>
              ))}

            <div
              ref={editorRef}
              contentEditable={canEdit}
              onInput={handleEditorInput}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full min-h-[900px] bg-transparent border-none outline-none text-lg leading-relaxed text-[#1E1B4B] dark:text-[#E8E6F0]",
                "prose dark:prose-invert max-w-none",
                "focus:outline-none",
                "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2",
                "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2",
                "[&_li]:my-1",
                "[&_a]:text-[#818CF8] [&_a]:underline",
                "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4",
                !canEdit && "cursor-default opacity-80"
              )}
              style={{ fontFamily: 'var(--font-body)', minHeight: "900px" }}
              suppressContentEditableWarning
              data-placeholder={canEdit ? "Start typing your document here..." : "This document is read-only."}
            />
          </div>
        </div>

        {/* Version History Side Panel — Glass */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 glass-panel-strong border-l border-[rgba(139,92,246,0.1)] z-40 flex flex-col rounded-r-[18px]"
            >
              <div className="p-6 border-b border-[rgba(139,92,246,0.08)] flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Version History</h3>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-[rgba(139,92,246,0.08)] rounded-full transition-colors">
                  <Plus className="w-5 h-5 text-[#6B7280] rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {versionsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#6366F1]" />
                  </div>
                )}
                {!versionsLoading && versions.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">No version history yet.</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Versions are saved automatically when you edit.</p>
                  </div>
                )}
                {versions.map((v) => {
                  const ts = v.timestamp?.toDate?.();
                  const timeStr = ts
                    ? ts.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                    : "Unknown";

                  return (
                    <div key={v.id} className="p-4 rounded-[14px] glass-panel group glow-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-[#1E1B4B] dark:text-[#E8E6F0]">{timeStr}</p>
                        <Badge variant="default">{v.editorName?.split(" ")[0] || "Unknown"}</Badge>
                      </div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4 line-clamp-2">
                        {v.description || "Auto-saved"}
                      </p>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRestoreVersion(v.id)}
                        >
                          Restore Version
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 border-t border-[rgba(139,92,246,0.08)]">
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] text-center italic">
                  All changes are automatically saved.
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Share Document">
        <form onSubmit={handleShare} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Email Address</label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="colleague@company.com"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
              <select
                className="glass-panel rounded-[14px] px-3 text-sm font-medium text-[#1E1B4B] dark:text-[#E8E6F0] outline-none"
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value as "editor" | "viewer")}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]">Who has access</label>

            {/* Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar fallback={getInitials(doc.ownerName || "O")} size="sm" online={onlineUsers.some(u => u.uid === doc.ownerId)} />
                <div>
                  <p className="text-sm font-bold text-[#1E1B4B] dark:text-[#E8E6F0]">{doc.ownerName || "Owner"}</p>
                  <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Owner</p>
                </div>
              </div>
              <Badge variant="success">Owner</Badge>
            </div>

            {/* Collaborators */}
            {collaboratorsList.map((c) => (
              <div key={c.uid} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar fallback={getInitials(c.displayName || c.email)} size="sm" online={onlineUsers.some(u => u.uid === c.uid)} />
                  <div>
                    <p className="text-sm font-bold text-[#1E1B4B] dark:text-[#E8E6F0]">{c.displayName || c.email}</p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{c.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-transparent border border-[rgba(139,92,246,0.15)] rounded-[10px] px-2 py-1 text-xs font-medium text-[#1E1B4B] dark:text-[#E8E6F0] outline-none"
                    value={c.role}
                    onChange={(e) => handleRoleChange(c.uid, e.target.value as "editor" | "viewer")}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemoveCollaborator(c.uid)}
                    className="p-2 text-[#6B7280] hover:text-[#EF4444] rounded-[10px] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {collaboratorsList.length === 0 && (
              <p className="text-sm text-[#9CA3AF] italic text-center py-4">No collaborators yet. Invite someone above.</p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[rgba(139,92,246,0.08)] gap-3">
            <Button variant="ghost" type="button" onClick={() => setShowShare(false)}>Close</Button>
            <Button type="submit" isLoading={isSharing}>Send Invite</Button>
          </div>
        </form>
      </Modal>

      {/* Mobile Toolbar (Simplified) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel-strong border-t border-[rgba(139,92,246,0.1)] p-2 flex items-center justify-around z-30">
        <ToolbarButton icon={Bold} disabled={!canEdit} active={activeFormats.has("bold")} onClick={() => execCommand("bold")} />
        <ToolbarButton icon={Italic} disabled={!canEdit} active={activeFormats.has("italic")} onClick={() => execCommand("italic")} />
        <ToolbarButton icon={List} disabled={!canEdit} active={activeFormats.has("insertUnorderedList")} onClick={() => execCommand("insertUnorderedList")} />
        <ToolbarButton icon={LinkIcon} disabled={!canEdit} onClick={() => {
          const url = prompt("Enter URL:");
          if (url) execCommand("createLink", url);
        }} />
        <div className="w-px h-8 bg-[rgba(139,92,246,0.1)]" />
        <Button size="icon" className="w-10 h-10 rounded-full" disabled={!canEdit}>
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, disabled, active, onClick, title }: { icon: any; disabled?: boolean; active?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      title={title}
      className={cn(
        "p-2 rounded-[10px] transition-all duration-200 text-[#6B7280] dark:text-[#9CA3AF]",
        active
          ? "bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 text-[#6366F1] dark:text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25"
          : "hover:bg-[rgba(139,92,246,0.06)] hover:text-[#6366F1] dark:hover:text-[#C4B5FD]",
        disabled && "opacity-40 cursor-not-allowed hover:text-[#6B7280] dark:hover:text-[#9CA3AF] hover:bg-transparent dark:hover:bg-transparent"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
