"use client";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function NotesClientCard({
    candidateId,
    accessCode,
    initialNotes,
}: {
    candidateId: string;
    accessCode: string;
    initialNotes: string;
}) {
    const [notes, setNotes] = useState(initialNotes || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        console.log("Sauvegarde: click detected");
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            console.log(
                "Sending PATCH to /api/candidature/" +
                    candidateId +
                    "?code=" +
                    accessCode
            );
            const res = await fetch(
                `/api/candidature/${candidateId}?code=${accessCode}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes }),
                }
            );
            console.log("PATCH response status:", res.status);
            if (!res.ok) {
                const json = await res.json();
                console.log("PATCH error response:", json);
                setError(json?.error || "Erreur lors de la sauvegarde");
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
            }
        } catch (err) {
            console.error("PATCH fetch error:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setSaving(false);
            console.log("Sauvegarde: setSaving(false)");
        }
    };

    return (
        <div className="p-6 rounded-xl bg-white/5 border border-[#4aa8e0]/30 col-span-2">
            <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#4aa8e0]" />
                <h3 className="font-semibold text-[#4aa8e0]">
                    Notes (modifiable)
                </h3>
            </div>
            <textarea
                className="w-full min-h-[80px] p-2 rounded border border-[#4aa8e0]/30 bg-white/10 text-[#4aa8e0]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
            />
            <div className="flex items-center gap-2 mt-2 relative">
                <button
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#4aa8e0] to-[#0074b6] text-white font-semibold shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:from-[#0074b6] hover:to-[#4aa8e0] focus:outline-none focus:ring-2 focus:ring-[#4aa8e0] disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"
                                />
                            </svg>
                            Sauvegarde...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <svg
                                className="h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Sauvegarder
                        </span>
                    )}
                </button>
                {/* Animated toast for feedback */}
                <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 w-max z-10">
                    {success && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 border border-green-300 shadow text-green-700 animate-in fade-in slide-in-from-top-2">
                            <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="font-medium">Sauvegardé !</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 border border-red-300 shadow text-red-700 animate-in fade-in slide-in-from-top-2">
                            <svg
                                className="h-5 w-5 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
