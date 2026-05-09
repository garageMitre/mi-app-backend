import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum IncomeSource {
  SALARY     = 'SALARY',
  FREELANCE  = 'FREELANCE',
  TRANSFER   = 'TRANSFER',
  REFUND     = 'REFUND',
  OTHER      = 'OTHER',
}

export enum MoneyType {
  ARS = 'ARS',
  USD = 'USD',
}

@Entity('incomes')
export class Income {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: MoneyType, default: MoneyType.ARS })
  moneyType!: MoneyType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  usdToArsRate!: number | null;

  @Column({ type: 'enum', enum: IncomeSource, default: IncomeSource.OTHER })
  source!: IncomeSource;

  @Column({ type: 'varchar', nullable: true })
  externalId!: string | null;

  @Column({ default: 'banco' })
  fromAccount!: string;

  // 'bbva_import' if imported from bank statement; null if manually created
  @Column({ type: 'varchar', nullable: true })
  importSource!: string | null;

  @Column({ type: 'varchar', nullable: true })
  importBatchId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
