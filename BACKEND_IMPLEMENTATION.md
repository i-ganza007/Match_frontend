# Match Backend - Authentication System

## Backend Structure (NestJS + Prisma + PostGIS)

This guide provides a complete implementation of the authentication system for the Match app.

## Prerequisites

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

## 1. Prisma Schema with PostGIS

### Update your `schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
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
  latitude      Float?
  longitude     Float?
  location      Unsupported("geography(Point, 4326)")?

  @@index([phone_number])
  @@index([email])
}
```

## 2. Auth Module Structure

### File Structure:
```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── signup.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── users/
│   ├── users.service.ts
│   └── users.module.ts
└── prisma/
    ├── prisma.service.ts
    └── prisma.module.ts
```

## 3. DTOs (Data Transfer Objects)

### `src/auth/dto/signup.dto.ts`:

```typescript
import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, MinLength, Matches } from 'class-validator';
import { Gender } from '@prisma/client';

export class SignupDto {
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

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
```

### `src/auth/dto/login.dto.ts`:

```typescript
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // phone_number or email

  @IsString()
  password: string;
}
```

## 4. Prisma Service

### `src/prisma/prisma.service.ts`:

```typescript
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

  // Helper method to create geography point
  async createUserWithLocation(data: any) {
    const { latitude, longitude, ...userData } = data;

    return this.$queryRaw`
      INSERT INTO "User" (
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
  }
}
```

### `src/prisma/prisma.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 5. Users Service

### `src/users/users.service.ts`:

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone_number: data.phone_number },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with location using raw SQL
    const result = await this.prisma.createUserWithLocation({
      ...data,
      password: hashedPassword,
    });

    // Return user without password
    const user = result[0];
    delete user.password;
    return user;
  }

  async findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { phone_number: identifier },
          { email: identifier },
        ],
      },
    });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        sex: true,
        phone_number: true,
        email: true,
        profile_url: true,
        district: true,
        sector: true,
        village: true,
        cell: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        lastActive: true,
      },
    });
  }

  async updateLastActive(userId: string) {
    return this.prisma.user.update({
      where: { userId },
      data: { lastActive: new Date() },
    });
  }
}
```

### `src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## 6. JWT Strategy

### `src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    // Update last active
    await this.usersService.updateLastActive(user.userId);

    return user;
  }
}
```

### `src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

## 7. Auth Service

### `src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Create user
    const user = await this.usersService.create(signupDto);

    // Generate JWT token
    const payload = { sub: user.userId, phone: user.phone_number };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.usersService.findByIdentifier(loginDto.identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.userId, phone: user.phone_number };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
```

## 8. Auth Controller

### `src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

## 9. Auth Module

### `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { 
        expiresIn: '30d' // Token expires in 30 days
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

## 10. App Module

### `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

## 11. Environment Variables

### `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/match_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
```

## 12. Enable PostGIS Extension

Run this SQL in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 13. Prisma Migration

```bash
# Generate migration
npx prisma migrate dev --name add-location-fields

# Generate Prisma Client
npx prisma generate
```

## 14. Main.ts Setup

### `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
```

## 15. Testing the API

### Signup Request:

```bash
curl -X POST https://match-backend-jz3n.onrender.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "sex": "MALE",
    "password": "password123",
    "phone_number": "0781234567",
    "email": "john@example.com",
    "district": "Kigali",
    "sector": "Kimironko",
    "cell": "Biryogo",
    "village": "Ubumwe",
    "latitude": -1.9536,
    "longitude": 30.0606
  }'
```

### Login Request:

```bash
curl -X POST https://match-backend-jz3n.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "0781234567",
    "password": "password123"
  }'
```

### Get Profile (Protected Route):

```bash
curl -X GET https://match-backend-jz3n.onrender.com/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 16. Query Users by Location (Bonus)

Add this method to `UsersService`:

```typescript
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
    FROM "User"
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusKm * 1000}
    )
    ORDER BY distance_km;
  `;
}
```

## Security Best Practices

1. **Never store plain passwords** - Always use bcrypt with salt rounds >= 10
2. **JWT Secret** - Use a strong, random secret in production (32+ characters)
3. **Token Expiration** - Balance security vs UX (30 days for mobile apps is common)
4. **HTTPS Only** - Always use HTTPS in production
5. **Rate Limiting** - Add rate limiting to auth endpoints
6. **Input Validation** - Use class-validator for all DTOs
7. **SQL Injection** - Prisma protects against this, but be careful with raw queries

## Deployment Notes

1. Ensure PostGIS extension is enabled on your production database
2. Set strong JWT_SECRET environment variable
3. Enable CORS only for your frontend domain
4. Use environment variables for all sensitive data
5. Consider adding refresh tokens for better security

---

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /auth/signup | No | Create new account |
| POST | /auth/login | No | Login with credentials |
| GET | /auth/me | Yes | Get current user profile |

---

This implementation provides enterprise-grade security with:
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ PostGIS location storage
- ✅ Input validation
- ✅ Proper error handling
- ✅ Token expiration
- ✅ Protected routes
