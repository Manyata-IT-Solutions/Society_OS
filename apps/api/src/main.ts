import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ConfigService } from './modules/config/config.service.js';
import { LoggerService } from './modules/logger/logger.service.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  app.useLogger(logger);

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: configService.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: configService.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-correlation-id',
      'x-organization-id',
      'x-community-id',
    ],
    credentials: true,
  });

  // Global Prefix & API Versioning
  app.setGlobalPrefix(configService.apiPrefix);

  // Global Exception Filter & Transform Interceptor
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Strict Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  if (configService.isSwaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Community OS - Platform API')
      .setDescription(
        'Enterprise Residential Community ERP, Facility Management & Multi-Society Platform REST API',
      )
      .setVersion(configService.appVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Access Token',
        },
        'JWT-Auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-organization-id',
          in: 'header',
          description: 'Organization Tenant Scope ID',
        },
        'Organization-Header',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-community-id',
          in: 'header',
          description: 'Community Tenant Scope ID',
        },
        'Community-Header',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    logger.log(`Swagger OpenAPI documentation available at /api/docs`, 'Bootstrap');
  }

  app.enableShutdownHooks();

  const port = configService.port;
  await app.listen(port);

  logger.log(
    `🚀 Community OS API is running on: http://localhost:${port}/${configService.apiPrefix} in [${configService.nodeEnv}] mode`,
    'Bootstrap',
  );
}

bootstrap();
