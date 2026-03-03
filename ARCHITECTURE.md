# Authentication System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                              │
│                     (React Native/Expo)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │ Signup Screen│         │ Login Screen │                    │
│  │              │         │              │                    │
│  │ - Name       │         │ - Phone/Email│                    │
│  │ - Phone      │         │ - Password   │                    │
│  │ - Password   │         │              │                    │
│  │ - Location   │         │ [ Biometric ]│                    │
│  │ - Address    │         │   Button     │                    │
│  └──────┬───────┘         └──────┬───────┘                    │
│         │                        │                             │
│         └────────┬───────────────┘                             │
│                  │                                             │
│                  ▼                                             │
│         ┌─────────────────┐                                   │
│         │  Auth Service   │                                   │
│         │  (services/     │                                   │
│         │   auth.ts)      │                                   │
│         └────────┬────────┘                                   │
│                  │                                             │
│         ┌────────┴────────┐                                   │
│         │                 │                                   │
│         ▼                 ▼                                   │
│  ┌─────────────┐   ┌─────────────┐                          │
│  │  Location   │   │  Biometric  │                          │
│  │  Service    │   │  Service    │                          │
│  └──────┬──────┘   └──────┬──────┘                          │
│         │                  │                                 │
│         │  ┌───────────────┘                                │
│         │  │                                                 │
│         ▼  ▼                                                 │
│  ┌──────────────────┐                                       │
│  │ Secure Storage   │                                       │
│  │ (SecureStore)    │                                       │
│  │                  │                                       │
│  │ - JWT Token      │                                       │
│  │ - User Data      │                                       │
│  │ - Biometric Flag │                                       │
│  └──────────────────┘                                       │
│                                                              │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ HTTPS
                   │ Bearer Token
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│                    (NestJS + Prisma)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌────────────────────────────────┐                     │
│         │      Auth Controller           │                     │
│         │                                │                     │
│         │  POST /auth/signup             │                     │
│         │  POST /auth/login              │                     │
│         │  GET  /auth/me  [Protected]    │                     │
│         └──────────┬─────────────────────┘                     │
│                    │                                           │
│                    ▼                                           │
│         ┌────────────────────────────────┐                     │
│         │       Auth Service             │                     │
│         │                                │                     │
│         │  - Hash passwords (bcrypt)     │                     │
│         │  - Generate JWT tokens         │                     │
│         │  - Validate credentials        │                     │
│         └──────────┬─────────────────────┘                     │
│                    │                                           │
│         ┌──────────┴──────────┐                               │
│         │                     │                               │
│         ▼                     ▼                               │
│  ┌────────────┐      ┌──────────────┐                        │
│  │ JWT        │      │ Users        │                        │
│  │ Strategy   │      │ Service      │                        │
│  │            │      │              │                        │
│  │ - Validate │      │ - Create     │                        │
│  │   Token    │      │ - Find       │                        │
│  │ - Extract  │      │ - Update     │                        │
│  │   User     │      │              │                        │
│  └────────────┘      └──────┬───────┘                        │
│                             │                                 │
│                             ▼                                 │
│                    ┌──────────────────┐                       │
│                    │  Prisma Client   │                       │
│                    │                  │                       │
│                    │  - Query Builder │                       │
│                    │  - Type Safety   │                       │
│                    │  - Migrations    │                       │
│                    └────────┬─────────┘                       │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              │ SQL
                              │
                              ▼
             ┌────────────────────────────────┐
             │   PostgreSQL + PostGIS         │
             │                                │
             │  ┌──────────────────────────┐  │
             │  │      User Table          │  │
             │  │                          │  │
             │  │  userId (UUID)           │  │
             │  │  name                    │  │
             │  │  sex                     │  │
             │  │  password (hashed)       │  │
             │  │  phone_number (unique)   │  │
             │  │  email (unique)          │  │
             │  │  district, sector, etc   │  │
             │  │  latitude, longitude     │  │
             │  │  location (PostGIS Point)│  │
             │  │  createdAt               │  │
             │  │  lastActive              │  │
             │  └──────────────────────────┘  │
             └────────────────────────────────┘
