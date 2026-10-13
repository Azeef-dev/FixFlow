# FixFlow - AI-Powered QR Maintenance & Asset History Platform

**FixFlow** is an enterprise-grade maintenance management system that gives every physical asset a digital identity, a QR-accessible public page, an AI-assisted issue triage pipeline, and an immutable audit trail of service history.

Designed for universities, hospitals, corporate offices, factories, and facilities.

---

## 🌟 Key Features

1. **Asset Management & Digital Identity**
   - Unique asset codes (e.g., `AST-1001`, `AST-1002`).
   - Granular status lifecycle (`Operational`, `Issue Reported`, `Under Inspection`, `Under Maintenance`, `Out of Service`, `Retired`).
   - Detailed metadata: category, physical location, purchase date, warranty, assigned technician, last service, and next scheduled service.

2. **Automated QR Code Generation & Label Printing**
   - Dynamic SVG / PNG QR code for each asset pointing strictly to the safe public asset URL.
   - Print-ready physical asset tags containing Asset Name, Unique Code, Location, QR Code, and scan instructions.

3. **Safe Public Access & Issue Reporting**
   - Mobile-first public portal accessed via QR scan or URL without internal login credentials.
   - Shows public-safe information (never leaks sensitive internal costs, private technician logs, or serial info).
   - Instant issue reporting with real-time status tracking.

4. **GenAI Issue Triage (Google Gemini / Built-in Smart Triage)**
   - Converts natural-language problem reports (e.g. *"The projector display is flickering and sometimes loses HDMI signal"*) into structured diagnostic cards.
   - Suggests normalized title, category, priority level, potential root causes, and safe initial troubleshooting checks.
   - Human-in-the-loop review: users can edit, adjust, or accept AI suggestions before saving.

5. **Technician Workflow & Maintenance Accountability**
   - Role-based authorization: **Admin**, **Technician**, and **Reporter**.
   - Assignment, inspection start, work logs, parts replaced, and maintenance costs validation.
   - Cannot resolve issues without verifiable maintenance notes.

6. **Immutable Asset History & Timeline**
   - Every status shift, technician assignment, repair log, and inspection automatically appends to the asset's permanent timeline.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Signika typography, Lucide Icons, `react-hot-toast`, `qrcode.react`, Axios.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, CORS.
- **AI Integration**: Structured AI Issue Triage Engine.

---

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
