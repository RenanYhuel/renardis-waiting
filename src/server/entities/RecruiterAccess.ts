import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";

@Entity("recruiter_access")
export class RecruiterAccess {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    code: string;

    @Column({ type: "datetime" })
    expiresAt: Date;

    @Column({ nullable: true })
    requesterInfo: string;

    @CreateDateColumn()
    createdAt: Date;
}
