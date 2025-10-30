import { NextRequest, NextResponse } from "next/server";
import { initializeOrm } from "@/server/orm";
import { File as FileEntity } from "@/server/entities/File";
import path from "path";
import fs from "fs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const orm = await initializeOrm();
    const fileRepo = orm.getRepository(FileEntity);
    const file = await fileRepo.findOne({ where: { id } });
    if (!file) {
        return NextResponse.json(
            { error: "Fichier non trouvé" },
            { status: 404 }
        );
    }
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, file.filename);
    if (!fs.existsSync(filePath)) {
        return NextResponse.json(
            { error: "Fichier physique non trouvé" },
            { status: 404 }
        );
    }
    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": file.mimetype,
            "Content-Disposition": `attachment; filename=\"${file.originalName}\"`,
        },
    });
}
