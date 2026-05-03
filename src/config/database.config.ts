import { registerAs } from '@nestjs/config';
import { type TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  () =>
    ({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST || '',
      port: parseInt(process.env.POSTGRES_PORT as string, 10) || 5430,
      database: process.env.POSTGRES_NAME || '',
      username: process.env.POSTGRES_USER || '',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
      synchronize: true,
      logging: false,
      migrations: [`${__dirname}/../../db/migrations/*{.ts,.js}`],
      migrationsTableName: 'migrations',
    }) as TypeOrmModuleOptions,
);
