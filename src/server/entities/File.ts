import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";

@Entity()
export class File {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    filename: string;

    @Column()
    originalName: string;

    @Column()
    mimetype: string;

    @Column()
    size: number;

    @Column()
    hash: string;

    @CreateDateColumn()
    createdAt: Date;
}
