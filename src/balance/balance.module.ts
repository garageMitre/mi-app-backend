import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceSnapshot } from './balance.entity';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BalanceSnapshot])],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
