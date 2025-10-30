import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { File as FileEntity } from "./File";

@Entity()
export class Candidate {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    linkedIn: string;

    @Column({ nullable: true })
    availability: string;

    @Column({ nullable: true })
    specialty: string;

    @Column({ nullable: true })
    coverLetter: string;

    @Column({ type: "simple-array", nullable: true })
    skills: string[];

    @Column({ type: "text", nullable: true })
    motivation: string;

    @Column({ type: "text", nullable: true })
    experience: string;

    @ManyToOne(() => FileEntity, { nullable: true })
    @JoinColumn({ name: "cvFileId" })
    cvFile: FileEntity | null;

    @Column({ nullable: false })
    accessCode: string;

    @Column({ default: "Nouvelle candidature" })
    status: string;

    @Column({ type: "text", default: "[]" })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;
}
