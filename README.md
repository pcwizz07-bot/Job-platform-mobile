# JobBoard Mobile — Android App

React Native (Expo) app for the Job Platform. Works with the backend at `bespokeuisp.dedicated.co.za`.

## Features

- 📊 **Dashboard** — kanban columns for outstanding/ongoing/upcoming jobs
- ⏱️ **Job Timer** — start/pause/stop timer with work tracking
- ✍️ **Signature Capture** — client and tech sign-off on-device
- 📢 **Fault Reporting** — clients can report issues from the app
- 🔔 **Push Notifications** — reminders every 2 hours for assigned jobs
- 🔒 **2FA Ready** — TOTP two-factor authentication

## User Roles

| Role | Access |
|---|---|
| **Admin** | All jobs, create/edit, manage users |
| **Technician** | View assigned jobs, start/complete workflow |
| **Client** | View own jobs, report faults, update company info |

## Setup

1. Install dependencies:
```bash
cd job-platform-android
npm install
```

2. Update API URL in `src/services/config.js` if needed.

3. Start the app:
```bash
npx expo start
```

4. Scan QR code with Expo Go app on your phone, or press `a` for Android emulator.

## Build APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build APK
eas build -p android --profile preview
```

## Push Notifications

Push notifications require:
1. Expo push token (registered on first launch)
2. Firebase Cloud Messaging setup for Android
3. See `src/services/notifications.js` for setup

## Job Workflow Flow

1. Tech taps a job → sees timer
2. **Start** → timer begins
3. **Stop** → description required, can't skip
4. List hardware used
5. Client signs (on-device signature pad)
6. Client gives optional feedback
7. Tech signs → job finalized
8. Report auto-generated and emailed to admins