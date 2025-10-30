import { NextRequest, NextResponse } from "next/server";
import { initializeOrm } from "@/server/orm";
import { Candidate } from "@/server/entities/Candidate";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const url = new URL(request.url);
    const accessCode = url.searchParams.get("code");
    console.log(`[API] GET /api/candidature/${id}?code=${accessCode}`);
    const orm = await initializeOrm();
    console.log(`[API] Database file:`, orm.options.database);
    const candidateRepo = orm.getRepository(Candidate);
    const allCandidates = await candidateRepo.find();
    console.log(
        `[API] All candidate ids:`,
        allCandidates.map((c) => c.id)
    );
    const candidate = await candidateRepo.findOne({
        where: { id },
        relations: ["cvFile"],
    });
    console.log(
        `[API] Candidate found:`,
        !!candidate,
        candidate ? candidate.id : null
    );
    if (!candidate) {
        console.log(`[API] Candidate not found for id: ${id}`);
        return NextResponse.json(
            { error: "Candidat non trouvé" },
            { status: 404 }
        );
    }
    if (!accessCode || accessCode !== candidate.accessCode) {
        console.log(
            `[API] Access code invalid or missing. Provided: ${accessCode}, Expected: ${candidate.accessCode}`
        );
        return NextResponse.json(
            { error: "Code d'accès invalide ou manquant" },
            { status: 403 }
        );
    }
    return NextResponse.json({
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
    });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const url = new URL(request.url);
    const accessCode = url.searchParams.get("code");
    if (!accessCode) {
        return NextResponse.json(
            { error: "Code d'accès manquant" },
            { status: 403 }
        );
    }
    const orm = await initializeOrm();
    const candidateRepo = orm.getRepository(Candidate);
    const candidate = await candidateRepo.findOne({ where: { id } });
    if (!candidate) {
        return NextResponse.json(
            { error: "Candidat non trouvé" },
            { status: 404 }
        );
    }
    if (candidate.accessCode !== accessCode) {
        return NextResponse.json(
            { error: "Code d'accès invalide" },
            { status: 403 }
        );
    }
    const body = await request.json();
    if (typeof body.notes !== "string") {
        return NextResponse.json({ error: "Notes invalides" }, { status: 400 });
    }
    candidate.notes = body.notes;
    await candidateRepo.save(candidate);
    return NextResponse.json({ success: true });
}
