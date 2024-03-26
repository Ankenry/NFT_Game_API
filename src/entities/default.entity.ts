import { UUID } from "crypto";
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export abstract class DefaultEntity {
  @PrimaryGeneratedColumn("uuid")
  id: UUID;

  @Column({
    type: "bool",
    default: false,
  })
  is_delete: boolean;

  @CreateDateColumn({
    nullable: false,
  })
  created_date: Date;

  @UpdateDateColumn({
    nullable: true,
  })
  modified_date: Date;
}