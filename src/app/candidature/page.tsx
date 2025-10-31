"use client";

import React, { useState, useEffect, useCallback } from "react";
import computePoW from "@/lib/powClient";
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    X,
    Eye,
    Download,
    Briefcase,
    GraduationCap,
    Code,
    Palette,
    Server,
    Megaphone,
    Scale,
    Users,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Mail,
    Phone,
    Linkedin,
    Calendar,
    Award,
    Send,
} from "lucide-react";

type CandidateForm = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedIn: string;
    availability: string;
    specialty: string;
    coverLetter: string;
    motivation: string;
    experience: string;
    skills: string[];
};

const specialties = [
    { value: "dev", label: "Développement", icon: Code, color: "#4aa8e0" },
    { value: "design", label: "Design / UX", icon: Palette, color: "#f97316" },
    {
        value: "admin",
        label: "Administration système",
        icon: Server,
        color: "#4aa8e0",
    },
    {
        value: "marketing",
        label: "Communication / Marketing",
        icon: Megaphone,
        color: "#f97316",
    },
    {
        value: "juridique",
        label: "Juridique / Administratif",
        icon: Scale,
        color: "#4aa8e0",
    },
    {
        value: "education",
        label: "Éducation / Pédagogie",
        icon: GraduationCap,
        color: "#f97316",
    },
    { value: "autre", label: "Autre", icon: Briefcase, color: "#4aa8e0" },
];

