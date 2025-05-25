# AI-Assisted Online Notary System

This is a full-stack notarization platform designed to streamline the legal document notarization process for users, especially those living in remote or international regions. It includes an AI assistant for generating and translating legal text, video-based verification with notaries, and secure document storage. The system is divided into three major components:

---

## 📱 Mobile App (React Native + Expo + Paper UI)

### Description:
A user-friendly mobile application where users can initiate notarization requests, upload identity documents, and interact with an AI chatbot to draft or translate documents. All verification and document tracking is handled here for the end user.

### Key Features:
- Secure login and identity registration via passport or driver’s license
- Chat with AI to **generate**, **translate**, or **analyze** legal documents
- Real-time status updates for each notarization request
- Scheduled video calls with notaries (powered by Jitsi on a self-hosted server)
- Access and download notarized documents
- Clean UI with Paper UI library

---

## 🌐 Web Frontend (React + Tailwind)

### Description:
An administrative dashboard for notaries to manage incoming requests, hold video calls with clients, and sign or reject documents.

### Key Features:
- Secure notary login
- List of notarization requests with status indicators
- Approve/Reject buttons for each request
- Time scheduling interface for video verification sessions
- Document viewer with digital signing capability
- Upcoming meeting reminders

---

## 🧠 Backend (Django + Postgres + AWS + GPT Integration)

### Description:
A robust backend service that coordinates communication between mobile users, notaries, and AI services. It handles identity verification, file storage, meeting scheduling, and document generation.

### Key Features:
- Django-based REST API
- AI chat integration using GPT for document generation, translation, and review
- Self-hosted Jitsi server for private and secure video calls
- AWS S3 for encrypted document storage
- Digital signature creation and notarization recordkeeping
- Role-based access for users and notaries

---

## 🎯 Vision & Purpose

This project was built as a diploma thesis with the goal of **democratizing access to notarial services**. It is designed for:
- Citizens abroad needing document notarization
- People in rural areas with limited legal infrastructure
- Institutions and students facing language barriers

---

## 🚀 Technologies Used

- **Frontend**: React, Tailwind, Paper UI, React Native
- **Backend**: Django, DRF, PostgreSQL, AWS (S3), Jitsi (self-hosted), GPT
- **DevOps**: Docker, Nginx, GitHub Actions, systemd

---

## 🛡️ Security Considerations

- All personal data is encrypted at rest
- JWT-based authentication
- Secure video communication via WebRTC (Jitsi)
- Controlled access to document storage

---

## 🧑‍🎓 Author

**Shokhrukh Davlatmamadov** – Bachelor thesis project, University of Central Asia  
Internship at Yandex, ICPC NERC Finalist, Future-focused on AI & education in remote regions.

---

