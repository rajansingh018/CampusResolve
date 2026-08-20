# CampusResolve 🚀

A smart campus complaint management platform that helps students report campus issues and enables college administrators to efficiently track, manage, and resolve them.

## 📌 About the Project

CampusResolve is designed to bridge the communication gap between students and college administration.

Students can report issues such as:

* Wi-Fi & IT problems
* Cleanliness issues
* Infrastructure problems
* Electrical issues
* Water-related problems
* Other campus concerns

Administrators can review complaints, update their status, upload resolution proof, and monitor campus complaint analytics.

## ✨ Features

### 👨‍🎓 Student Features

* College selection
* Student registration and login
* JWT-based authentication
* Report campus complaints
* Add complaint title, description, category, location, and priority
* Upload problem images
* Track complaint status
* View personal complaints
* Receive notifications for complaint updates

### 👨‍💼 Admin Features

* Secure admin dashboard
* View all complaints for the selected college
* Filter complaints by status
* Update complaint status:

  * Reported
  * Under Review
  * In Progress
  * Resolved
  * Rejected
* Upload resolution proof images
* View student and complaint details
* Monitor complaint statistics
* View analytics including:

  * Resolution rate
  * Average resolution time
  * High-priority complaints
  * Pending complaints
  * Complaint status distribution
  * Most reported categories
  * Priority distribution

## 📊 Complaint Workflow

```text
Student Reports Issue
        ↓
     Reported
        ↓
   Under Review
        ↓
   In Progress
        ↓
     Resolved
        ↓
Resolution Proof Uploaded
```

An administrator can also reject a complaint when necessary.

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API
* LocalStorage

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs
* Multer

### Deployment & Services

* Vercel
* MongoDB Atlas
* Cloudinary

## 📁 Project Structure

```text
CampusResolve/
│
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   │
│   ├── middleware/
│   │   ├── adminMiddleware.js
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── College.js
│   │   ├── Complaint.js
│   │   ├── Notification.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminComplaintRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── collegeRoutes.js
│   │   ├── complaintRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── services/
│   │   └── escalationService.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── assets/
│   │   └── logos/
│   │
│   ├── css/
│   │   ├── admin.css
│   │   ├── auth.css
│   │   ├── complaints.css
│   │   ├── dashboard.css
│   │   ├── report.css
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   ├── main.js
│   │   ├── register.js
│   │   └── report.js
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── report.html
│   ├── complaints.html
│   └── admin.html
│
├── .gitignore
└── README.md
```

## 🌐 Live Demo

**Frontend:**
https://campus-resolve-opal.vercel.app/

**Backend API:**
https://campus-resolve-backend.vercel.app/

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/rajansingh018/CampusResolve.git
```

### 2. Open the project

```bash
cd CampusResolve
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Create a `.env` file

Add your environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Start the backend

```bash
node server.js
```

The backend will run on:

```text
http://localhost:5002
```

### 6. Open the frontend

Open the `frontend` folder and run the project using a local development server such as Live Server.

## 🔐 Security

Sensitive environment variables such as database credentials, JWT secrets, and Cloudinary credentials are stored in environment variables and are not included in the repository.

## 🚀 Future Improvements

* 📧 Automatic email notifications to college authorities and principals
* 🔔 Real-time notifications
* ⏰ Automatic escalation for unresolved complaints
* 📱 Improved mobile experience
* 📈 Advanced analytics and reporting
* 🔍 Search and advanced complaint filtering
* 👥 Department-wise complaint assignment
* 📊 Downloadable analytics reports
* 🤖 AI-based complaint categorization and priority detection

## 🎯 Project Goal

The goal of CampusResolve is to create a transparent and efficient digital system where campus issues can be reported, tracked, and resolved more effectively.

Instead of complaints getting lost through informal communication, CampusResolve provides a structured workflow for both students and administrators.

## 👨‍💻 Author

**Rajan Singh**

B.Tech IT Student | Aspiring Software Developer

GitHub:
https://github.com/rajansingh018

---

⭐ If you found this project interesting, consider giving it a star!
