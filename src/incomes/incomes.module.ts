import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './income.entity';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [TypeOrmModule.forFeature([Income]), BalanceModule],
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService],
})
export class IncomesModule {}
