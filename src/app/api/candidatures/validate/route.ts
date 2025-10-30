import { NextResponse } from "next/server";
import { initializeOrm } from "@/server/orm";
import { RecruiterAccess } from "@/server/entities/RecruiterAccess";
import { Candidate } from "@/server/entities/Candidate";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const code = body?.code;
        if (!code)
            return NextResponse.json({ error: "Code requis" }, { status: 400 });

        const orm = await initializeOrm();
        const accessRepo = orm.getRepository(RecruiterAccess);
        const access = await accessRepo.findOne({ where: { code } });
        if (!access)
            return NextResponse.json(
                { error: "Code invalide" },
                { status: 403 }
            );
        if (new Date(access.expiresAt) < new Date())
            return NextResponse.json({ error: "Code expiré" }, { status: 403 });

        // valid: return list of candidates
        const candidateRepo = orm.getRepository(Candidate);
        const all = await candidateRepo.find();
        const payload = all.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            specialty: c.specialty,
            accessCode: c.accessCode,
        }));

        return NextResponse.json({ success: true, candidates: payload });
    } catch (err) {
        console.error("Error validating recruiter code", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
