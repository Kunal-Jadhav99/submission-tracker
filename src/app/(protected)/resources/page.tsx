"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Star, Download, Search, Library, ArrowLeft, Upload, Link as LinkIcon, FileText, Image as ImageIcon, Video, File, Loader2, X } from "lucide-react";
import { cn, SUBJECT_COLORS, autoPriority } from "@/lib/utils";
import { toast } from "sonner";
import SubjectHub from "@/components/SubjectHub";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:   <FileText className="w-4 h-4 text-rose-400" />,
  image: <ImageIcon className="w-4 h-4 text-blue-400" />,
  video: <Video className="w-4 h-4 text-amber-400" />,
  link:  <LinkIcon className="w-4 h-4 text-emerald-400" />,
  note:  <FileText className="w-4 h-4 text-violet-400" />,
  other: <File className="w-4 h-4 text-muted-foreground" />,
};

function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", url: "", tags: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch("/api/resources").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
      ]);
      setResources(Array.isArray(r) ? r : []);
      setSubjects(Array.isArray(s) ? s.filter((x: any) => !x.archived) : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subjectId = selectedSubject ?? "";
    if (!subjectId) { toast.error("No subject selected"); return; }

    setUploading(true);
    try {
      if (uploadMode === "file") {
        if (!selectedFile) { toast.error("Select a file"); setUploading(false); return; }
        if (!form.title.trim()) { toast.error("Enter a title"); setUploading(false); return; }

        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("subject", subjectId);
        fd.append("title", form.title.trim());
        fd.append("tags", form.tags);

        const res = await fetch("/api/resources", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error ?? "Upload failed");
        } else {
          toast.success("File uploaded to database ✅");
          closeForm(); load();
        }
      } else {
        // Link
        if (!form.title.trim() || !form.url.trim()) { toast.error("Fill title and URL"); setUploading(false); return; }
        await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: subjectId, title: form.title, url: form.url, type: "link", tags: form.tags }),
        });
        toast.success("Link saved ✅");
        closeForm(); load();
      }
    } catch { toast.error("Error"); }
    setUploading(false);
  }

  async function handleDownload(resource: any) {
    if (resource.type === "link") { window.open(resource.url, "_blank"); return; }
    setDownloading(resource._id);
    try {
      const res = await fetch("/api/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resource._id }),
      });
      const data = await res.json();
      if (!data.fileData) { toast.error("No file data found"); return; }
      const byteStr = atob(data.fileData);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: data.fileMime || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = data.fileName || resource.title;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch { toast.error("Download failed"); }
    setDownloading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete resource?")) return;
    await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  function closeForm() {
    setShowForm(false);
    setSelectedFile(null);
    setForm({ title: "", url: "", tags: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  // Build count map
  const countMap: Record<string, number> = {};
  resources.forEach(r => {
    const sid = r.subject?._id ?? r.subject;
    countMap[sid] = (countMap[sid] || 0) + 1;
  });

  const currentSubject = subjects.find(s => s._id === selectedSubject);
  const subjectColor = currentSubject ? SUBJECT_COLORS[(currentSubject.colorIndex ?? 0) % SUBJECT_COLORS.length] : null;

  const subjectResources = selectedSubject
    ? resources.filter(r => (r.subject?._id ?? r.subject) === selectedSubject)
    : [];

  const filtered = subjectResources.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedSubject && (
            <button onClick={() => setSelectedSubject(null)} className="p-2 glass rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              {selectedSubject ? currentSubject?.name : "Study Resources"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedSubject
                ? `${subjectResources.length} resources · upload files directly`
                : "Select a subject to view its resources"}
            </p>
          </div>
        </div>
        {selectedSubject && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        )}
      </div>

      {/* Subject grid or resource list */}
      {!selectedSubject ? (
        <SubjectHub
          subjects={subjects}
          selected={null}
          onSelect={setSelectedSubject}
          countMap={countMap}
          countLabel="resources"
          loading={loading}
        />
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="input-field pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border border-dashed border-border/50">
              <Library className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No resources yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload First Resource
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(r => (
                <div key={r._id} className={cn("glass p-4 rounded-xl border transition-all card-hover", subjectColor ? subjectColor.border : "border-border/50")}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {TYPE_ICONS[r.type] ?? TYPE_ICONS.other}
                      <h3 className="font-semibold text-sm truncate">{r.title}</h3>
                    </div>
                    <button onClick={() => handleDelete(r._id)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{r.type}</span>
                    {r.fileSize > 0 && (
                      <span className="text-[10px] text-muted-foreground">{formatBytes(r.fileSize)}</span>
                    )}
                    {r.fileName && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{r.fileName}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(r)}
                    disabled={downloading === r._id}
                    className={cn(
                      "w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
                      r.type === "link"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : `${subjectColor?.light ?? "bg-primary/10"} ${subjectColor?.text ?? "text-primary"} border ${subjectColor?.border ?? "border-primary/20"} hover:opacity-80`
                    )}
                  >
                    {downloading === r._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : r.type === "link" ? (
                      <><LinkIcon className="w-3.5 h-3.5" /> Open Link</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Download</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Add Resource</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 bg-secondary/50 rounded-lg p-1 mb-4">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={cn("flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  uploadMode === "file" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={cn("flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  uploadMode === "link" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
              >
                <LinkIcon className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Unit 2 Notes"
                  className="input-field"
                  required
                />
              </div>

              {uploadMode === "file" ? (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">File * (max 5 MB)</label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                      selectedFile ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/30"
                    )}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.txt,.doc,.docx,.ppt,.pptx"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
                          setSelectedFile(f);
                          if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "") }));
                        }
                      }}
                    />
                    {selectedFile ? (
                      <div>
                        <File className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to choose a file</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, Images, Videos, Documents</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">URL *</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={e => setForm({ ...form, url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="input-field"
                    required={uploadMode === "link"}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="notes, unit2, important"
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "Save"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
