"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"contact">("contact");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const openModal = (type: "contact") => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsSubmitting(false);
    };

    // Fermer le modal en cliquant en dehors
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const endpoint =
                modalType === "contact" ? "/api/contact" : "/api/candidature";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                // Toast de succès avec sonner
                toast.success(result.message, {
                    description:
                        modalType === "contact"
                            ? "Nous vous répondrons dans les plus brefs délais."
                            : "Nous examinerons votre candidature attentivement.",
                });

                // Réinitialiser le formulaire
                (e.target as HTMLFormElement).reset();

                // Fermer le modal après 2 secondes
                setTimeout(() => {
                    closeModal();
                }, 2000);
            } else {
                // Toast d'erreur
                toast.error(result.error || "Une erreur est survenue", {
                    description:
                        "Veuillez vérifier vos informations et réessayer.",
                });
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi:", error);
            toast.error("Erreur de connexion", {
                description: "Vérifiez votre connexion internet et réessayez.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollToValues = () => {
        document
            .getElementById("values")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30"></div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6 lg:px-8">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <Image
                        src="/logo.png"
                        alt="Renardis Logo"
                        width={28}
                        height={28}
                        className="rounded-lg sm:w-8 sm:h-8"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-[#4fc3f7]">
                        <span className="text-[#f97316]">R</span>enardis
                    </h1>
                </div>
                <div className="flex items-center space-x-4 sm:space-x-8">
                    <button
                        onClick={() => router.push("/candidature")}
                        className="text-[#4fc3f7] hover:text-white transition-colors duration-300 cursor-pointer text-sm sm:text-base font-medium"
                    >
                        Nous rejoindre
                    </button>
                    <button
                        onClick={() => openModal("contact")}
                        className="text-[#4fc3f7] hover:text-white transition-colors duration-300 cursor-pointer text-sm sm:text-base font-medium"
                    >
                        Contact
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] sm:min-h-[80vh] px-4 sm:px-6 text-center pt-8 sm:pt-0">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8 sm:mb-8">
                        <span className="inline-block px-3 py-2 sm:px-4 sm:py-2 mb-6 sm:mb-6 text-xs sm:text-sm font-medium text-[#4fc3f7] bg-[#4fc3f7]/10 border border-[#4fc3f7]/20 rounded-full backdrop-blur-sm">
                            🦊 Site en construction
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                        <span className="text-[#4fc3f7] whitespace-nowrap">
                            <span className="text-[#f97316]">R</span>enardis
                        </span>
                    </h1>

                    <p className="text-base sm:text-xl md:text-2xl text-[#4fc3f7] mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
                        Cloud computing éthique, accessible et éducatif à
                        destination des jeunes. Favoriser l&apos;autonomie
                        numérique dans une logique de solidarité et
                        d&apos;inclusion.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
                        <button
                            onClick={() => router.push("/candidature")}
                            className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#4fc3f7] to-[#4fc3f7]/90 text-white font-semibold rounded-lg border border-[#4fc3f7]/50 hover:border-[#4fc3f7] transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#4fc3f7]/20"
                        >
                            <span className="relative z-10 text-sm sm:text-base">
                                Nous rejoindre
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4fc3f7]/10 to-[#4fc3f7]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>

                        <button
                            onClick={scrollToValues}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-[#4fc3f7]/50 text-[#4fc3f7] font-semibold rounded-lg hover:bg-[#4fc3f7]/10 hover:border-[#4fc3f7] transition-all duration-300 cursor-pointer text-sm sm:text-base"
                        >
                            Découvrir nos valeurs
                        </button>
                    </div>

                    {/* Values */}
                    <div
                        id="values"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16 px-2"
                    >
                        <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-[#4fc3f7]/30 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="text-2xl sm:text-3xl font-bold text-[#4fc3f7] mb-2 sm:mb-3">
                                🎓
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-[#4fc3f7] mb-1 sm:mb-2">
                                Éducatif
                            </h3>
                            <p className="text-xs sm:text-sm text-[#4fc3f7]/70 leading-relaxed">
                                Apprentissage et autonomie numérique pour tous
                            </p>
                        </div>

                        <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-[#f97316]/30 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="text-2xl sm:text-3xl font-bold text-[#f97316] mb-2 sm:mb-3">
                                🤝
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-[#4fc3f7] mb-1 sm:mb-2">
                                Solidaire
                            </h3>
                            <p className="text-xs sm:text-sm text-[#4fc3f7]/70 leading-relaxed">
                                Accessible et inclusif dans une démarche
                                équitable
                            </p>
                        </div>

                        <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-[#4fc3f7]/30 transition-all duration-300 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
                            <div className="text-2xl sm:text-3xl font-bold text-[#4fc3f7] mb-2 sm:mb-3">
                                🔒
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-[#4fc3f7] mb-1 sm:mb-2">
                                Éthique
                            </h3>
                            <p className="text-xs sm:text-sm text-[#4fc3f7]/70 leading-relaxed">
                                Respect absolu de la vie privée et des données
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-800/50 mt-12 sm:mt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="text-[#4fc3f7]/70 text-xs sm:text-sm text-center md:text-left">
                            © 2025 Renardis. Association loi 1901.
                        </div>
                        <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6">
                            <a
                                href="https://linkedin.com/company/renardis"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4fc3f7]/70 hover:text-[#4fc3f7] transition-colors duration-300 cursor-pointer text-xs sm:text-sm font-medium"
                            >
                                LinkedIn
                            </a>
                            <a
                                href="https://x.com/Renardis_fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4fc3f7]/70 hover:text-[#4fc3f7] transition-colors duration-300 cursor-pointer text-xs sm:text-sm font-medium"
                            >
                                X
                            </a>
                            <a
                                href="https://discord.gg/renardis"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4fc3f7]/70 hover:text-[#f97316] transition-colors duration-300 cursor-pointer text-xs sm:text-sm font-medium"
                            >
                                Discord
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-gradient-to-br from-[#00132c]/95 to-[#003F92]/95 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md sm:max-w-lg w-full relative shadow-2xl animate-in fade-in duration-300">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-1 rounded-full hover:bg-white/10"
                        >
                            <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Modal content */}
                        <div className="mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-[#4fc3f7] mb-2">
                                {"Nous contacter"}
                            </h2>
                            <p className="text-[#4fc3f7]/70 text-sm">
                                Une question ? Un projet ? Envie d&apos;en
                                savoir plus ? Écrivez-nous !
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#4fc3f7] mb-2">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    name="nom"
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-[#4fc3f7] placeholder-[#4fc3f7]/50 focus:outline-none focus:border-[#4fc3f7] focus:ring-2 focus:ring-[#4fc3f7]/20 transition-all duration-300 cursor-text disabled:opacity-50"
                                    placeholder="Votre nom et prénom"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#4fc3f7] mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-[#4fc3f7] placeholder-[#4fc3f7]/50 focus:outline-none focus:border-[#4fc3f7] focus:ring-2 focus:ring-[#4fc3f7]/20 transition-all duration-300 cursor-text disabled:opacity-50"
                                    placeholder="votre.email@exemple.com"
                                />
                            </div>

                            {/* ...existing code... */}

                            <div>
                                <label className="block text-sm font-medium text-[#4fc3f7] mb-2">
                                    Message *
                                </label>
                                <textarea
                                    name="message"
                                    required
                                    rows={4}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-[#4fc3f7] placeholder-[#4fc3f7]/50 focus:outline-none focus:border-[#4fc3f7] focus:ring-2 focus:ring-[#4fc3f7]/20 transition-all duration-300 resize-none cursor-text disabled:opacity-50"
                                    placeholder={
                                        modalType === "contact"
                                            ? "Décrivez votre demande ou votre projet..."
                                            : "Parlez-nous de votre motivation à rejoindre Renardis..."
                                    }
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-3 bg-gradient-to-r from-[#4fc3f7] to-[#4fc3f7]/80 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#4fc3f7]/25 transition-all duration-300 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4fc3f7]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isSubmitting
                                    ? "Envoi en cours..."
                                    : modalType === "contact"
                                    ? "Envoyer le message"
                                    : "Candidater"}
                            </button>
                        </form>

                        <p className="text-xs text-[#4fc3f7]/60 mt-4 text-center leading-relaxed">
                            Vos données sont traitées dans le respect de votre
                            vie privée et des valeurs éthiques de Renardis.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
