import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseType, MoneyType } from './expense.entity';
import { ExpensesService } from './expenses.service';

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

@Injectable()
export class ExpensesRecurringCronService {
  private readonly logger = new Logger(ExpensesRecurringCronService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly expensesService: ExpensesService,
  ) {}

  @Cron('0 0 * * *', { timeZone: ARGENTINA_TZ })
  async handleRecurringExpenses() {
    const todayArgentina = new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const dayOfMonth = parseInt(todayArgentina.slice(8, 10), 10);

    this.logger.log(
      `CRON START | Processing recurring expenses | date=${todayArgentina} day=${dayOfMonth}`,
    );

    const templates = await this.expenseRepo.find({
      where: { isRecurring: true, recurringDay: dayOfMonth },
    });

    if (templates.length === 0) {
      this.logger.log(`CRON END | No recurring expenses for day ${dayOfMonth}`);
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const template of templates) {
      const alreadyExists = await this.expenseRepo.findOne({
        where: {
          description: template.description,
          categoryId: template.categoryId,
          date: todayArgentina,
          isRecurring: false,
        },
      });

      if (alreadyExists) {
        this.logger.warn(
          `SKIP | Already created today | template.id=${template.id} description="${template.description}"`,
        );
        skipped++;
        continue;
      }

      try {
        await this.expensesService.create({
          description: template.description,
          amount: template.amount,
          date: todayArgentina,
          type: ExpenseType.FIXED,
          moneyType: template.moneyType as MoneyType,
          categoryId: template.categoryId,
          fromAccount: template.fromAccount ?? 'efectivo',
          isRecurring: false,
        });
        this.logger.log(
          `CREATED | id=${template.id} description="${template.description}" amount=${template.amount}`,
        );
        created++;
      } catch (error) {
        this.logger.error(
          `ERROR | Failed to create recurring expense | template.id=${template.id} | ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `CRON END | created=${created} skipped=${skipped} total_templates=${templates.length}`,
    );
  }
}
