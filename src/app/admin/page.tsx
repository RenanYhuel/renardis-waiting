"use client";

import { useEffect, useState, type FormEvent } from "react";

type CandidateSummary = {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    specialty?: string;
    status?: string;
};

export default function AdminPage() {
    const [token, setToken] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<CandidateSummary[]>([]);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (t) setToken(t);
    }, []);

    const fetchCandidates = async () => {
        if (!token) {
            void alert("Connectez-vous");
            return;
        }
        try {
            const res = await fetch("/api/admin/candidates", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (res.ok) setCandidates(json.candidates || []);
            else void alert("Erreur: " + (json.error || ""));
        } catch (err) {
            console.error("fetchCandidates error", err);
            void alert("Erreur réseau lors du chargement des candidatures");
        }
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const username = String(form.get("username") || "");
        const password = String(form.get("password") || "");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const json = await res.json();
            if (res.ok && json.token) {
                localStorage.setItem("admin_token", json.token);
                setToken(json.token);
            } else {
                void alert(
                    "Erreur: " + (json.error || "Identifiants invalides")
                );
            }
        } catch (err) {
            console.error("login error", err);
            void alert("Erreur de connexion");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
            {!token && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Connexion</h2>
                    <form onSubmit={handleLogin} className="space-y-2 max-w-sm">
                        <input
                            name="username"
                            placeholder="Utilisateur"
                            required
                            className="w-full p-2 border rounded"
                        />
                        <input
                            name="password"
                            placeholder="Mot de passe"
                            type="password"
                            required
                            className="w-full p-2 border rounded"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Se connecter
                        </button>
                    </form>
                </div>
            )}

            {token && (
                <div>
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem("admin_token");
                                setToken(null);
                                setCandidates([]);
                            }}
                            className="px-3 py-2 border rounded"
                        >
                            Se déconnecter
                        </button>
                        <button
                            type="button"
                            onClick={fetchCandidates}
                            className="px-3 py-2 bg-blue-600 text-white rounded"
                        >
                            Charger candidatures
                        </button>
                    </div>
                    <div className="mt-4">
                        {candidates.map((c) => (
                            <div key={c.id} className="p-2 border rounded mb-2">
                                <strong>
                                    {c.firstName} {c.lastName}
                                </strong>
                                <div>{c.email}</div>
                                <div>{c.specialty}</div>
                                <div>{c.status}</div>
                            </div>
                        ))}
                        {candidates.length === 0 && (
                            <div className="text-sm text-gray-500">
                                Aucune candidature chargée.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
