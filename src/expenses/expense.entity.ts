import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from '../categories/category.entity';

export enum ExpenseType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ExpenseType })
  type!: ExpenseType;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ nullable: true })
  recurringDay!: number;

  @ManyToOne(() => Category, (category) => category.expenses, { eager: true })
  category!: Category;

  @Column()
  categoryId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
