# Visiting Card Scanner (Mobile App)

A modern, cross-platform mobile application built with **React Native & Expo SDK 58 (TypeScript)**. It scans visiting/business cards, uses high-speed **Groq AI (LPU)** and OCR to extract structured contact details, supports **native device contacts synchronization**, and syncs to **Supabase PostgreSQL** with full offline local storage fallback.

---

## Key Features

- **High-Speed AI & OCR Extraction**:
  - Powered by **Groq LPU** (`openai/gpt-oss-120b`) for semantic extraction of complex visual layouts, Indian/international formats, and noisy OCR text (~1.8s latency).
  - Graceful, automatic offline fallback to deterministic regex and heuristic parsing if offline or timed out.
- **Dynamic Multi-Number & Field Support**:
  - Multiple mobile phone numbers with individual dial buttons.
  - Landline / office numbers with STD code preservation.
  - Pincode/zip preservation and dedicated business specialization capture (e.g. *"Importers of Power Tools & Spares"*).
  - Accurate trade categorization across 12+ industry sectors.
- **Native Device Contacts Synchronization**:
  - **Create a new Contact**: Saves complete contact profiles directly into the phone's address book.
  - **Add to existing Contact**: Opens the system contact picker to select an existing contact and merge card details without overwriting existing data.
  - **Zero Login Friction**: On Android, contacts automatically sync to **Google Contacts**; on iOS, to **Apple Contacts (iCloud)**.
  - **Optional Google Sign-In**: Dedicated Google Account linking panel for users who want explicit cloud account association.
- **Auto-Rotate Screen Orientation**:
  - Supports automatic dynamic rotation between **portrait** and **landscape** based on device orientation lock. View and snap cards in full landscape width.
- **Card Wallet & Quick Actions**:
  - One-tap **Call** (`tel:` dialer for each number)
  - One-tap **WhatsApp** chat
  - One-tap **Email** (`mailto:`)
  - One-tap **Website** browser
  - Instant search indexing names, companies, phones, pincodes, and business specializations.
- **Supabase Cloud + Offline Local Storage**:
  - Works **immediately** in offline mode using `AsyncStorage`.
  - Connect your Supabase project URL & Anon Key in the app's settings to sync directly to PostgreSQL.

---

## Project Structure

```text
visiting-card-scanner/
├── assets/                 # App icons, splash screens, and images
├── src/
│   ├── config/             # Centralized constants, endpoints, and storage keys
│   │   └── constants.ts
│   ├── components/         # Reusable UI components
│   │   ├── AddToContactsModal.tsx
│   │   ├── CardDetailModal.tsx
│   │   ├── CardItem.tsx
│   │   └── SupabaseConfigModal.tsx
│   ├── screens/            # Main application screens
│   │   ├── ContactsView.tsx
│   │   ├── ReviewScreen.tsx
│   │   └── ScanScreen.tsx
│   ├── services/           # Core business logic & API services
│   │   ├── aiExtractor.ts
│   │   ├── cardExtractor.ts
│   │   ├── contactService.ts
│   │   ├── googleAuthService.ts
│   │   ├── ocrService.ts
│   │   └── supabaseClient.ts
│   └── types/              # TypeScript interfaces and data models
│       └── card.ts
├── supabase_schema.sql     # PostgreSQL database schema & migrations
├── .env.example            # Environment configuration template
├── app.json                # Expo SDK 58 application manifest & permissions
└── package.json            # Project dependencies and scripts
```

---

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
3. Scan the QR code with **Expo Go** on Android or iOS.

---

## Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab.
3. Copy the contents of [`supabase_schema.sql`](file:///c:/Users/donal/.gemini/antigravity-ide/Visting%20Card%20Scanner/supabase_schema.sql) and run it in the SQL editor.
4. In the app, tap the **"Offline Mode"** pill at the top right, enter your **Project URL** and **Anon Key**, and tap **Save & Connect**.

