"use client";
import React, { useState } from "react";

export default function CodeEntryForm({ id }: { id: string }) {
    const [inputCode, setInputCode] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCode.trim()) {
            setError("Veuillez entrer un code d'accès.");
            return;
        }
        window.location.href = `/candidature/${id}?code=${encodeURIComponent(
            inputCode.trim()
        )}`;
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col items-center gap-2"
        >
            <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                    setInputCode(e.target.value);
                    setError("");
                }}
                placeholder="Entrez le code d'accès"
                className="px-4 py-2 rounded-lg border border-[#4aa8e0]/30 bg-white/10 text-[#4aa8e0] focus:outline-none focus:ring-2 focus:ring-[#4aa8e0]"
            />
            <button
                type="submit"
                className="mt-2 px-6 py-2 rounded-lg bg-[#4aa8e0] text-white font-bold shadow-md border border-[#4aa8e0]/40 hover:bg-[#256fa1] hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[#4aa8e0]"
            >
                Accéder à la fiche
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>
    );
}