```

## Authentication Flow Sequence

### 1. Signup Flow

```
User                App              Location        Backend         Database
  │                  │                   │              │               │
  │ Enter Details    │                   │              │               │
  ├─────────────────>│                   │              │               │
  │                  │                   │              │               │
  │                  │ Request Location  │              │               │
  │                  ├──────────────────>│              │               │
  │                  │                   │              │               │
  │                  │ GPS Coordinates   │              │               │
  │                  │<──────────────────┤              │               │
  │                  │                   │              │               │
  │                  │ POST /auth/signup │              │               │
  │                  │ (with lat/long)   │              │               │
  │                  ├──────────────────────────────────>│               │
  │                  │                   │              │               │
  │                  │                   │              │ Hash Password │
  │                  │                   │              │ Create Point  │
  │                  │                   │              │ INSERT User   │
  │                  │                   │              ├──────────────>│
  │                  │                   │              │               │
  │                  │                   │              │   User Created│
  │                  │                   │              │<──────────────┤
  │                  │                   │              │               │
  │                  │                   │  JWT Token   │               │
  │                  │<──────────────────────────────────┤               │
  │                  │                   │              │               │
  │                  │ Store Token       │              │               │
  │                  │ (SecureStore)     │              │               │
  │                  │                   │              │               │
  │ Enable Biometric?│                   │              │               │
  │<─────────────────┤                   │              │               │
  │                  │                   │              │               │
  │ Yes / No         │                   │              │               │
  ├─────────────────>│                   │              │               │
  │                  │                   │              │               │
  │                  │ Set Biometric Flag│              │               │
  │                  │ (if yes)          │              │               │
  │                  │                   │              │               │
  │ Navigate Home    │                   │              │               │
  │<─────────────────┤                   │              │               │
```

### 2. Traditional Login Flow

```
User                App              Backend         Database
  │                  │                   │              │
  │ Enter Credentials│                   │              │
  ├─────────────────>│                   │              │
  │                  │                   │              │
  │                  │ POST /auth/login  │              │
  │                  ├──────────────────>│              │
  │                  │                   │              │
  │                  │                   │ Find User    │
  │                  │                   ├─────────────>│
  │                  │                   │              │
  │                  │                   │ User Data    │
  │                  │                   │<─────────────┤
  │                  │                   │              │
  │                  │                   │ Verify Pass  │
  │                  │                   │ (bcrypt)     │
  │                  │                   │              │
  │                  │     JWT Token     │              │
  │                  │<──────────────────┤              │
  │                  │                   │              │
  │                  │ Store Token       │              │
  │                  │ Store User        │              │
  │                  │ (SecureStore)     │              │
  │                  │                   │              │
  │ Navigate Home    │                   │              │
  │<─────────────────┤                   │              │
```

### 3. Biometric Login Flow (Offline Capable)

```
User                App              Biometric       SecureStore      Backend
  │                  │                   │               │               │
  │ Tap Biometric    │                   │               │               │
  ├─────────────────>│                   │               │               │
  │                  │                   │               │               │
  │                  │ Check has logged  │               │               │
  │                  │ in before?        │               │               │
  │                  ├──────────────────────────────────>│               │
  │                  │                   │               │               │
  │                  │                   │         Yes / No              │
  │                  │<──────────────────────────────────┤               │
  │                  │                   │               │               │
  │                  │ Prompt Biometric  │               │               │
  │                  ├──────────────────>│               │               │
  │                  │                   │               │               │
  │ Scan Fingerprint │                   │               │               │
  │──────────────────────────────────────>│               │               │
  │                  │                   │               │               │
  │                  │   Auth Success    │               │               │
  │                  │<──────────────────┤               │               │
  │                  │                   │               │               │
  │                  │ Get Token         │               │               │
  │                  ├──────────────────────────────────>│               │
  │                  │                   │               │               │
  │                  │                   │         JWT Token             │
  │                  │<──────────────────────────────────┤               │
  │                  │                   │               │               │
  │                  │ Online?  ─────────────────────────────────────>   │
  │                  │                   │               │  Validate     │
  │                  │ (Optional if      │               │  Token        │
  │                  │  internet)        │               │               │
  │                  │<──────────────────────────────────────────────────┤
  │                  │                   │               │               │
  │ Navigate Home    │                   │               │               │
  │<─────────────────┤                   │               │               │
  │ (Works Offline!) │                   │               │               │
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│             Application Layer                   │
│                                                 │
│  • Input Validation (Frontend)                 │
│  • Form Validation                             │
│  • Type Checking (TypeScript)                  │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│           Transport Layer                       │
│                                                 │
│  • HTTPS/TLS Encryption                        │
│  • Certificate Validation                      │
│  • Request Signing                             │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│         Authentication Layer                    │
│                                                 │
│  • JWT Token Validation                        │
│  • Bearer Token in Headers                     │
│  • Token Expiration (30 days)                  │
│  • Biometric Authentication                    │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│          Validation Layer                       │
│                                                 │
│  • DTO Validation (class-validator)            │
│  • Type Checking (NestJS)                      │
│  • Business Logic Validation                   │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│            Storage Layer                        │
│                                                 │
│  • Password Hashing (bcrypt, 10 rounds)        │
│  • Secure Token Storage (SecureStore)          │
│  • Hardware-backed Encryption                  │
│  • Database Encryption at Rest                 │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│           Database Layer                        │
│                                                 │
│  • Unique Constraints (phone, email)           │
│  • Index Optimization                          │
│  • PostGIS Spatial Queries                     │
│  • Prepared Statements (SQL Injection)         │
└─────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Components (UI)                                         │
│  ↓                                                       │
│  Services (Business Logic)                               │
│  ↓                                                       │
│  SecureStore (Local Persistence)                         │
│  ↓                                                       │
│  API Client (HTTP Communication)                         │
│                                                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ REST API
                   │ JSON
                   │
