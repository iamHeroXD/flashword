# ⚡ Flashword — Word Flash & Brain Training Platform

> **"Your brain. On the clock."**  
> See the words. Beat the timer. Sharpen your memory.

Flashword is a fast-paced, production-quality word flash and memory gaming platform engineered for teenagers and adults. It combines cognitive speed, spatial memory, and vocabulary mastery across 19 curated domains and 5 dynamic game modes.

---

## 🌟 Key Features

- **High-Velocity Gameplay**:
  - Word display configurations: 1, 5, 10, 15, or 20 words.
  - Duration control: 1–30 seconds with quick presets (3s, 5s, 8s, 10s, 15s).
  - 5 Engaging Game Modes:
    - **Classic Flash**: Observe, remember, and review with word definitions.
    - **Memory Recall**: Recall words via fast multiple choice or speed typing.
    - **Speed Rush**: Short durations with extra multipliers for sub-second answers.
    - **Survival**: 3 strikes system with escalating difficulty levels.
    - **Daily Challenge**: Globally synchronized daily seed, identical word set for all players, one official score submission per day.
- **2,500+ Curated Distinct Words & 19 Categories**:
  - English Vocabulary, Advanced Vocabulary, Biology, Physics, Chemistry, Technology, Programming, Mathematics, Animals, Geography, Food, Everyday Objects, Space & Astronomy, Nature, Human Body, Sports, History, and Custom User Words.
  - Zero duplicate words per category, complete with educational definitions and difficulty grading.
- **Deterministic PRNG & Fair Play Engine**:
  - Seeded Mulberry32 pseudo-random number generator for daily and competitive fairness.
  - Fisher-Yates deck cycle tracking: avoids immediate repetition of previously seen words within consecutive rounds.
  - Categorical distractors generated strictly from matching categories.
- **Strict Username-Only Authentication (Zero Email Requirement)**:
  - No email addresses collected or required — ever.
  - Unique, case-insensitive usernames with bcrypt-hashed passwords.
  - Cryptographically signed HMAC-SHA256 session cookies (`flashword_session`).
  - **Account Recovery via Secret Recovery Code**: Users receive a generated 16-character recovery key (`FLASH-XXXX-XXXX-XXXX`) upon signup, allowing verified self-service password resets without an email inbox.
  - Full user self-service: update display name, avatar, password, or perform cascading account deletion.
- **Server-Side Scoring & Anti-Cheat Validation**:
  - Client-reported scores and XP are never blindly trusted.
  - The server verifies session configurations, counts correct words, applies duration and difficulty weightings, and computes speed bonuses.
  - 12 Dynamic Achievements with automated server-side unlock evaluations.
- **Procedural Web Audio Engine**:
  - Synthesized via the browser's Web Audio API (`AudioContext`) — zero external MP3/WAV assets to load.
  - Countdown ticks, chimes, word flip sounds, correct/incorrect chimes, and victory fanfares.
  - User-configurable audio toggle (muted by default with persistent preference).
- **Design System**:
  - Dark mode default (`#0B1020`, `#11182A`, `#171F33`, `#A78BFA`, `#8B5CF6`, `#6EE7B7`).
  - CSS variables, smooth 150–250ms transitions, Lucide icons, responsive layout with mobile bottom navigation bar and desktop header.
  - Respects `prefers-reduced-motion`.
- **Administrative Portal**:
  - Real-time platform metrics (users, sessions played, word counts, accuracy stats).
  - Word management: search, filter by category, edit definitions/difficulty, add new vocabulary, and deactivate words.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design tokens
- **Database**: Native `node:sqlite` (`DatabaseSync` in Node 24) with schema migrations, indexes, and automated word bank seeding
- **Authentication**: Custom username-only session engine using `bcryptjs` and HMAC-SHA256 cookies
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual FX**: `canvas-confetti`
- **Testing**: Node.js test runner with `tsx` (`node:test` & `node:assert/strict`)

---

