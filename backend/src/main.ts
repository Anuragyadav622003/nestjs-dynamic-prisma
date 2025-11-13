// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  
  
  app.enableCors();



  
 
  const config = new DocumentBuilder()
    .setTitle('CRUD Platform API')
    .setDescription('Auto-generated CRUD + RBAC Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();


// // src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // CORS configuration
//   const allowedOrigins = [
//     'https://dataforge-platform-c2tj.vercel.app',
//     'http://localhost:3000',
//     'http://localhost:3001'
//   ];

//   app.enableCors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps, curl, postman)
//       if (!origin) return callback(null, true);
      
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         console.log('Blocked by CORS:', origin);
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//     allowedHeaders: [
//       'Content-Type', 
//       'Authorization', 
//       'X-Requested-With',
//       'Accept',
//       'Origin',
//       'Access-Control-Request-Method',
//       'Access-Control-Request-Headers'
//     ],
//     exposedHeaders: ['Authorization', 'Set-Cookie'],
//     preflightContinue: false,
//     optionsSuccessStatus: 204
//   });

//   await app.listen(process.env.PORT || 3001);
// }
// bootstrap();