┌──────────────────┴───────────────────────────────────────┐
│                    BACKEND LAYER                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Controllers (Route Handlers)                            │
│  ↓                                                       │
│  Guards (Authentication)                                 │
│  ↓                                                       │
│  Services (Business Logic)                               │
│  ↓                                                       │
│  Prisma Client (ORM)                                     │
│  ↓                                                       │
│  Database (PostgreSQL + PostGIS)                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Organization

```
Match_frontend/
├── services/              # Business Logic Layer
│   ├── api.ts            # HTTP Client + Interceptors
│   ├── auth.ts           # Auth Operations
│   ├── biometric.ts      # Biometric Auth
│   ├── location.ts       # GPS Services
│   └── secureStorage.ts  # Encrypted Storage
│
├── app/                   # UI Layer
│   ├── signup.tsx        # Registration
│   └── (tabs)/
│       └── login.tsx     # Authentication
│
├── AUTHENTICATION_GUIDE.md    # Detailed Documentation
├── BACKEND_IMPLEMENTATION.md  # Backend Code
├── QUICK_START.md            # Quick Reference
└── ARCHITECTURE.md           # This File
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│           Frontend Stack                    │
├─────────────────────────────────────────────┤
│  • React Native 0.81.5                     │
│  • Expo SDK ~54                            │
│  • TypeScript                              │
│  • Expo Router (Navigation)                │
│  • Expo SecureStore (Storage)              │
│  • Expo Local Authentication (Biometric)   │
│  • Expo Location (GPS)                     │
│  • Axios (HTTP Client)                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           Backend Stack                     │
├─────────────────────────────────────────────┤
│  • NestJS (Framework)                      │
│  • Prisma (ORM)                            │
│  • PostgreSQL (Database)                   │
│  • PostGIS (Location Extension)            │
│  • JWT (Authentication)                    │
│  • Bcrypt (Password Hashing)               │
│  • Passport (Strategy)                     │
│  • Class Validator (Validation)            │
└─────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│                 Mobile Devices                     │
│                                                    │
│  ┌──────────────┐        ┌──────────────┐        │
│  │     iOS      │        │   Android    │        │
│  │   App Store  │        │  Play Store  │        │
│  └──────────────┘        └──────────────┘        │
└──────────────┬────────────────┬────────────────────┘
               │                │
               │   HTTPS/TLS    │
               │                │
┌──────────────┴────────────────┴────────────────────┐
│              Cloud Platform                        │
│           (Render / AWS / etc)                     │
│                                                    │
│  ┌───────────────────────────────────────────┐    │
│  │         Load Balancer / CDN              │    │
│  └─────────────────┬─────────────────────────┘    │
│                    │                               │
│  ┌─────────────────┴─────────────────────────┐    │
│  │         NestJS Backend Server            │    │
│  │                                          │    │
│  │  • API Endpoints                         │    │
│  │  • JWT Validation                        │    │
│  │  • Business Logic                        │    │
│  └─────────────────┬─────────────────────────┘    │
│                    │                               │
│  ┌─────────────────┴─────────────────────────┐    │
│  │    PostgreSQL + PostGIS Database         │    │
│  │                                          │    │
│  │  • User Data                             │    │
│  │  • Spatial Queries                       │    │
│  │  • Encrypted at Rest                     │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Biometric AFTER First Login**
- Ensures user exists in database
- Provides fallback to password login
- Allows offline authentication

### 2. **JWT with Long Expiration (30 days)**
- Reduces login friction for mobile users
- Suitable for trusted personal devices
- Can be revoked server-side if needed

### 3. **PostGIS for Location**
- Efficient spatial queries
- Find nearby users/animals
- Industry-standard for geospatial data

### 4. **Expo SecureStore**
- Hardware-backed encryption
- OS-level security
- Automatic key management

### 5. **Offline-First Design**
- Mobile users often have spotty connectivity
- Biometric works without internet
- Graceful degradation

---

## Next Steps for Enhancement

1. **Refresh Tokens** - Implement token rotation
2. **Social Login** - Google/Facebook OAuth
3. **2FA** - SMS or authenticator app
4. **Password Reset** - Email/SMS verification
5. **Session Management** - Multiple device support
6. **Rate Limiting** - Prevent brute force attacks
7. **Analytics** - Track auth events
8. **Push Notifications** - Alert on suspicious activity

---

This architecture provides a solid foundation for a production-ready mobile authentication system with modern security practices.