## 📂 Project Architecture

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/               # Word management & analytics
│   │   │   ├── auth/                # Register, login, logout, password, recover, profile
│   │   │   ├── daily/               # Daily challenge status & word sets
│   │   │   ├── game/                # Round generation & server score submission
│   │   │   └── leaderboard/         # All-time, weekly, monthly & daily rankings
│   │   ├── achievements/            # Achievement gallery & progress tracker
│   │   ├── admin/                   # Admin management dashboard
│   │   ├── challenges/              # Daily challenge hub & gauntlet modes
│   │   ├── leaderboard/             # Competitive leaderboards & podium
│   │   ├── play/                    # Core gameplay engine & game setup
│   │   ├── profile/                 # Player stats, history, settings, deletion
│   │   ├── globals.css              # Design system CSS variables & utilities
│   │   ├── layout.tsx               # Root layout & navbar shell
│   │   └── page.tsx                 # Public landing page with live interactive demo
│   ├── components/
│   │   ├── AuthModal.tsx            # Login, registration, recovery code modal
│   │   ├── BrandLogo.tsx            # Lightning flash brand mark
│   │   └── Navbar.tsx               # Desktop header & mobile bottom dock
│   ├── context/
│   │   └── AuthContext.tsx          # Client auth state provider
│   ├── data/
│   │   ├── categories.ts            # Category metadata & icon definitions
│   │   └── words/                   # 2,500+ curated words organized by domain
│   ├── lib/
│   │   ├── audio.ts                 # Web Audio API sound synthesizer
│   │   ├── auth.ts                  # Session tokens, rate limits, username validation
│   │   ├── db.ts                    # SQLite database schema, seeding, queries
│   │   └── game/
│   │       ├── achievements.ts      # Achievement definitions & evaluator
│   │       ├── engine.ts            # Seeded PRNG, deck cycle, distractor generator
│   │       └── scoring.ts           # Scoring algorithm, XP curve & streaks
│   └── types/
│       └── node-sqlite.d.ts         # TypeScript typing for Node 24 SQLite
├── tests/
│   ├── achievements.test.ts         # Achievement unlock tests
│   ├── auth.test.ts                 # Password validation, recovery code & token tests
│   ├── engine.test.ts               # Word normalization, duplication check, PRNG tests
│   └── scoring.test.ts              # Scoring multipliers, XP thresholds, streak tests
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.5.0` or higher (Node 24 recommended for built-in `node:sqlite`).
- **npm** or **pnpm**.

### 1. Installation

```bash
# Clone the repository
git clone <repo-url>
cd vibrant-chandrasekhar

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `SESSION_SECRET` | Secret key used to sign HMAC-SHA256 session cookies (min 32 chars) | Built-in fallback for dev |
| `ADMIN_TOKEN` | Secret administrative token (`x-admin-token` header) | `admin-flash-secret` |
| `DATABASE_PATH` | Path to SQLite database file | `./data/flashword.db` (or `/tmp/flashword.db` on serverless) |

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The database initializes and seeds automatically on first run.

---

## 🧪 Testing

The test suite runs 17 comprehensive unit and integration tests covering:
- Zero intra-round duplicate words and zero category duplicate words.
- Deterministic Mulberry32 PRNG seed consistency.
- Categorical distractor generation.
- Deck-cycle tracking.
- Scoring algorithms, speed multipliers, and XP progression.
- Daily streak logic (consecutive, same-day, and broken streaks).
- Username validation rules and password minimums.
- Recovery code format generation (`FLASH-XXXX-XXXX-XXXX`).
- Cryptographic session signing and tampering detection.
- Achievement unlock rules.

Run the test suite:

```bash
npm test
```

---

## 🔐 Username-Only Authentication & Recovery

Flashword uses an intentional **no-email architecture**:
1. **Registration**: The user selects a username, password, display name, and avatar.
2. **Recovery Key**: The user is immediately issued a private recovery code (e.g. `FLASH-A7F9-C2E4-B831`).
3. **Password Reset**: If a user forgets their password, they provide their username and valid recovery code to securely set a new password without third-party email dependencies.
4. **Rate Limiting**: IP and username-keyed sliding-window rate limiters protect registration and login attempts against brute force.

---

## 🛡 Anti-Cheat & Server-Side Scoring

All competitive game modes validate scores on the backend:
- The round is initialized via `POST /api/game/round`, returning a server-signed configuration.
- Word responses, response times, and target words are evaluated via `POST /api/game/submit`.
- Scores scale based on:
  - Base word point value.
  - Visibility difficulty multiplier (shorter display time = higher multiplier).
  - Domain difficulty tier (Expert > Hard > Normal > Easy).
  - Accuracy percentage.
  - Sub-second speed bonus for rapid recall.

---

## 🚢 Production Build & Deployment

To create an optimized production build:

```bash
npm run build
npm run start
```

### Deploying to Vercel

Flashword is ready for Vercel deployment:
1. Push the code to your GitHub/GitLab repository.
2. Import the project in Vercel.
3. Configure the `SESSION_SECRET` and `ADMIN_TOKEN` environment variables in the Vercel dashboard.
4. The database automatically resolves to `/tmp/flashword.db` in ephemeral serverless environments, or you can point `DATABASE_PATH` to a persistent mounted volume or external SQLite provider (such as Turso/LibSQL).

---

## 📜 License

MIT License. Built with ❤️ for brain training enthusiasts everywhere.
