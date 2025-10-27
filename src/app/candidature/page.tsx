"use client";

import React, { useState } from "react";

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
    const [form, setForm] = useState<CandidateForm>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        linkedIn: "",
        availability: "",
        specialty: "",
        coverLetter: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [step, setStep] = useState(0);

    function updateField(name: keyof CandidateForm, value: string) {
        setForm((s) => ({ ...s, [name]: value }));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        setFile(f);
    }

    function humanFileSize(bytes: number) {
        return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
    }

    async function onSubmit() {
        setError(null);
        if (!form.firstName || !form.email) {
            setError("Le prénom et l'email sont requis");
            setStep(0);
            return;
        }

        if (file) {
            const allowed = [/\.pdf$/i, /\.docx?$/i];
            if (!allowed.some((r) => r.test(file.name))) {
                setError("CV : formats autorisés PDF / DOC / DOCX");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("CV : taille maximale 5Mo");
                return;
            }
        }

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

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/candidature", {
                method: "POST",
                body: data,
            });
            const json = await res.json();
            if (res.ok) {
                setFile(null);
                setPreviewUrl(null);
                setStep(0);
                alert("Candidature envoyée — merci !");
            } else {
                setError(json?.error || "Erreur serveur");
            }
        } catch (e) {
            console.error(e);
            setError("Erreur réseau");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] p-6">
            <div className="max-w-4xl mx-auto bg-black/50 backdrop-blur rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-[#4fc3f7]">
                        Postuler chez{" "}
                        <span className="text-[#f97316]">Renardis</span>
                    </h1>
                    <div className="text-sm text-[#4fc3f7]/80">
                        Étape {step + 1} / 4
                    </div>
                </div>

                <div className="w-full h-2 bg-white/5 rounded-full mb-6">
                    <div
                        className={`h-2 rounded-full bg-gradient-to-r from-[#4fc3f7] to-[#f97316]`}
                        style={{ width: `${((step + 1) / 4) * 100}%` }}
                    />
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-400">{error}</div>
                )}

                {step === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                Prénom
                            </label>
                            <input
                                name="firstName"
                                value={form.firstName || ""}
                                onChange={(e) =>
                                    updateField("firstName", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                Nom
                            </label>
                            <input
                                name="lastName"
                                value={form.lastName || ""}
                                onChange={(e) =>
                                    updateField("lastName", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email || ""}
                                onChange={(e) =>
                                    updateField("email", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                Téléphone
                            </label>
                            <input
                                name="phone"
                                value={form.phone || ""}
                                onChange={(e) =>
                                    updateField("phone", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                LinkedIn / Portfolio
                            </label>
                            <input
                                name="linkedIn"
                                value={form.linkedIn || ""}
                                onChange={(e) =>
                                    updateField("linkedIn", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[#4fc3f7] mb-1">
                                Disponibilités
                            </label>
                            <input
                                name="availability"
                                value={form.availability || ""}
                                onChange={(e) =>
                                    updateField("availability", e.target.value)
                                }
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                            />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <label className="block text-sm text-[#4fc3f7] mb-2">
                            CV (PDF/DOC/DOCX — max 5MB)
                        </label>
                        <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center bg-white/3">
                            <input
                                id="cv"
                                name="cv"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="cv"
                                className="inline-flex items-center gap-3 px-4 py-2 bg-[#4fc3f7] text-black rounded-md cursor-pointer"
                            >
                                {file
                                    ? "Changer le fichier"
                                    : "Choisir un fichier"}{" "}
                            </label>
                            <div className="mt-3 text-sm text-[#4fc3f7]/80">
                                {file
                                    ? `${file.name} · ${humanFileSize(
                                          file.size
                                      )}`
                                    : "Glisser-déposer votre CV ou cliquez pour sélectionner"}
                            </div>
                            {file && (
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPreviewUrl(
                                                URL.createObjectURL(file)
                                            )
                                        }
                                        className="px-3 py-1 bg-white/10 rounded"
                                    >
                                        Prévisualiser
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="px-3 py-1 border rounded"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <label className="block text-sm text-[#4fc3f7] mb-2">
                            Lettre de motivation
                        </label>
                        <textarea
                            name="coverLetter"
                            value={form.coverLetter || ""}
                            onChange={(e) =>
                                updateField("coverLetter", e.target.value)
                            }
                            rows={8}
                            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-[#4fc3f7]"
                        />
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded">
                                <h4 className="font-semibold text-[#4fc3f7]">
                                    Vos informations
                                </h4>
                                <div className="mt-3 text-sm text-[#4fc3f7]/90 whitespace-pre-line">
                                    <div>
                                        <strong>Prénom:</strong>{" "}
                                        {form.firstName || "—"}
                                    </div>
                                    <div>
                                        <strong>Nom:</strong>{" "}
                                        {form.lastName || "—"}
                                    </div>
                                    <div>
                                        <strong>Email:</strong>{" "}
                                        {form.email || "—"}
                                    </div>
                                    <div>
                                        <strong>Téléphone:</strong>{" "}
                                        {form.phone || "—"}
                                    </div>
                                    <div>
                                        <strong>LinkedIn:</strong>{" "}
                                        {form.linkedIn || "—"}
                                    </div>
                                    <div>
                                        <strong>Disponibilités:</strong>{" "}
                                        {form.availability || "—"}
                                    </div>
                                    <div>
                                        <strong>Spécialité:</strong>{" "}
                                        {form.specialty || "—"}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded">
                                <h4 className="font-semibold text-[#4fc3f7]">
                                    Lettre de motivation & CV
                                </h4>
                                <div className="mt-3 text-sm text-[#4fc3f7]/90 whitespace-pre-wrap">
                                    {form.coverLetter || "—"}
                                </div>
                                <div className="mt-4">
                                    <strong>CV:</strong>
                                    <div className="mt-2">
                                        {file ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPreviewUrl(
                                                            URL.createObjectURL(
                                                                file
                                                            )
                                                        )
                                                    }
                                                    className="px-3 py-1 border rounded"
                                                >
                                                    Prévisualiser
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">
                                                {" "}
                                                Aucun CV
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setStep((s) => Math.max(0, s - 1))
                                }
                                className="px-4 py-2 border rounded"
                            >
                                Retour
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {step < 3 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setStep((s) => Math.min(3, s + 1))
                                }
                                className="px-4 py-2 bg-[#4fc3f7] text-black rounded"
                            >
                                Suivant
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={onSubmit}
                                className="px-4 py-2 bg-[#f97316] text-white rounded"
                            >
                                {isSubmitting
                                    ? "Envoi..."
                                    : "Soumettre ma candidature"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-5xl h-[85vh] bg-white/5 rounded overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/40">
                            <div className="text-sm text-[#4fc3f7]">
                                Prévisualisation CV
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1 border rounded"
                                >
                                    Ouvrir dans un nouvel onglet
                                </a>
                                <button
                                    onClick={() => {
                                        URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                    }}
                                    className="px-3 py-1 bg-white/10 rounded"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                        <iframe src={previewUrl} className="w-full h-full" />
                    </div>
                </div>
            )}
        </div>
    );
}
