"use client";

import React, { useState } from "react";
import computePoW from "@/lib/powClient";
import {
    Mail,
    Phone,
    Users,
    Send,
    Briefcase,
    Sparkles,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
// import { useRouter } from "next/navigation";

export default function ContactPage() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: "",
    });
    const tsRef = React.useRef<number>(Date.now());
    const POW_DIFFICULTY = 6; // must match server strict setting
    const POW_CHALLENGE = "renardis-v1";

    const [powProgress, setPowProgress] = useState<number>(0);
    const [powRunning, setPowRunning] = useState(false);
    const powCancelRef = React.useRef<(() => void) | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function updateField(name: keyof typeof form, value: string) {
        setForm((s) => ({ ...s, [name]: value }));
        setError(null);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Basic validation
        if (!form.fullName || !form.email || !form.message) {
            setError("Nom, email et message requis");
            setIsSubmitting(false);
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setError("Email invalide");
            setIsSubmitting(false);
            return;
        }

        try {
            // enforce minimum submission delay (ms)
            const elapsed = Date.now() - tsRef.current;
            const MIN_MS = 7000;
            if (elapsed < MIN_MS) {
                setError(
                    `Veuillez patienter ${Math.ceil(
                        (MIN_MS - elapsed) / 1000
                    )}s avant d'envoyer.`
                );
                setIsSubmitting(false);
                return;
            }
            // attach anti-bot fields: compute PoW in a worker (non-blocking)
            setPowProgress(0);
            setPowRunning(true);
            const { promise, cancel } = computePoW({
                difficulty: POW_DIFFICULTY,
                challenge: POW_CHALLENGE,
                ts: tsRef.current,
                onProgress: (attempts) => setPowProgress(attempts),
            });
            powCancelRef.current = cancel;
            const pow = await promise;
            powCancelRef.current = null;
            setPowRunning(false);

            if (!pow) {
                setError(
                    "Impossible de générer la preuve de travail (annulé ou échec)"
                );
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...form,
                _hp: "", // honeypot field (should be left empty by real users)
                ts: tsRef.current,
                pow: JSON.stringify(pow),
            };

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setForm({
                        fullName: "",
                        email: "",
                        phone: "",
                        company: "",
                        subject: "",
                        message: "",
                    });
                    setSuccess(false);
                }, 3000);
            } else {
                setError(json?.error || "Erreur lors de l'envoi");
            }
        } catch {
            setError("Erreur de connexion au serveur");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30"></div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-28 left-10 w-72 h-72 bg-[#4aa8e0]/12 rounded-full blur-3xl"></div>
                <div className="absolute bottom-24 right-10 w-72 h-72 bg-[#4aa8e0]/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#4aa8e0]/10 rounded-full border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-[#4aa8e0]" />
                        <span className="text-sm text-[#4aa8e0] font-medium">
                            Contactez Renardis
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-[#4aa8e0]">Nous contacter</span>
                    </h1>
                    <p className="text-[#4aa8e0]/80 text-lg max-w-2xl mx-auto">
                        Une question, un projet, une suggestion ? Écrivez-nous !
                    </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}
                    <form className="p-6 md:p-8 space-y-6" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                <Users className="w-4 h-4" /> Nom complet{" "}
                                <span className="text-[#f97316]">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) =>
                                    updateField("fullName", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                placeholder="Votre nom et prénom"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email{" "}
                                <span className="text-[#f97316]">*</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    updateField("email", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                placeholder="votre.email@exemple.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Téléphone
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) =>
                                    updateField("phone", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                placeholder="+33 6 12 34 56 78"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Société /
                                Organisation
                            </label>
                            <input
                                type="text"
                                value={form.company}
                                onChange={(e) =>
                                    updateField("company", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                placeholder="Nom de votre société ou organisation"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                Sujet
                            </label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) =>
                                    updateField("subject", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                placeholder="Sujet de votre demande"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                Message{" "}
                                <span className="text-[#f97316]">*</span>
                            </label>
                            <textarea
                                value={form.message}
                                onChange={(e) =>
                                    updateField("message", e.target.value)
                                }
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all resize-none"
                                placeholder="Décrivez votre demande ou votre projet..."
                                required
                            />
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="max-w-xs w-full px-8 py-3 rounded-xl bg-[#4aa8e0] text-white font-bold hover:shadow-lg hover:shadow-[#4aa8e0]/30 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> Envoyer le
                                        message
                                    </>
                                )}
                            </button>
                        </div>
                        {powRunning && (
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <div className="text-sm text-[#4aa8e0]">
                                    Calcul de la preuve de travail… tentatives :{" "}
                                    {powProgress}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        powCancelRef.current?.();
                                        setPowRunning(false);
                                    }}
                                    className="px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400"
                                >
                                    Annuler
                                </button>
                            </div>
                        )}
                    </form>
                    {success && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-500/90 border border-green-500/30 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                            <div>
                                <p className="text-base font-semibold text-white">
                                    Message envoyé avec succès !
                                </p>
                                <p className="text-xs text-white/80 mt-1">
                                    Nous vous répondrons très prochainement.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-8 text-center">
                    <p className="text-sm text-[#4aa8e0]/60">
                        Besoin d&apos;aide ? Contactez-nous à{" "}
                        <a
                            href="mailto:contact@renardis.fr"
                            className="text-[#4aa8e0] hover:text-[#f97316] transition-colors underline"
                        >
                            contact@renardis.fr
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