const availableSkills = [
    "React",
    "Node.js",
    "Python",
    "TypeScript",
    "Docker",
    "Kubernetes",
    "UI/UX Design",
    "Figma",
    "Adobe Suite",
    "Linux",
    "AWS",
    "Azure",
    "Marketing Digital",
    "SEO",
    "Community Management",
    "Rédaction",
    "Gestion de projet",
    "Pédagogie",
    "Animation",
    "Autre",
];

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
        motivation: "",
        experience: "",
        skills: [],
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    // anti-bot: timestamp and POW + honeypot
    const tsRef = React.useRef<number>(Date.now());
    const POW_DIFFICULTY = 6; // must match server strict setting
    const POW_CHALLENGE = "renardis-v1";

    const [powProgress, setPowProgress] = useState<number>(0);
    const [powRunning, setPowRunning] = useState(false);
    const powCancelRef = React.useRef<(() => void) | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [completionScore, setCompletionScore] = useState(0);

    const calculateCompletion = useCallback(() => {
        let score = 0;
        const weights = {
            firstName: 10,
            lastName: 10,
            email: 15,
            phone: 5,
            linkedIn: 5,
            specialty: 15,
            motivation: 15,
            experience: 10,
            skills: 10,
            file: 5,
        } as const;

        if (form.firstName) score += weights.firstName;
        if (form.lastName) score += weights.lastName;
        if (form.email) score += weights.email;
        if (form.phone) score += weights.phone;
        if (form.linkedIn) score += weights.linkedIn;
        if (form.specialty) score += weights.specialty;
        if (form.motivation) score += weights.motivation;
        if (form.experience) score += weights.experience;
        if (form.skills.length > 0) score += weights.skills;
        if (file) score += weights.file;

        setCompletionScore(score);
    }, [form, file]);

    useEffect(() => {
        calculateCompletion();
    }, [calculateCompletion]);

    function updateField(name: keyof CandidateForm, value: string | string[]) {
        setForm((s) => ({ ...s, [name]: value }));
        setError(null);
    }

    function toggleSkill(skill: string) {
        setForm((s) => ({
            ...s,
            skills: s.skills.includes(skill)
                ? s.skills.filter((sk) => sk !== skill)
                : [...s.skills, skill],
        }));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        handleFile(f);
    }

    function handleFile(f: File | null) {
        if (!f) return;

        const allowed = [/\.pdf$/i, /\.docx?$/i];
        if (!allowed.some((r) => r.test(f.name))) {
            setError("Format non supporté. Utilisez PDF, DOC ou DOCX");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError("Fichier trop volumineux (max 5 Mo)");
            return;
        }

        setFile(f);
        setError(null);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    }

    function humanFileSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function validateStep(currentStep: number): boolean {
        setError(null);

        switch (currentStep) {
            case 0:
                if (!form.firstName || !form.lastName) {
                    setError("Le prénom et le nom sont requis");
                    return false;
                }
                if (
                    !form.email ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                ) {
                    setError("Email invalide");
                    return false;
                }
                break;
            case 1:
                if (!form.specialty) {
                    setError("Veuillez sélectionner votre domaine d'expertise");
                    return false;
                }
                if (form.skills.length === 0) {
                    setError("Sélectionnez au moins une compétence");
                    return false;
                }
                break;
            case 2:
                if (!form.motivation || form.motivation.length < 50) {
                    setError(
                        "La motivation doit contenir au moins 50 caractères"
                    );
                    return false;
                }
                break;
        }

        return true;
    }

    function nextStep() {
        if (validateStep(step)) {
            setStep((s) => Math.min(3, s + 1));
        }
    }

    function prevStep() {
        setStep((s) => Math.max(0, s - 1));
        setError(null);
    }

    async function onSubmit() {
        setError(null);

        if (!validateStep(2)) return;

        // enforce minimum submission delay (ms)
        const elapsed = Date.now() - tsRef.current;
        const MIN_MS = 7000;
        if (elapsed < MIN_MS) {
            setError(
                `Veuillez patienter ${Math.ceil(
                    (MIN_MS - elapsed) / 1000
                )}s avant d'envoyer.`
            );
            return;
        }

        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                data.append(key, JSON.stringify(value));
            } else {
                data.append(key, value);
            }
        });
        if (file) data.append("cv", file);

        // Debug log: print FormData contents
        for (const pair of data.entries()) {
            console.log("FormData:", pair[0], pair[1]);
        }

        try {
            setIsSubmitting(true);
            // attach anti-bot fields: compute PoW in a worker to avoid UI blocking
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

            data.append("_hp", "");
            data.append("ts", String(tsRef.current));
            if (pow) data.append("pow", JSON.stringify(pow));

            const res = await fetch("/api/candidature", {
                method: "POST",
                body: data,
            });
            const json = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        linkedIn: "",
                        availability: "",
                        specialty: "",
                        coverLetter: "",
                        motivation: "",
                        experience: "",
                        skills: [],
                    });
                    setFile(null);
                    setStep(0);
                    setSuccess(false);
                }, 3000);
            } else {
                setError(json?.error || "Erreur lors de l'envoi");
            }
        } catch (e) {
            console.error(e);
            setError("Erreur de connexion au serveur");
        } finally {
            setIsSubmitting(false);
        }
    }

    const selectedSpecialty = specialties.find(
        (s) => s.value === form.specialty
    );
    const SpecialtyIcon = selectedSpecialty?.icon || Briefcase;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30"></div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-28 left-10 w-72 h-72 bg-[#4aa8e0]/12 rounded-full blur-3xl"></div>
                <div className="absolute bottom-24 right-10 w-72 h-72 bg-[#4aa8e0]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#4aa8e0]/10 rounded-full border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-[#4aa8e0]" />
                        <span className="text-sm text-[#4aa8e0] font-medium">
                            Rejoignez l&apos;aventure Renardis
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-[#4aa8e0]">Candidature</span>
                        <span className="text-[#f97316]"> spontanée</span>
                    </h1>

                    <p className="text-[#4aa8e0]/80 text-lg max-w-2xl mx-auto">
                        Participez à un projet éthique, éducatif et solidaire au
                        service de la jeunesse
                    </p>
                </div>

                {/* Progress indicators */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#4aa8e0]/80 font-medium">
                            Progression
                        </span>
                        <span className="text-sm font-bold text-[#4aa8e0]">
                            {completionScore}%
                        </span>
                    </div>

                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div
                            className="h-full bg-[#4aa8e0] transition-all duration-500 rounded-full relative"
                            style={{ width: `${completionScore}%` }}
                        >
                            <div className="absolute inset-0 bg-white/10" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        {[
                            "Identité",
                            "Expertise",
                            "Motivation",
                            "Validation",
                        ].map((label, idx) => {
                            const isPassed = step > idx;
                            const isCurrent = step === idx;

                            return (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center flex-1"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                                            isPassed
                                                ? "bg-[#4aa8e0] scale-110"
                                                : isCurrent
                                                ? "bg-[#4aa8e0] animate-pulse"
                                                : "bg-white/5 border border-white/10"
                                        }`}
                                    >
                                        {isPassed ? (
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        ) : (
                                            <span
                                                className={`text-sm font-bold ${
                                                    isCurrent
                                                        ? "text-white"
                                                        : "text-[#4aa8e0]"
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-medium ${
                                            step >= idx
                                                ? "text-[#4aa8e0]"
                                                : "text-[#4aa8e0]/40"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main card */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Error message */}
                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="p-6 md:p-8">
                        {/* Step 0: Identity */}
                        {step === 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#4aa8e0] flex items-center justify-center">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#4aa8e0]">
                                            Qui êtes-vous ?
                                        </h2>
                                        <p className="text-sm text-[#4aa8e0]/70">
                                            Commençons par faire connaissance
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            Prénom{" "}
                                            <span className="text-[#f97316]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.firstName}
                                            onChange={(e) =>
                                                updateField(
                                                    "firstName",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="Votre prénom"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            Nom{" "}
                                            <span className="text-[#f97316]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.lastName}
                                            onChange={(e) =>
                                                updateField(
                                                    "lastName",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="Votre nom"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email{" "}
                                            <span className="text-[#f97316]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                updateField(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="votre.email@exemple.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Téléphone
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) =>
                                                updateField(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="+33 6 12 34 56 78"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn / Portfolio
                                        </label>
                                        <input
                                            type="url"
                                            value={form.linkedIn}
                                            onChange={(e) =>
                                                updateField(
                                                    "linkedIn",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Disponibilités
                                        </label>
                                        <input
                                            type="text"
                                            value={form.availability}
                                            onChange={(e) =>
                                                updateField(
                                                    "availability",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all"
                                            placeholder="Ex: Immédiate, à partir du..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Expertise */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#4aa8e0] flex items-center justify-center">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#4aa8e0]">
                                            Votre expertise
                                        </h2>
                                        <p className="text-sm text-[#4aa8e0]/70">
                                            Partagez vos compétences et votre
                                            domaine
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className=" text-sm font-medium text-[#4aa8e0] mb-3 flex items-center gap-2">
                                        Domaine d&apos;expertise{" "}
                                        <span className="text-[#f97316]">
                                            *
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {specialties.map((spec) => {
                                            const Icon = spec.icon;
                                            const isSelected =
                                                form.specialty === spec.value;

                                            return (
                                                <button
                                                    key={spec.value}
                                                    type="button"
                                                    onClick={() =>
                                                        updateField(
                                                            "specialty",
                                                            spec.value
                                                        )
                                                    }
                                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                                        isSelected
                                                            ? "border-[#4aa8e0] bg-[#4aa8e0]/10 scale-105"
                                                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                                isSelected
                                                                    ? "bg-[#4aa8e0]"
                                                                    : "bg-white/10"
                                                            }`}
                                                        >
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <span
                                                            className={`font-medium ${
                                                                isSelected
                                                                    ? "text-[#4aa8e0]"
                                                                    : "text-[#4aa8e0]/70"
                                                            }`}
                                                        >
                                                            {spec.label}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className=" text-sm font-medium text-[#4aa8e0] mb-3 flex items-center gap-2">
                                        Compétences{" "}
                                        <span className="text-[#f97316]">
                                            *
                                        </span>
                                        <span className="text-xs text-[#4aa8e0]/50 font-normal">
                                            (Sélectionnez-en plusieurs)
                                        </span>
                                    </label>

                                    <div className="flex flex-wrap gap-2">
                                        {availableSkills.map((skill) => {
                                            const isSelected =
                                                form.skills.includes(skill);

                                            return (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleSkill(skill)
                                                    }
                                                    className={`px-4 py-2 rounded-full border transition-all duration-300 text-sm font-medium ${
                                                        isSelected
                                                            ? "border-[#4aa8e0] bg-[#4aa8e0]/20 text-[#4aa8e0] scale-105"
                                                            : "border-white/10 bg-white/5 text-[#4aa8e0]/60 hover:border-white/20 hover:bg-white/10"
                                                    }`}
                                                >
                                                    {skill}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className=" text-sm font-medium text-[#4aa8e0]">
                                        Expérience professionnelle / académique
                                    </label>
                                    <textarea
                                        value={form.experience}
                                        onChange={(e) =>
                                            updateField(
                                                "experience",
                                                e.target.value
                                            )
                                        }
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all resize-none"
                                        placeholder="Décrivez brièvement votre parcours et vos expériences pertinentes..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Motivation & CV */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#f97316] flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#f97316]">
                                            Votre motivation
                                        </h2>
                                        <p className="text-sm text-[#f97316]/70">
                                            Convainquez-nous de votre engagement
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                        Lettre de motivation{" "}
                                        <span className="text-[#f97316]">
                                            *
                                        </span>
                                        <span className="text-xs text-[#4aa8e0]/50 font-normal">
                                            (min. 50 caractères)
                                        </span>
                                    </label>
                                    <textarea
                                        value={form.motivation}
                                        onChange={(e) =>
                                            updateField(
                                                "motivation",
                                                e.target.value
                                            )
                                        }
                                        rows={8}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#4aa8e0] placeholder-[#4aa8e0]/30 focus:outline-none focus:border-[#4aa8e0] focus:ring-2 focus:ring-[#4aa8e0]/20 transition-all resize-none"
                                        placeholder="Expliquez-nous pourquoi vous souhaitez rejoindre Renardis et comment vous pouvez contribuer à notre mission éthique, éducative et solidaire..."
                                    />
                                    <div className="text-xs text-[#4aa8e0]/50 text-right">
                                        {form.motivation.length} caractères
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className=" text-sm font-medium text-[#4aa8e0] flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        CV (optionnel)
                                        <span className="text-xs text-[#4aa8e0]/50 font-normal">
                                            (PDF, DOC, DOCX - max 5 Mo)
                                        </span>
                                    </label>

                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                                            isDragging
                                                ? "border-[#4aa8e0] bg-[#4aa8e0]/10 scale-105"
                                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                        }`}
                                    >
                                        <input
                                            id="cv"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        {!file ? (
                                            <label
                                                htmlFor="cv"
                                                className="flex flex-col items-center gap-4 cursor-pointer"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-[#4aa8e0] flex items-center justify-center">
                                                    <Upload className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[#4aa8e0] font-medium mb-1">
                                                        Glissez votre CV ou
                                                        cliquez pour
                                                        sélectionner
                                                    </p>
                                                    <p className="text-sm text-[#4aa8e0]/50">
                                                        PDF, DOC ou DOCX
                                                        jusqu&apos;à 5 Mo
                                                    </p>
                                                </div>
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-[#4aa8e0] flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[#4aa8e0] font-medium">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm text-[#4aa8e0]/50">
                                                            {humanFileSize(
                                                                file.size
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewUrl(
                                                                URL.createObjectURL(
                                                                    file
                                                                )
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                                                        title="Prévisualiser"
                                                    >
                                                        <Eye className="w-5 h-5 text-[#4aa8e0]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFile(null)
                                                        }
                                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <X className="w-5 h-5 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#4aa8e0] flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#4aa8e0]">
                                            Vérification finale
                                        </h2>
                                        <p className="text-sm text-[#4aa8e0]/70">
                                            Relisez votre candidature avant
                                            envoi
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Personal Info */}
                                    <div className="space-y-4 p-6 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="w-5 h-5 text-[#4aa8e0]" />
                                            <h3 className="font-semibold text-[#4aa8e0]">
                                                Informations personnelles
                                            </h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    Nom complet:
                                                </span>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {form.firstName}{" "}
                                                    {form.lastName}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    Email:
                                                </span>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {form.email}
                                                </p>
                                            </div>
                                            {form.phone && (
                                                <div>
                                                    <span className="text-[#4aa8e0]/60">
                                                        Téléphone:
                                                    </span>
                                                    <p className="text-[#4aa8e0] font-medium">
                                                        {form.phone}
                                                    </p>
                                                </div>
                                            )}
                                            {form.linkedIn && (
                                                <div>
                                                    <span className="text-[#4aa8e0]/60">
                                                        LinkedIn:
                                                    </span>
                                                    <p className="text-[#4aa8e0] font-medium truncate">
                                                        {form.linkedIn}
                                                    </p>
                                                </div>
                                            )}
                                            {form.availability && (
                                                <div>
                                                    <span className="text-[#4aa8e0]/60">
                                                        Disponibilités:
                                                    </span>
                                                    <p className="text-[#4aa8e0] font-medium">
                                                        {form.availability}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expertise */}
                                    <div className="space-y-4 p-6 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Award className="w-5 h-5 text-[#4aa8e0]" />
                                            <h3 className="font-semibold text-[#4aa8e0]">
                                                Expertise
                                            </h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    Domaine:
                                                </span>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[#4aa8e0] flex items-center justify-center">
                                                        <SpecialtyIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <p className="text-[#4aa8e0] font-medium">
                                                        {
                                                            selectedSpecialty?.label
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {form.skills.length > 0 && (
                                                <div>
                                                    <span className="text-[#4aa8e0]/60">
                                                        Compétences:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {form.skills.map(
                                                            (skill) => (
                                                                <span
                                                                    key={skill}
                                                                    className="px-3 py-1 rounded-full bg-[#4aa8e0]/20 border border-[#4aa8e0]/30 text-[#4aa8e0] text-xs font-medium"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Experience */}
                                {form.experience && (
                                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Briefcase className="w-5 h-5 text-[#4aa8e0]" />
                                            <h3 className="font-semibold text-[#4aa8e0]">
                                                Expérience
                                            </h3>
                                        </div>
                                        <p className="text-sm text-[#4aa8e0]/80 whitespace-pre-wrap leading-relaxed break-words">
                                            {form.experience}
                                        </p>
                                    </div>
                                )}

                                {/* Motivation */}
                                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-[#f97316]" />
                                        <h3 className="font-semibold text-[#4aa8e0]">
                                            Lettre de motivation
                                        </h3>
                                    </div>
                                    <p className="text-sm text-[#4aa8e0]/80 whitespace-pre-wrap leading-relaxed break-words">
                                        {form.motivation}
                                    </p>
                                </div>

                                {/* CV */}
                                {file && (
                                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#4aa8e0] flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-[#4aa8e0]">
                                                        CV joint
                                                    </h3>
                                                    <p className="text-xs text-[#4aa8e0]/60">
                                                        {file.name} •{" "}
                                                        {humanFileSize(
                                                            file.size
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPreviewUrl(
                                                        URL.createObjectURL(
                                                            file
                                                        )
                                                    )
                                                }
                                                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm text-[#4aa8e0]"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Voir
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-sm text-[#4aa8e0]/80 leading-relaxed">
                                        🔒 Vos données seront traitées dans le
                                        respect de votre vie privée et des
                                        valeurs éthiques de Renardis.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PoW progress / cancel (non-blocking) */}
                    {powRunning && (
                        <div className="px-6 md:px-8 pb-4 flex items-center justify-center gap-3 text-sm">
                            <div className="text-[#4aa8e0]">
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

                    {/* Navigation */}
                    <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between border-t border-white/10 pt-6">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={step === 0}
                            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                step === 0
                                    ? "opacity-0 pointer-events-none"
                                    : "bg-white/5 hover:bg-white/10 text-[#4aa8e0] border border-white/10"
                            }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Retour
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-3 rounded-xl bg-[#4aa8e0] text-white font-semibold hover:shadow-lg hover:shadow-[#4aa8e0]/30 transition-all hover:scale-105 flex items-center gap-2"
                            >
                                Continuer
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-xl bg-[#4aa8e0] text-white font-bold hover:shadow-lg hover:shadow-[#4aa8e0]/30 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Envoyer ma candidature
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Additional info */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-[#4aa8e0]/60">
                        Besoin d&apos;aide ? Contactez-nous à{" "}
                        <a
                            href="mailto:recrutement@renardis.fr"
                            className="text-[#4aa8e0] hover:text-[#f97316] transition-colors underline"
                        >
                            recrutement@renardis.fr
                        </a>
                    </p>
                </div>
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-5xl h-[90vh] bg-gradient-to-br from-[#00132c]/95 to-[#003F92]/95 rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-[#4aa8e0]" />
                                <span className="text-sm font-medium text-[#4aa8e0]">
                                    Prévisualisation du CV
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewUrl ?? undefined}
                                    download={file?.name}
                                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-sm text-[#4aa8e0]"
                                >
                                    <Download className="w-4 h-4" />
                                    Télécharger
                                </a>
                                <button
                                    onClick={() => {
                                        if (previewUrl) {
                                            URL.revokeObjectURL(previewUrl);
                                        }
                                        setPreviewUrl(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm text-red-400"
                                >
                                    <X className="w-4 h-4" />
                                    Fermer
                                </button>
                            </div>
                        </div>
                        <iframe
                            src={previewUrl ?? undefined}
                            className="w-full h-full"
                            title="CV Preview"
                        />
                    </div>
                </div>
            )}

            {/* Success toast at bottom, outside main card but inside main container */}
            {success && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-500/90 border border-green-500/30 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                    <div>
                        <p className="text-base font-semibold text-white">
                            Candidature envoyée avec succès !
                        </p>
                        <p className="text-xs text-white/80 mt-1">
                            Nous reviendrons vers vous très prochainement.
                        </p>
                    </div>
                </div>
            )}
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
