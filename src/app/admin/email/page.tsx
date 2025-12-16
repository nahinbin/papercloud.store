"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LoadingPageShell } from "@/components/LoadingSkeletons";
import { useAdminAccess } from "@/hooks/useAdminAccess";

type RecipientMode = "single" | "users" | "all";

interface EmailFormState {
  to: string;
  recipientName: string;
  subject: string;
  previewText: string;
  heading: string;
  intro: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
  footerNote: string;
}

interface EmailStatus {
  type: "success" | "error";
  message: string;
}

interface EmailConfig {
  configured: boolean;
  sender: {
    email: string | null;
    name: string | null;
  };
}

interface RecipientUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
}

interface TemplatePreset {
  id: string;
  label: string;
  description: string;
  values: Pick<
    EmailFormState,
    "subject" | "previewText" | "heading" | "intro" | "message" | "buttonLabel" | "buttonUrl" | "footerNote"
  >;
}

const INITIAL_FORM: EmailFormState = {
  to: "",
  recipientName: "",
  subject: "",
  previewText: "",
  heading: "",
  intro: "",
  message: "",
  buttonLabel: "",
  buttonUrl: "",
  footerNote: "",
};

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "drop",
    label: "Product drop teaser",
    description: "Announce a limited drop with a bold CTA",
    values: {
      subject: "The drop is live now",
      previewText: "Act fast - our newest release is already moving.",
      heading: "Your next favorite drop is here",
      intro: "We kept this one close, but it is finally time.",
      message: "The studio just opened the doors on our latest release.\n\nQuantities are limited and we will not restock once it's gone. Claim your pieces before someone else does.",
      buttonLabel: "Shop the drop",
      buttonUrl: "https://your-site.com/catalogues/new",
      footerNote: "You received this email because you opted into PaperCloud launch updates.",
    },
  },
  {
    id: "update",
    label: "Important account update",
    description: "Share an operational or policy update",
    values: {
      subject: "We made a few updates",
      previewText: "A quick recap of what changed and what to expect next.",
      heading: "Here is what is new at PaperCloud",
      intro: "Transparency matters, so here is the latest.",
      message: "- We refreshed our return window to 30 days.\n- Priority support is now available for wholesale partners.\n\nIf you have any questions, simply reply to this email and we will get back to you within a business day.",
      buttonLabel: "Review updates",
      buttonUrl: "https://your-site.com/account",
      footerNote: "Need help? Reply to this email or chat with us in the dashboard.",
    },
  },
];

