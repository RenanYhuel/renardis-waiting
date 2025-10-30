import React from "react";
import CodeEntryForm from "./CodeEntryForm";
import { initializeOrm } from "@/server/orm";
import { Candidate } from "@/server/entities/Candidate";
import { Users, Award, Briefcase, Sparkles, CheckCircle } from "lucide-react";
import NotesClientCard from "./NotesClientCard";

async function getCandidateFromDb(id: string, code: string | null) {
    // Server-side: query the database directly to avoid making an HTTP request
    const orm = await initializeOrm();
    const repo = orm.getRepository(Candidate);
    const candidate = await repo.findOne({
        where: { id },
        relations: ["cvFile"],
    });
    if (!candidate) return null;
    if (!code || code !== candidate.accessCode) return null;
    return {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        linkedIn: candidate.linkedIn,
        availability: candidate.availability,
        specialty: candidate.specialty,
        coverLetter: candidate.coverLetter,
        skills: candidate.skills,
        motivation: candidate.motivation,
        experience: candidate.experience,
        status: candidate.status,
        notes: candidate.notes,
        createdAt: candidate.createdAt,
        cvFile: candidate.cvFile
            ? {
                  id: candidate.cvFile.id,
                  filename: candidate.cvFile.filename,
                  originalName: candidate.cvFile.originalName,
                  mimetype: candidate.cvFile.mimetype,
                  size: candidate.cvFile.size,
                  hash: candidate.cvFile.hash,
              }
            : null,
        accessCode: candidate.accessCode,
    };
}

export default async function CandidatePreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ code?: string }>;
}) {
    const { id } = await params;
    const { code } = await searchParams;
    if (!code) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c]">
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-4 text-[#4aa8e0]">
                        Fiche candidat
                    </h1>
                    <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/30 mb-4">
                        <p className="text-red-400">
                            Code d&apos;accès requis pour consulter cette fiche.
                        </p>
                    </div>
                    <CodeEntryForm id={id} />
                </div>
            </div>
        );
    }
    const candidate = await getCandidateFromDb(id, code);
    if (!candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c]">
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-4 text-[#4aa8e0]">
                        Fiche candidat
                    </h1>
                    <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/30 mb-4">
                        <p className="text-red-400">
                            Candidat introuvable ou code d&apos;accès invalide.
                        </p>
                    </div>
                    <CodeEntryForm id={id} />
                </div>
            </div>
        );
    }

    // Recruiter-only fields
    const recruiterFields = [
        { label: "ID interne", value: candidate.id },
        { label: "Code d'accès", value: candidate.accessCode },
        { label: "Statut", value: candidate.status },
        // Notes will be handled separately for editability
        {
            label: "Date de création",
            value: new Date(candidate.createdAt).toLocaleString(),
        },
    ];

    // Specialty label mapping (copied from candidature/page.tsx)
    const specialties = [
        {
            value: "dev",
            label: "Développement",
            icon: "Code",
            color: "#4aa8e0",
        },
        {
            value: "design",
            label: "Design / UX",
            icon: "Palette",
            color: "#f97316",
        },
        {
            value: "admin",
            label: "Administration système",
            icon: "Server",
            color: "#4aa8e0",
        },
        {
            value: "marketing",
            label: "Communication / Marketing",
            icon: "Megaphone",
            color: "#f97316",
        },
    ];
    // Function body continues here
    // Specialty label mapping for candidate
    const specialtyObj = specialties.find(
        (s) => s.value === candidate.specialty
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30"></div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-28 left-10 w-72 h-72 bg-[#4aa8e0]/12 rounded-full blur-3xl"></div>
                <div className="absolute bottom-24 right-10 w-72 h-72 bg-[#4aa8e0]/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#4aa8e0]/10 rounded-full border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-[#4aa8e0]" />
                        <span className="text-sm text-[#4aa8e0] font-medium">
                            Fiche candidat
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-[#4aa8e0]">Aperçu</span>
                        <span className="text-[#f97316]"> recruteur</span>
                    </h1>
                    <p className="text-[#4aa8e0]/80 text-lg max-w-2xl mx-auto">
                        Tous les détails de la candidature, y compris les champs
                        réservés au recruteur.
                    </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 md:p-8 space-y-6">
                        {/* Personal Info, Expertise, Experience, Motivation, CV, Validation, Recruiter-only fields */}
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
                                        Relisez la candidature avant envoi
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
                                                {candidate.firstName}{" "}
                                                {candidate.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[#4aa8e0]/60">
                                                Email:
                                            </span>
                                            <p className="text-[#4aa8e0] font-medium">
                                                {candidate.email}
                                            </p>
                                        </div>
                                        {candidate.phone && (
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    Téléphone:
                                                </span>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {candidate.phone}
                                                </p>
                                            </div>
                                        )}
                                        {candidate.linkedIn && (
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    LinkedIn:
                                                </span>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {candidate.linkedIn}
                                                </p>
                                            </div>
                                        )}
                                        {candidate.availability && (
                                            <div>
                                                <span className="text-[#4aa8e0]/60">
                                                    Disponibilité:
                                                </span>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {candidate.availability}
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
                                                    <Briefcase className="w-4 h-4 text-white" />
                                                </div>
                                                <p className="text-[#4aa8e0] font-medium">
                                                    {specialtyObj?.label ||
                                                        candidate.specialty}
                                                </p>
                                            </div>
                                        </div>
                                        {candidate.skills &&
                                            candidate.skills.length > 0 && (
                                                <div>
                                                    <span className="text-[#4aa8e0]/60">
                                                        Compétences:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {candidate.skills.map(
                                                            (skill: string) => (
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
                            {/* Special Motivation Card */}
                            <div className="p-6 rounded-xl bg-white/5 border border-[#4aa8e0]/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <Award className="w-5 h-5 text-[#4aa8e0]" />
                                    <h3 className="font-semibold text-[#4aa8e0]">
                                        Lettre de motivation
                                    </h3>
                                </div>
                                <p className="text-sm text-[#4aa8e0]/80 whitespace-pre-wrap leading-relaxed break-words">
                                    {candidate.motivation ? (
                                        candidate.motivation
                                    ) : (
                                        <span className="text-[#4aa8e0]/40">
                                            Non renseigné
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-sm text-[#4aa8e0]/80 leading-relaxed">
                                    🔒 Données confidentielles réservées au
                                    recruteur.
                                </p>
                            </div>
                        </div>
                        {/* Recruiter-only fields below validation step */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {recruiterFields.map((field) => (
                                <div
                                    key={field.label}
                                    className="p-6 rounded-xl bg-white/5 border border-white/10"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-[#4aa8e0]" />
                                        <h3 className="font-semibold text-[#4aa8e0]">
                                            {field.label}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-[#4aa8e0]/80 whitespace-pre-wrap leading-relaxed break-words">
                                        {field.value !== undefined &&
                                        field.value !== null &&
                                        field.value !== "" ? (
                                            field.value
                                        ) : (
                                            <span className="text-[#4aa8e0]/40">
                                                Non renseigné
                                            </span>
                                        )}
                                    </p>
                                </div>
                            ))}
                            <NotesClientCard
                                candidateId={candidate.id}
                                accessCode={candidate.accessCode}
                                initialNotes={candidate.notes}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
