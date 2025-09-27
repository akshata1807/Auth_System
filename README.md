#  Auth System with Google & Facebook Login, OTP & Profile Management

A **full-stack authentication system** with an interactive UI.
Includes **Login/Signup with Google & Facebook**, **OTP verification (Email & Phone)**,
**Profile update**, **Forgot Password**, **Database authentication**, and a **Welcome Page**.

---

##  Features

###  Core Authentication
- **Email/Password Signup & Login**
- **Google OAuth Login**
- **Facebook OAuth Login**
- **Database Authentication** (MongoDB/MySQL/Postgres)
- **JWT Authentication** / Session Handling
- **Secure Password Hashing** (bcrypt)

###  Advanced Features
- **OTP Verification**
  - Email OTP (via Nodemailer)
  - SMS OTP (via Twilio)
- **Forgot Password** (Reset link/OTP)
- **Profile Management**
  - Update Name, Phone, Bio, Profile Picture
  - Cloudinary image uploads
- **Admin Dashboard** for User Management
- **Login Activity Tracking**

###  UI/UX Enhancements
- **Dark/Light Mode Toggle** with persistence
- **Password Strength Validation** with real-time feedback
- **"Remember Me" Functionality** (30-day tokens)
- **Responsive Interactive UI** (Tailwind + Framer Motion)
- **Welcome Page** with personalized greeting
- **Loading States** and Error Handling

---

##  Tech Stack

### **Frontend**
- **React / Next.js** with TypeScript
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Responsive Design**

### **Backend**
- **Node.js / Express**
- **Passport.js** for OAuth
- **JWT** for Authentication
- **bcrypt** for password hashing

### **Database**
- **MongoDB** (Primary)
- **MySQL/PostgreSQL** support ready

### **Services**
- **Nodemailer** (Email OTP & Reset links)
- **Twilio** (Phone OTP)
- **Cloudinary** (Profile Pictures)

---

##  Project Structure

```
auth_system/
├── Frontend/SRC/          # Next.js Application
│   ├── app/              # Next.js 13+ App Router
│   │   ├── admin/        # Admin dashboard
│   │   ├── login/        # Login page
│   │   ├── signup/       # Registration page
│   │   ├── profile/      # User profile management
│   │   └── welcome/      # Welcome page
│   ├── components/       # Reusable components
│   │   ├── theme-toggle.tsx
│   │   └── password-strength.tsx
│   └── lib/             # Utilities
│       ├── api.ts
│       ├── theme-context.tsx
│       └── password-validation.ts
├── Backend/SRC/         # Express API Server
│   ├── config/          # Passport configuration
│   ├── middleware/      # Auth & admin middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── scripts/         # Setup scripts
├── package.json         # Root package manager
├── .env.example         # Environment variables template
└── README.md           # This file
```

---

##  Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **Git** for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akshata1807/Auth_System.git
   cd Auth_System
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   npm run install:backend

   # Install frontend dependencies
   npm run install:frontend
   ```

3. **Environment Setup:**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/auth_system

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

   # Email (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Facebook OAuth
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

4. **Start the application:**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start separately:
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

5. **Access your application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000

---

##  Usage Guide

### User Registration & Login

1. **Visit:** http://localhost:3000
2. **Sign Up:** Create account with email/password
3. **Email Verification:** Check email for OTP
4. **Social Login:** Use Google or Facebook
5. **Profile Management:** Upload pictures, update info

### Admin Dashboard

1. **Default Admin Account:**
   - Email: `admin@authsystem.com`
   - Password: `AdminPassword123!`

2. **Access Admin Panel:** http://localhost:3000/admin

3. **Admin Features:**
   - View all users
   - User statistics
   - Login activity tracking
   - Role management
   - User verification control

### Dark Mode
- Click the **sun/moon icon** in the top-right corner
- Theme preference is automatically saved

---

##  Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/auth_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456789

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_change_this_in_production_987654321

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Go to Settings → Basic and copy App ID and App Secret
4. Set OAuth redirect URI: `http://localhost:5000/api/auth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

---

##  Screenshots

### Welcome Page
<img width="1920" height="970" alt="{01CA2BD0-3B2B-4A9B-9AFB-B7BB3C88B017}" src="https://github.com/user-attachments/assets/a8fc6a04-8289-4f0b-8824-c8b0307e0b73" />



### Login Page
<img width="732" height="856" alt="{33D0226D-1B36-4BBB-9809-A1CC37506A6A}" src="https://github.com/user-attachments/assets/993a60ee-7c2a-42ec-ac94-feca609f9cb1" />

### Admin Dashboard
<img width="1920" height="1080" alt="{FB2F1D9F-DCC9-4F65-BB30-161F27B6ADB0}" src="https://github.com/user-attachments/assets/ce5d2baf-b4f7-4510-81ee-3b7c59f8e310" />


### Profile Management
![Screenshot_27-9-2025_201140_localhost](https://github.com/user-attachments/assets/e52b2f59-0feb-4053-b42b-2832a44931d3)



---

##  Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure token-based authentication
- **Rate Limiting:** Prevents brute force attacks
- **Input Validation:** Sanitizes all user inputs
- **CORS Protection:** Configured for cross-origin requests
- **Session Management:** Secure session handling
- **OTP Expiration:** 5-minute timeout for security

---

##  Deployment

### Frontend (Vercel/Netlify)
```bash
cd Frontend/SRC
npm run build
# Deploy the .next folder
```

### Backend (Heroku/Railway)
```bash
cd Backend/SRC
npm run build
# Deploy with your preferred platform
```

### Environment Variables for Production
Make sure to update these for production:
- Use strong, unique JWT secrets
- Configure production database URI
- Set up production email service
- Configure OAuth redirect URIs for production domain

---

##  Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch: `git push origin feature-name`
5. **Submit** a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Update README for new features
- Test thoroughly before submitting PR

---

##  Acknowledgments

- **Next.js** for the amazing React framework
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **MongoDB** for the flexible database
- **Passport.js** for OAuth implementation


---
### Connect with me:
- **GitHub:** [@akshata1807](https://github.com/akshata1807)
- **Email:** akshatalonari18@gmail.com
---

##  Author

**Developed by :** 
### Akshata Lonari


---


