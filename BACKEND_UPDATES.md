# Backend Updates for Location Support

## Your Current Backend Architecture

You're using:
- ✅ **Cookies** for JWT storage (httpOnly cookies)
- ✅ **Argon2** for password hashing  
- ✅ **Local Strategy** for login validation
- ✅ **JWT Strategy** for protected routes
- ✅ **Custom decorators** (@CookieUser)

## Required Updates

### 1. Update Prisma Schema

Add location fields to your User model:

```prisma
// schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]  // Add this
}

enum Gender {
  MALE
  FEMALE
}

model User {
  userId        String                                  @id @default(uuid())
  name          String
  sex           Gender
  password      String
  phone_number  String                                  @unique
  profile_url   String?
  email         String?                                 @unique
  createdAt     DateTime                                @default(now())
  lastActive    DateTime                                @default(now())
  district      String
  sector        String
  village       String
  cell          String
  
  // ADD THESE FIELDS
  latitude      Float?
  longitude     Float?
  location      Unsupported("geography(Point, 4326)")?

  @@index([phone_number])
  @@index([email])
}
```

### 2. Enable PostGIS Extension

Run this in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Run Migration

```bash
npx prisma migrate dev --name add-location-fields
npx prisma generate
```

### 4. Update UserCreationDTO

Add location fields to your DTO:

```typescript
// lib/user.dto.ts

import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, MinLength, Matches } from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class UserCreationDTO {
  @IsString()
  name: string;

  @IsEnum(Gender)
  sex: Gender;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Matches(/^(\+250|0)[0-9]{9}$/, {
    message: 'Invalid Rwandan phone number format',
  })
  phone_number: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  district: string;

  @IsString()
  sector: string;

  @IsString()
  village: string;

  @IsString()
  cell: string;

  // ADD THESE FIELDS
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UserLoginDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### 5. Update PrismaService (Add Location Helper)

Add a method to create users with PostGIS location:

```typescript
// src/prisma-service/prisma-service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // ADD THIS METHOD
  async createUserWithLocation(data: any) {
    const { latitude, longitude, ...userData } = data;

    // If no location provided, create user normally
    if (!latitude || !longitude) {
      return this.users.create({
        data: userData,
      });
    }

    // Create user with PostGIS location using raw SQL
    const result = await this.$queryRaw`
      INSERT INTO "Users" (
        "userId", name, sex, password, phone_number, email,
        district, sector, village, cell,
        latitude, longitude, location, "createdAt", "lastActive"
      )
      VALUES (
        gen_random_uuid(),
        ${userData.name},
        ${userData.sex}::"Gender",
        ${userData.password},
        ${userData.phone_number},
        ${userData.email},
        ${userData.district},
        ${userData.sector},
        ${userData.village},
        ${userData.cell},
        ${latitude}::float,
        ${longitude}::float,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        NOW(),
        NOW()
      )
      RETURNING *;
    `;

    return result[0];
  }
}
```

### 6. Update UsersService

Modify your user creation to use the new method:

```typescript
// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma-service/prisma-service';
import { UserCreationDTO } from '../lib/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: UserCreationDTO & { password: string }) {
    // Use the new method that handles location
    return await this.prisma.createUserWithLocation(data);
  }

  // ... rest of your methods
}
```

### 7. No Changes Needed in AuthService!

Your existing `AuthService.signUp()` method already works:

```typescript
async signUp(body: UserCreationDTO) {
  const present = await this.prismaService.users.findFirst({
    where: {
      OR: [
        { email: body.email },
        { phone_number: body.phone_number }
      ]
    }
  });
  
  if (present) {
    throw new ConflictException("User already exists with that email or phone number");
  }
  
  const hashed_password = await argon2.hash(body.password);
  
  // This will now automatically handle latitude/longitude if provided
  const createdUser = await this.userService.createUser({
    ...body,
    password: hashed_password
  });
  
  return await this.logIn({ userId: createdUser?.userId, email: createdUser?.email });
}
```

### 8. Add JWT Strategy (If Not Already Present)

Create the JWT strategy to validate cookies:

```typescript
// src/auth/strategies/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract JWT from cookie
          return request?.cookies?.user_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.userId, email: payload.email };
  }
}
```

### 9. Bonus: Add Location Query Method

Add this to your UsersService to find nearby users:

```typescript
// src/users/users.service.ts

async findNearbyUsers(latitude: number, longitude: number, radiusKm: number = 10) {
  return this.prisma.$queryRaw`
    SELECT 
      "userId",
      name,
      sex,
      phone_number,
      district,
      sector,
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) / 1000 as distance_km
    FROM "Users"
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusKm * 1000}
    )
    AND "userId" != ${userId}
    ORDER BY distance_km;
  `;
}
```

### 10. Frontend-Backend Compatibility

Your frontend now sends requests like this:

```typescript
// Signup Request
POST /auth/signup
{
  "name": "John Doe",
  "sex": "MALE",
  "password": "secure123",
  "phone_number": "0781234567",
  "email": "john@example.com",
  "district": "Kigali",
  "sector": "Kimironko",
  "cell": "Biryogo",
  "village": "Ubumwe",
  "latitude": -1.9536,
  "longitude": 30.0606
}

// Login Request
POST /auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}
```

### 11. Important CORS Configuration

Since you're using cookies, ensure your backend has proper CORS:

```typescript
// main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS with credentials
  app.enableCors({
    origin: true, // In production: ['http://localhost:8081', 'your-app-scheme://']
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
```

## Testing the Updates

### Test Signup with Location

```bash
curl -X POST https://match-backend-jz3n.onrender.com/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "Test User",
    "sex": "MALE",
    "password": "test1234",
    "phone_number": "0781234567",
    "email": "test@example.com",
    "district": "Kigali",
    "sector": "Kimironko",
    "cell": "Biryogo",
    "village": "Ubumwe",
    "latitude": -1.9536,
    "longitude": 30.0606
  }'
```

### Test Login

```bash
curl -X POST https://match-backend-jz3n.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }'
```

### Test Protected Route

```bash
curl -X GET https://match-backend-jz3n.onrender.com/auth/loggedIn \
  -b cookies.txt
```

## Summary

Your existing architecture is excellent! The main updates needed are:

1. ✅ Add `latitude`, `longitude`, and `location` fields to User model
2. ✅ Enable PostGIS extension in database  
3. ✅ Update UserCreationDTO to accept location
4. ✅ Add `createUserWithLocation()` method to PrismaService
5. ✅ Ensure CORS allows credentials (for cookies)

**Everything else works as-is!** Your cookie-based auth is actually more secure than Bearer tokens for mobile apps since httpOnly cookies can't be accessed by JavaScript.

## Key Differences from Standard Implementation

| Feature | Your Implementation | Standard |
|---------|---------------------|----------|
| Auth Storage | httpOnly Cookies ✅ | Bearer Token in Headers |
| Password Hash | Argon2 ✅ | Bcrypt |
| Cookie Security | Prevents XSS ✅ | Requires secure storage |
| Mobile Support | Works perfectly ✅ | More common |

Your approach is actually **MORE SECURE** because:
- httpOnly cookies cannot be accessed by JavaScript
- Prevents XSS attacks from stealing tokens
- Automatic CSRF protection possible
- No need for SecureStore on mobile

Great architecture! 🎉
