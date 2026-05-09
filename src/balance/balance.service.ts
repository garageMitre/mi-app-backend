import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BalanceSnapshot } from './balance.entity';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(BalanceSnapshot)
    private readonly repo: Repository<BalanceSnapshot>,
  ) {}

  async getCurrent(account = 'banco'): Promise<BalanceSnapshot | null> {
    // Include rows where account is NULL (pre-migration rows) when querying 'banco'
    const where = account === 'banco'
      ? [{ account: 'banco' }, { account: null as any }]
      : [{ account }];
    // Order by updatedAt first so the most recently saved snapshot always wins,
    // regardless of statement date (BBVA dates can be older than a manual entry).
    return this.repo.findOne({ where, order: { updatedAt: 'DESC', date: 'DESC' } });
  }

  async getAll(): Promise<{ banco: BalanceSnapshot | null; efectivo: BalanceSnapshot | null }> {
    const [banco, efectivo] = await Promise.all([
      this.getCurrent('banco'),
      this.getCurrent('efectivo'),
    ]);
    return { banco, efectivo };
  }

  async set(amount: number, date: string, source = 'manual', account = 'banco', importBatchId?: string): Promise<BalanceSnapshot> {
    const snapshot = this.repo.create({ amount, date, source, account, importBatchId: importBatchId ?? null });
    return this.repo.save(snapshot);
  }

  async getHistory(account?: string): Promise<BalanceSnapshot[]> {
    const where = account ? { account } : {};
    return this.repo.find({ where, order: { date: 'ASC' } });
  }

  // Adjust the latest snapshot for an account by delta (positive = add, negative = subtract)
  async deleteById(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByBatchId(importBatchId: string): Promise<void> {
    await this.repo.delete({ importBatchId } as any);
  }

  async adjust(account: string, deltaARS: number): Promise<void> {
    const current = await this.getCurrent(account);
    if (!current) return; // no snapshot to adjust; user hasn't set a balance yet
    current.amount = Math.max(0, Number(current.amount) + deltaARS);
    await this.repo.save(current);
  }
}