function formatParagraphs(input: string) {
  if (!input.trim()) {
    return [<p key="placeholder" className="text-sm text-zinc-400 italic">Your message preview will appear here.</p>];
  }

  return input
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, index) => {
      const lines = paragraph.split("\n");
      return (
        <p key={`${paragraph}-${index}`} className="text-sm text-zinc-700 leading-6">
          {lines.map((line, lineIndex) => (
            <span key={`${line}-${lineIndex}`}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminEmailPage() {
  const { hasAccess, isChecking } = useAdminAccess(["emails.send"]);
  const [form, setForm] = useState<EmailFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("single");
  const [recipients, setRecipients] = useState<RecipientUser[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    recipients: false,
    options: false,
  });

  const configured = config?.configured ?? false;
  const senderEmail = config?.sender.email || "";

  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await fetch("/api/admin/email", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig(null);
      }
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchRecipients = useCallback(async () => {
    try {
      setRecipientsLoading(true);
      const res = await fetch("/api/admin/email/recipients", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.users || []);
      } else {
        setRecipients([]);
      }
    } catch {
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchConfig().catch((error) => console.error("Failed to load email configuration", error));
      fetchRecipients().catch((error) => console.error("Failed to load email recipients", error));
    } else if (hasAccess === false) {
      setConfigLoading(false);
    }
  }, [hasAccess, fetchConfig, fetchRecipients]);


  const handleChange = (field: keyof EmailFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyTemplate = (preset: TemplatePreset) => {
    setForm((prev) => ({
      ...prev,
      subject: preset.values.subject,
      previewText: preset.values.previewText,
      heading: preset.values.heading,
      intro: preset.values.intro,
      message: preset.values.message,
      buttonLabel: preset.values.buttonLabel,
      buttonUrl: preset.values.buttonUrl,
      footerNote: preset.values.footerNote,
    }));
    setStatus(null);
  };

  const handleUseSenderEmail = () => {
    if (senderEmail) {
      setForm((prev) => ({ ...prev, to: senderEmail }));
    }
  };

  const handleReset = () => {
    setForm((prev) => ({ ...INITIAL_FORM, to: prev.to, recipientName: prev.recipientName }));
    setStatus(null);
  };

  const handleRecipientModeChange = (mode: RecipientMode) => {
    setRecipientMode(mode);
    setStatus(null);

    if (mode === "single") {
      setSelectedUserIds([]);
      return;
    }

    if (mode === "users") {
      setSelectedUserIds([]);
      setRecipientSearch("");
      setForm((prev) => ({ ...prev, to: "" }));
    }

    if (mode === "all") {
      setSelectedUserIds([]);
      setRecipientSearch("");
      setForm((prev) => ({ ...prev, to: "" }));
    }
  };

  const handleRecipientSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientSearch(event.target.value);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const exists = prev.includes(userId);
      const next = exists ? prev.filter((id) => id !== userId) : [...prev, userId];

      if (next.length === 1) {
        const user = recipients.find((u) => u.id === next[0]);
        if (user) {
          setForm((prevForm) => ({
            ...prevForm,
            to: user.email,
            recipientName: prevForm.recipientName || user.name || user.username || "",
          }));
        }
      } else {
        setForm((prevForm) => ({ ...prevForm, to: "" }));
      }

      return next;
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSending(true);

    try {
      const trimmedTo = form.to.trim();

      if (recipientMode === "single") {
        if (!trimmedTo || !emailPattern.test(trimmedTo)) {
          throw new Error("Enter a valid recipient email before sending.");
        }
      }

      if (recipientMode === "users" && selectedUserIds.length === 0) {
        throw new Error("Select at least one registered user.");
      }

      const payload: Record<string, unknown> = {
        mode: recipientMode,
        subject: form.subject,
        previewText: form.previewText,
        heading: form.heading,
        intro: form.intro,
        message: form.message,
        buttonLabel: form.buttonLabel,
        buttonUrl: form.buttonUrl,
        footerNote: form.footerNote,
        recipientName: form.recipientName,
      };

      if (recipientMode === "single") {
        payload.to = trimmedTo;
      }

      if (recipientMode === "users") {
        payload.userIds = selectedUserIds;
      }

      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to send email");
      }

      setStatus({
        type: "success",
        message:
          recipientMode === "users" || recipientMode === "all"
            ? "Emails queued via Brevo for your selected recipients."
            : "Email handed off to Brevo. Check the activity log in your Brevo dashboard.",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Unable to send email. Double-check your inputs or try again shortly.",
      });
    } finally {
      setSending(false);
    }
  };

  const previewParagraphs = useMemo(() => formatParagraphs(form.message), [form.message]);
  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter((user) => {
      const label = `${user.name || ""} ${user.username || ""} ${user.email}`.toLowerCase();
      return label.includes(query);
    });
  }, [recipientSearch, recipients]);

  if (isChecking || (hasAccess && configLoading)) {
    return (
      <LoadingPageShell title="Email studio" subtitle="Preparing Brevo controls" widthClassName="max-w-5xl">
        <div className="space-y-4">
          <div className="h-48 rounded-2xl border border-zinc-100 bg-white/60" />
          <div className="h-72 rounded-2xl border border-zinc-100 bg-white/60" />
        </div>
      </LoadingPageShell>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Breadcrumbs className="mb-4" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Email studio</p>
            <h1 className="text-2xl font-semibold text-zinc-900">Send a custom Brevo email</h1>
            <p className="text-sm text-zinc-600 mt-1">Craft transactional or marketing-style updates and send them instantly.</p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {configured ? "Brevo ready" : "Brevo not configured"}
            </span>
            {config?.sender.email && (
              <p className="text-xs text-zinc-500">Sender: {config.sender.name || "PaperCloud"} &lt;{config.sender.email}&gt;</p>
            )}
          </div>
        </div>

        {!configured && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Add <code className="font-mono text-xs">BREVO_API_KEY</code> and <code className="font-mono text-xs">BREVO_SENDER_EMAIL</code> in your environment to enable sending.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-zinc-200 overflow-hidden">
            {/* Gmail-style Compose Window */}
            <div className="bg-white">
              {/* Header Bar */}
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">New Message</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-zinc-200 rounded transition-colors"
                    aria-label="Minimize"
                  >
                    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* From Field - Always Visible */}
              <div className="px-4 py-2 border-b border-zinc-100 flex items-center gap-3">
                <span className="text-sm text-zinc-500 w-16 flex-shrink-0">From</span>
                <span className="text-sm text-zinc-900">
                  {config?.sender.name || "PaperCloud"} &lt;{config?.sender.email || "sender@papercloud.com"}&gt;
                </span>
              </div>

              {/* To Field - Always Visible */}
              <div className="px-4 py-2 border-b border-zinc-100">
                <div className="flex items-start gap-3">
                  <span className="text-sm text-zinc-500 w-16 flex-shrink-0 pt-2">To</span>
                  <div className="flex-1">
                    {recipientMode === "single" ? (
                      <input
                        id="to"
                        type="email"
                        required={recipientMode === "single"}
                        value={form.to}
                        onChange={handleChange("to")}
                        className="w-full text-sm text-zinc-900 bg-transparent border-none outline-none py-1 placeholder:text-zinc-400"
                        placeholder="Recipients"
                      />
                    ) : recipientMode === "users" ? (
                      <div className="space-y-2">
                        {selectedUserIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedUserIds.map((id) => {
                              const user = recipients.find((u) => u.id === id);
                              const label = user?.name || user?.username || user?.email || "User";
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs"
                                >
                                  {label}
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedUser(id)}
                                    className="hover:text-indigo-900"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <input
                          type="text"
                          value={recipientSearch}
                          onChange={handleRecipientSearchChange}
                          onFocus={() => setExpandedSections((prev) => ({ ...prev, recipients: true }))}
                          placeholder="Search recipients..."
                          className="w-full text-sm text-zinc-900 bg-transparent border-none outline-none py-1 placeholder:text-zinc-400"
                        />
                        {(expandedSections.recipients || recipientSearch) && filteredRecipients.length > 0 && (
                          <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg bg-white shadow-lg mt-1">
                            {filteredRecipients.map((user) => {
                              const isChecked = selectedUserIds.includes(user.id);
                              return (
                                <label
                                  key={user.id}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 ${
                                    isChecked ? "bg-indigo-50" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                                    checked={isChecked}
                                    onChange={() => toggleUserSelection(user.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="text-zinc-900 font-medium">{user.name || user.username || user.email}</p>
                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-700 py-1">All users ({recipients.length})</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleRecipientModeChange("single");
                          setExpandedSections((prev) => ({ ...prev, recipients: false }));
                        }}
                        className={`text-xs px-2 py-0.5 rounded ${recipientMode === "single" ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleRecipientModeChange("users");
                          setExpandedSections((prev) => ({ ...prev, recipients: !prev.recipients }));
                        }}
                        className={`text-xs px-2 py-0.5 rounded ${recipientMode === "users" ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleRecipientModeChange("all");
                          setExpandedSections((prev) => ({ ...prev, recipients: false }));
                        }}
                        className={`text-xs px-2 py-0.5 rounded ${recipientMode === "all" ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Field - Always Visible */}
              <div className="px-4 py-2 border-b border-zinc-100 flex items-center gap-3">
                <span className="text-sm text-zinc-500 w-16 flex-shrink-0">Subject</span>
                <input
                  id="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={handleChange("subject")}
                  className="flex-1 text-sm text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-400"
                  placeholder="Subject"
                />
              </div>

              {/* Compose Area - Always Visible */}
              <div className="px-4 py-3 min-h-[400px]">
                <div className="space-y-4">
                  <div>
                    <input
                      id="heading"
                      type="text"
                      value={form.heading}
                      onChange={handleChange("heading")}
                      className="w-full text-lg font-semibold text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-400"
                      placeholder="Heading (optional)"
                    />
                  </div>
                  <div>
                    <textarea
                      id="intro"
                      value={form.intro}
                      onChange={handleChange("intro")}
                      className="w-full text-sm text-zinc-700 bg-transparent border-none outline-none resize-none placeholder:text-zinc-400"
                      rows={1}
                      placeholder="Intro line (optional)"
                    />
                  </div>
                  <div>
                    <textarea
                      id="message"
                      required
                      value={form.message}
                      onChange={handleChange("message")}
                      className="w-full text-sm text-zinc-900 bg-transparent border-none outline-none resize-none min-h-[200px] placeholder:text-zinc-400"
                      placeholder="Compose your message..."
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields - Collapsible */}
              <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50/30">
                  <button
                    type="button"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, options: !prev.options }))}
                    className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                  >
                  <svg className={`w-3 h-3 transition-transform ${expandedSections.options ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Options
                </button>
                {expandedSections.options && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-zinc-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="buttonLabel" className="block text-xs text-zinc-600 mb-1">Button Label</label>
                        <input
                          id="buttonLabel"
                          type="text"
                          value={form.buttonLabel}
                          onChange={handleChange("buttonLabel")}
                          className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="View details"
                        />
                      </div>
                      <div>
                        <label htmlFor="buttonUrl" className="block text-xs text-zinc-600 mb-1">Button URL</label>
                        <input
                          id="buttonUrl"
                          type="url"
                          value={form.buttonUrl}
                          onChange={handleChange("buttonUrl")}
                          className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="footerNote" className="block text-xs text-zinc-600 mb-1">Footer Note</label>
                      <textarea
                        id="footerNote"
                        value={form.footerNote}
                        onChange={handleChange("footerNote")}
                        className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        rows={2}
                        placeholder="Footer text (optional)"
                      />
                    </div>
                    <div>
                      <label htmlFor="recipientName" className="block text-xs text-zinc-600 mb-1">Greeting Name</label>
                      <input
                        id="recipientName"
                        type="text"
                        value={form.recipientName}
                        onChange={handleChange("recipientName")}
                        className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Optional greeting name"
                      />
                    </div>
                    <div>
                      <label htmlFor="previewText" className="block text-xs text-zinc-600 mb-1">Preview Text</label>
                      <input
                        id="previewText"
                        type="text"
                        value={form.previewText}
                        onChange={handleChange("previewText")}
                        className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Inbox preview text"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              {status && (
                <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50">
                  <div className={`text-xs px-3 py-1.5 rounded ${
                    status.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {status.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-zinc-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sending || !configured}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                      configured
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Via Brevo</p>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email Preview</p>
                    <p className="text-xs text-zinc-400 mt-0.5">How it will appear in inbox</p>
                  </div>
                </div>
              </div>
              
              {/* Email Client-like Preview */}
              <div className="bg-zinc-50 p-4">
                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                  {/* Email Header */}
                  <div className="border-b border-zinc-200 px-5 py-3 bg-white">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {config?.sender.name?.[0] || "P"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-zinc-900">
                            {config?.sender.name || "PaperCloud"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            &lt;{config?.sender.email || "sender@papercloud.com"}&gt;
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          To: {recipientMode === "all" 
                            ? "All users" 
                            : recipientMode === "users" && selectedUserIds.length > 0 
                            ? `${selectedUserIds.length} recipients` 
                            : form.to || "No recipient"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                      <div className="text-sm font-semibold text-zinc-900 mb-1">
                        {form.subject || "No subject"}
                      </div>
                      {form.previewText && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {form.previewText}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="px-5 py-6 bg-white">
                    {form.heading && (
                      <h2 className="text-2xl font-bold text-zinc-900 mb-4">{form.heading}</h2>
                    )}
                    {form.recipientName && (
                      <p className="text-sm text-zinc-700 mb-3">Hi {form.recipientName},</p>
                    )}
                    {form.intro && (
                      <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{form.intro}</p>
                    )}
                    <div className="text-sm text-zinc-700 leading-relaxed space-y-3">
                      {previewParagraphs}
                    </div>
                    {form.buttonUrl && (
                      <div className="mt-6">
                        <a
                          href={form.buttonUrl}
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                          {form.buttonLabel || "View details"}
                        </a>
                      </div>
                    )}
                    {form.footerNote && (
                      <div className="mt-8 pt-6 border-t border-zinc-200">
                        <p className="text-xs text-zinc-500 leading-relaxed">{form.footerNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick Templates</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Jump-start your email</p>
                  </div>
                  <button 
                    type="button" 
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors" 
                    onClick={handleReset}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-2">
                {TEMPLATE_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleApplyTemplate(preset)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                  >
                    <p className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-700">{preset.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tips</p>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Double line breaks create separated paragraphs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Keep subject lines under ~60 characters for best display</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Check Brevo activity logs for delivery status</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


