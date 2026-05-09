import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('balance_snapshots')
export class BalanceSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  // 'banco' | 'efectivo' — which wallet this snapshot belongs to
  @Column({ default: 'banco' })
  account!: string;

  @Column({ default: 'manual' })
  source!: string;

  @Column({ type: 'varchar', nullable: true })
  importBatchId!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
