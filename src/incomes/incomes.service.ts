import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Income } from './income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly repo: Repository<Income>,
    private readonly balanceService: BalanceService,
  ) {}

  async create(dto: CreateIncomeDto): Promise<Income> {
    const income = this.repo.create(dto);
    const saved = await this.repo.save(income);
    const account = saved.fromAccount ?? 'banco';
    const arsAmount = Number(saved.amount);
    await this.balanceService.adjust(account, +arsAmount).catch(() => {});
    return saved;
  }

  async findAll(query: QueryIncomeDto): Promise<Income[]> {
    const qb = this.repo.createQueryBuilder('income').orderBy('income.date', 'DESC');
    if (query.from) qb.andWhere('income.date >= :from', { from: query.from });
    if (query.to)   qb.andWhere('income.date <= :to',   { to: query.to });
    return qb.getMany();
  }

  async findOne(id: number): Promise<Income> {
    const income = await this.repo.findOne({ where: { id } });
    if (!income) throw new NotFoundException(`Income #${id} not found`);
    return income;
  }

  async update(id: number, dto: UpdateIncomeDto): Promise<Income> {
    const old = await this.findOne(id);
    await this.repo.update(id, dto as any);
    if (old.importSource !== 'bbva_import') {
      const account = old.fromAccount ?? 'efectivo';
      const oldArs = Number(old.amount);
      const newArs = dto.amount !== undefined ? Number(dto.amount) : oldArs;
      const diff = newArs - oldArs;
      if (diff !== 0) await this.balanceService.adjust(account, +diff).catch(() => {});
    }
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException(`Income #${id} not found`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const income = await this.findOne(id);
    const account = income.fromAccount ?? 'banco';
    const arsAmount = Number(income.amount);
    await this.repo.remove(income);
    // BBVA-imported records are already reflected in the Saldo snapshot — skip adjustment
    if (income.importSource !== 'bbva_import') {
      await this.balanceService.adjust(account, -arsAmount).catch(() => {});
    }
  }

  async getTotalByPeriod(query: QueryIncomeDto): Promise<number> {
    const qb = this.repo.createQueryBuilder('income').select('SUM(income.amount)', 'total');
    if (query.from) qb.andWhere('income.date >= :from', { from: query.from });
    if (query.to)   qb.andWhere('income.date <= :to',   { to: query.to });
    const result = await qb.getRawOne();
    return Number(result?.total ?? 0);
  }

  async findByExternalId(externalId: string): Promise<Income | null> {
    return this.repo.findOne({ where: { externalId } });
  }

  async findPossibleDuplicates(date: string, amount: number): Promise<Income[]> {
    const d = new Date(date);
    const from = new Date(d); from.setDate(d.getDate() - 1);
    const to   = new Date(d); to.setDate(d.getDate() + 1);
    const fmt  = (dt: Date) => dt.toISOString().slice(0, 10);

    return this.repo.createQueryBuilder('income')
      .where('income.date BETWEEN :from AND :to', { from: fmt(from), to: fmt(to) })
      .andWhere('ABS(income.amount - :amount) / :amount < 0.01', { amount })
      .getMany();
  }
}
