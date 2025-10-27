"use client";

import { useState, type ChangeEvent } from "react";

type CandidateForm = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    linkedIn?: string;
    availability?: string;
    specialty?: string;
    coverLetter?: string;
};

export default function Candidature() {
    const [step, setStep] = useState<number>(0);
    const [form, setForm] = useState<CandidateForm>({});
    const [file, setFile] = useState<File | null>(null);

    const next = () => setStep((s) => s + 1);
    const prev = () => setStep((s) => Math.max(0, s - 1));

    const handleInput = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target as HTMLInputElement & {
            name: string;
            value: string;
        };
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    const onSubmit = async () => {
        const data = new FormData();
        data.append("firstName", form.firstName || "");
        data.append("lastName", form.lastName || "");
        data.append("email", form.email || "");
        data.append("phone", form.phone || "");
        data.append("linkedIn", form.linkedIn || "");
        data.append("availability", form.availability || "");
        data.append("specialty", form.specialty || "");
        data.append("coverLetter", form.coverLetter || "");
        if (file) data.append("cv", file);

        const res = await fetch("/api/candidature", {
            method: "POST",
            body: data,
        });
        const json = await res.json();
        if (res.ok) alert("Candidature envoyée !");
        else alert("Erreur: " + (json.error || ""));
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">
                Formulaire de candidature
            </h1>
            {step === 0 && (
                <div className="space-y-3">
                    <label className="block">Prénom</label>
                    <input
                        name="firstName"
                        value={form.firstName || ""}
                        onChange={handleInput}
                        className="w-full p-2 border rounded"
                    />
                    <label className="block">Nom</label>
                    <input
                        name="lastName"
                        value={form.lastName || ""}
                        onChange={handleInput}
                        className="w-full p-2 border rounded"
                    />
                    <label className="block">Email</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email || ""}
                        onChange={handleInput}
                        className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            type="button"
                            onClick={next}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}
            {step === 1 && (
                <div className="space-y-3">
                    <label className="block">CV (PDF/DOC max 5MB)</label>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword"
                        onChange={handleFile}
                        className="w-full"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={prev}
                            className="px-4 py-2 border rounded"
                        >
                            Retour
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="space-y-3">
                    <label className="block">Lettre de motivation</label>
                    <textarea
                        name="coverLetter"
                        value={form.coverLetter || ""}
                        onChange={handleInput}
                        className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={prev}
                            className="px-4 py-2 border rounded"
                        >
                            Retour
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Prévisualiser
                        </button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Prévisualisation</h3>
                    <pre className="bg-gray-100 p-3 rounded">
                        {JSON.stringify(
                            { ...form, fileName: file?.name },
                            null,
                            2
                        )}
                    </pre>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={prev}
                            className="px-4 py-2 border rounded"
                        >
                            Retour
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            className="px-4 py-2 bg-green-600 text-white rounded"
                        >
                            Soumettre
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
