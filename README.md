# Nutanix NKP Sizer Web Application

## 📌 Overview
The **Nutanix Kubernetes Platform (NKP) Sizer Web Application** is a lightweight tool designed to help engineers, architects, and system integrators estimate resource requirements for deploying NKP clusters.  
This tool simplifies sizing by providing an intuitive web interface for calculating compute, memory, and storage needs based on input parameters such as node count, workload profiles, and redundancy policies.

---

## 🚀 Features
- Interactive Web UI for cluster sizing  
- Customizable parameters including worker/manager nodes, workloads, storage classes, and HA policies  
- Real-time calculations with instant resource breakdowns (CPU, memory, storage)  
- Export/Share results in **JSON, CSV, or PDF** formats  
- Nutanix-friendly defaults aligned with NKP best practices  

---

## 🛠️ Tech Stack
- **Frontend:** React (with TailwindCSS for styling)  
- **Backend:** Node.js / Express (API services for calculations)  
- **Database (Optional):** SQLite or PostgreSQL (for saving sizing profiles)  
- **Deployment:** Docker / Kubernetes  

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (>= 18.x)  
- npm or yarn  
- Docker (optional, for containerized deployment)  

### Installation

