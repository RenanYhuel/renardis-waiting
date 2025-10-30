"use client";

import React, { useState } from "react";

type CandidateRow = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialty: string;
    accessCode: string;
};

export default function CandidaturesPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [codeInput, setCodeInput] = useState("");
    const [candidates, setCandidates] = useState<CandidateRow[] | null>(null);

    async function requestAccess() {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/candidatures/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const json = await res.json();
            if (res.ok) {
                setMessage(
                    "Code demandé. Vérifie Telegram (ou les logs). Il sera valide 15 minutes."
                );
            } else {
                setMessage(json?.error || "Erreur lors de la demande");
            }
        } catch (error) {
            console.error("requestAccess error", error);
            setMessage("Erreur réseau lors de la demande");
        } finally {
            setLoading(false);
        }
    }

    async function validateCode() {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/candidatures/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: codeInput }),
            });
            const json = await res.json();
            if (res.ok && json?.success) {
                setCandidates(json.candidates);
                setMessage(null);
            } else {
                setMessage(json?.error || "Code invalide");
            }
        } catch (error) {
            console.error("validateCode error", error);
            setMessage("Erreur réseau lors de la validation");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] p-8">
            <div className="max-w-6xl mx-auto bg-white/5 rounded-2xl border border-white/10 p-6">
                <h1 className="text-3xl font-bold text-[#4aa8e0] mb-4">
                    Panel recruteur
                </h1>
                <p className="text-sm text-[#4aa8e0]/80 mb-6">
                    Demande un code d&apos;accès temporaire (valide 15 minutes)
                    ou saisis un code reçu pour accéder au tableau des
                    candidatures.
                </p>

                <div className="flex gap-4 mb-4">
                    <button
                        disabled={loading}
                        onClick={requestAccess}
                        className="px-4 py-2 bg-[#4aa8e0] rounded-lg text-white"
                    >
                        Demander un code
                    </button>
                    <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Saisir le code"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#4aa8e0]"
                    />
                    <button
                        disabled={loading}
                        onClick={validateCode}
                        className="px-4 py-2 bg-[#f97316] rounded-lg text-white"
                    >
                        Valider le code
                    </button>
                </div>

                {message && (
                    <div className="mb-4 text-sm text-[#4aa8e0]/90">
                        {message}
                    </div>
                )}

                {candidates ? (
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-[#4aa8e0]/80">
                                    <th className="py-2 px-3">Nom</th>
                                    <th className="py-2 px-3">Email</th>
                                    <th className="py-2 px-3">Spécialité</th>
                                    <th className="py-2 px-3">
                                        Code d&apos;accès
                                    </th>
                                    <th className="py-2 px-3">Lien</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-t border-white/5"
                                    >
                                        <td className="py-2 px-3">
                                            {c.firstName} {c.lastName}
                                        </td>
                                        <td className="py-2 px-3">{c.email}</td>
                                        <td className="py-2 px-3">
                                            {c.specialty || "-"}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-sm">
                                            {c.accessCode}
                                        </td>
                                        <td className="py-2 px-3">
                                            <a
                                                className="text-[#4aa8e0] underline"
                                                href={`/candidature/${c.id}?code=${c.accessCode}`}
                                            >
                                                Voir
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="mt-6 text-sm text-[#4aa8e0]/80">
                        Le tableau s&apos;affichera ici après validation
                        d&apos;un code.
                    </div>
                )}
            </div>
        </div>
    );
}
