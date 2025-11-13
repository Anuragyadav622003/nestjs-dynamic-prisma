// // // backend/src/main.ts
// // import { NestFactory } from '@nestjs/core';
// // import { ValidationPipe } from '@nestjs/common';
// // import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// // import { AppModule } from './app.module';

// // async function bootstrap() {
// //   const app = await NestFactory.create(AppModule);
  
// //   app.useGlobalPipes(new ValidationPipe({
// //     whitelist: true,
// //     forbidNonWhitelisted: true,
// //   }));
  
// //   app.enableCors({
// //     origin: ['https://dataforge-platform-c2tj.vercel.app','http://localhost:3001' ],
// //     credentials: true,
// //   });
 
// //   const config = new DocumentBuilder()
// //     .setTitle('CRUD Platform API')
// //     .setDescription('Auto-generated CRUD + RBAC Platform')
// //     .setVersion('1.0')
// //     .addBearerAuth()
// //     .build();
// //   const document = SwaggerModule.createDocument(app, config);
// //   SwaggerModule.setup('api', app, document);

// //   const port = process.env.PORT || 3001;
// //   await app.listen(port);
// //   console.log(`🚀 Server running on http://localhost:${port}`);
// //   console.log(`📚 API Documentation: http://localhost:${port}/api`);
// // }

// // bootstrap();


// // backend/src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
  
//   app.useGlobalPipes(new ValidationPipe({
//     whitelist: true,
//     forbidNonWhitelisted: true,
//   }));

//   // Enhanced CORS configuration
//   const allowedOrigins = [
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'https://dataforge-platform-c2tj.vercel.app',
//     // Add your custom domain if you have one
//     'https://your-custom-domain.vercel.app',
//   ];

//   // Dynamic origin for Vercel preview deployments
//   const vercelPreviewRegex = /https:\/\/dataforge-platform-.*-c2tj\.vercel\.app/;
  
//   app.enableCors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps, curl requests)
//       if (!origin) return callback(null, true);
      
//       // Check against allowed origins
//       if (allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
//         return callback(null, true);
//       }
      
//       // Block the request
//       return callback(new Error('Not allowed by CORS'));
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: [
//       'Origin',
//       'X-Requested-With',
//       'Content-Type',
//       'Accept',
//       'Authorization',
//       'X-CSRF-Token',
//     ],
//   });

//   const config = new DocumentBuilder()
//     .setTitle('CRUD Platform API')
//     .setDescription('Auto-generated CRUD + RBAC Platform')
//     .setVersion('1.0')
//     .addBearerAuth()
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);

//   const port = process.env.PORT || 3001;
//   await app.listen(port);
//   console.log(`🚀 Server running on http://localhost:${port}`);
//   console.log(`📚 API Documentation: http://localhost:${port}/api`);
// }

// bootstrap();


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
    transform: true, // Add this to transform payloads to DTO instances
  }));

  // Enhanced CORS configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002', // Common Next.js dev port
    'https://dataforge-platform-c2tj.vercel.app',
    'https://dataforge-platform.vercel.app', // Your backend itself
  ];

  // Improved Vercel preview deployment regex
  const vercelPreviewRegex = /https:\/\/.*-dataforge-platform.*\.vercel\.app/;
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests, server-side requests)
      if (!origin) return callback(null, true);
      
      // Check against allowed origins
      if (allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
        console.log('✅ CORS allowed for origin:', origin);
        return callback(null, true);
      }
      
      // Log blocked origins for debugging
      console.log('❌ CORS blocked for origin:', origin);
      return callback(new Error(`Not allowed by CORS. Origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'Access-Control-Allow-Headers',
      'Access-Control-Request-Headers',
      'Access-Control-Allow-Origin',
    ],
    exposedHeaders: [
      'Authorization',
      'Set-Cookie',
      'Access-Control-Allow-Origin',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add global prefix if needed
  app.setGlobalPrefix('api'); // This makes all routes start with /api

  const config = new DocumentBuilder()
    .setTitle('CRUD Platform API')
    .setDescription('Auto-generated CRUD + RBAC Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Changed from 'api' to 'docs' to avoid conflict

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
  console.log(`🌐 CORS enabled for origins:`, allowedOrigins);
}

bootstrap();