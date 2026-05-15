import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { CategoriesModule } from '../categories/categories.module';
import { ExchangeRateService } from './exchange-rate.service';
import { BalanceModule } from '../balance/balance.module';
import { ExpensesRecurringCronService } from './expenses-recurring-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Expense]), CategoriesModule, BalanceModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExchangeRateService, ExpensesRecurringCronService],
})
export class ExpensesModule {}
