import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('NestApplication');
  const configService = app.get(ConfigService);

  
  const allowedOrigins = configService.get<string>('app.allowedOrigins') || '*';
  app.enableCors({
    origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(',').map(o => o.trim()),
    methods: 'GET,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = configService.get('app.port');
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
