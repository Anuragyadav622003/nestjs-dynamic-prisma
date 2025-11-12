// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import type { Request, Response } from 'express';
// import express from 'express';

// let server: express.Express;

// export default async function handler(req: Request, res: Response) {
//   if (!server) {
//     const app = await NestFactory.create(AppModule);
    
//     // Apply global validation
//     app.useGlobalPipes(new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//     }));

//     // Enable CORS for your frontend
//     app.enableCors({
//       origin: ['http://localhost:3000', 'https://dataforge-platform-c2tj.vercel.app/'],
//       credentials: true,
//     });

//     // Swagger (optional)
//     const config = new DocumentBuilder()
//       .setTitle('CRUD Platform API')
//       .setDescription('Auto-generated CRUD + RBAC Platform')
//       .setVersion('1.0')
//       .addBearerAuth()
//       .build();
//     const document = SwaggerModule.createDocument(app, config);
//     SwaggerModule.setup('api', app, document);

//     await app.init();
//     server = app.getHttpAdapter().getInstance();
//   }

//   // ✅ Express handler function
//   server(req, res);
// }



// src/vercel.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Server } from 'http';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import express from 'express';
let cachedServer: express.Express;

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'https://dataforge-platform-c2tj.vercel.app',
      ],
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('CRUD Platform API')
      .setDescription('Auto-generated CRUD + RBAC Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }

  return cachedServer(req, res);
}
