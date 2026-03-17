# 기술 스택 선정

## 프론트엔드

| 카테고리 | 기술 | 선정 이유 |
|----------|------|-----------|
| 프레임워크 | **Next.js 14 (App Router)** | SSR/SSG 지원, 파일 기반 라우팅, API Routes, 이미지 최적화 내장 |
| UI 라이브러리 | **React 18** | Next.js 기본, 컴포넌트 기반 개발, 풍부한 생태계 |
| 스타일링 | **Tailwind CSS** | 유틸리티 기반 빠른 스타일링, 반응형 디자인 용이 |
| UI 컴포넌트 | **shadcn/ui** | Radix UI 기반 접근성, Tailwind 호환, 커스터마이징 용이 |
| 상태관리 | **TanStack Query (React Query)** | 서버 상태 관리, 캐싱, 낙관적 업데이트 |
| 폼 관리 | **React Hook Form + Zod** | 타입 안전 폼 검증, 성능 최적화 |
| 아이콘 | **Lucide React** | shadcn/ui 기본 아이콘, 경량 |

## 백엔드

| 카테고리 | 기술 | 선정 이유 |
|----------|------|-----------|
| 런타임 | **Next.js API Routes (Route Handlers)** | 프론트엔드와 동일 프로젝트, 배포 단순화 |
| ORM | **Prisma** | 타입 안전 쿼리, 마이그레이션 관리, 직관적 스키마 정의 |
| 인증 | **NextAuth.js (Auth.js v5)** | Next.js 통합, JWT/세션 관리, 확장 가능 |
| 검증 | **Zod** | 런타임 타입 검증, TypeScript 통합 |

## 데이터베이스

| 카테고리 | 기술 | 선정 이유 |
|----------|------|-----------|
| 주 데이터베이스 | **PostgreSQL** | 관계형 데이터 모델 적합, 성숙한 생태계, JSON 지원 |
| 호스팅 | **Supabase (또는 Neon)** | 관리형 PostgreSQL, 무료 티어 가용 |

## 파일 스토리지

| 카테고리 | 기술 | 선정 이유 |
|----------|------|-----------|
| 이미지 저장소 | **AWS S3 (또는 Cloudflare R2)** | 확장 가능, 비용 효율적, CDN 연동 |
| 이미지 최적화 | **Next.js Image 컴포넌트** | 자동 리사이징, WebP 변환, lazy loading |
| 업로드 | **presigned URL 방식** | 서버 부하 감소, 대용량 파일 직접 업로드 |

## 인프라 / 배포

| 카테고리 | 기술 | 선정 이유 |
|----------|------|-----------|
| 배포 | **Vercel** | Next.js 최적 배포 환경, 자동 CI/CD |
| CDN | **Vercel Edge Network** | 전역 CDN 기본 제공 |

## 개발 도구

| 카테고리 | 기술 |
|----------|------|
| 언어 | TypeScript 5.x |
| 패키지 매니저 | pnpm |
| 린팅 | ESLint + Prettier |
| 테스트 | Vitest + React Testing Library + Playwright (E2E) |
| Git 훅 | Husky + lint-staged |

## 프로젝트 구조 (개요)

```
photogram/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── (auth)/             # 인증 관련 페이지 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/             # 메인 레이아웃 그룹
│   │   │   ├── feed/
│   │   │   ├── profile/[username]/
│   │   │   ├── post/[id]/
│   │   │   ├── notifications/
│   │   │   └── upload/
│   │   ├── api/                # API Route Handlers
│   │   │   ├── auth/
│   │   │   ├── posts/
│   │   │   ├── users/
│   │   │   ├── comments/
│   │   │   ├── likes/
│   │   │   ├── follows/
│   │   │   └── notifications/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # 재사용 컴포넌트
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── feed/
│   │   ├── post/
│   │   ├── profile/
│   │   ├── notification/
│   │   └── layout/
│   ├── lib/                    # 유틸리티, 설정
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── s3.ts
│   │   └── validations/
│   ├── hooks/                  # 커스텀 훅
│   └── types/                  # TypeScript 타입 정의
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```
