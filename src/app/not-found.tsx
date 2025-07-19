import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#00132c] via-[#003F92] to-[#00132c] text-[#4fc3f7] px-4">
      <div className="text-7xl font-bold mb-4">404</div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Oups, cette page n&apos;existe pas !</h1>
      <p className="text-[#4fc3f7]/80 mb-8 text-center max-w-md">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.<br />
        Retournez à l&apos;accueil pour continuer à explorer Renardis.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-gradient-to-r from-[#4fc3f7] to-[#4fc3f7]/90 text-white font-semibold rounded-lg border border-[#4fc3f7]/50 hover:border-[#4fc3f7] transition-all duration-300 hover:scale-105 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#4fc3f7]/20"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
