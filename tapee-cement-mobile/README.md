# Tapee Cement Loyalty Mobile App

A React Native mobile application built with Expo for the Tapee Cement Loyalty Program.

## Features

- **User Authentication**: Login and registration for builders, contractors, and dealers
- **Points Management**: Earn points for cement bag purchases
- **Rewards System**: Redeem points for various rewards
- **Transaction History**: Track all points earned and redeemed
- **Profile Management**: Update user information and preferences
- **Cross-Platform**: Works on both iOS and Android

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Vector Icons** for icons
- **Linear Gradient** for beautiful UI elements

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode (Mac only)
- For Android development: Android Studio

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tapee-cement-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
# iOS (requires Mac)
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

4. Build for Android:
```bash
npm run build:android
```

5. Build for iOS:
```bash
npm run build:ios
```

### Local Builds

For Android:
```bash
expo build:android
```

For iOS (requires Mac):
```bash
expo build:ios
```

## App Store Deployment

### Google Play Store

1. Build AAB file using EAS Build
2. Create app in Google Play Console
3. Upload AAB file
4. Complete store listing with:
   - App description
   - Screenshots
   - Privacy policy
   - Content rating

### Apple App Store

1. Build IPA file using EAS Build
2. Create app in App Store Connect
3. Upload IPA using Transporter or EAS Submit
4. Complete store listing with:
   - App description
   - Screenshots
   - Privacy policy
   - App review information

## Project Structure

```
tapee-cement-mobile/
├── src/
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.tsx
│       │   └── RegisterScreen.tsx
│       └── dashboard/
│           ├── DashboardScreen.tsx
│           ├── GetPointsScreen.tsx
│           ├── RewardsScreen.tsx
│           ├── TransactionsScreen.tsx
│           └── ProfileScreen.tsx
├── assets/
│   ├── logo.png
│   ├── icon.png
│   └── splash.png
├── App.tsx
├── app.json
├── eas.json
└── package.json
```

## Configuration

### App Configuration (app.json)

- Update `expo.name` and `expo.slug`
- Configure iOS bundle identifier and Android package name
- Set up app icons and splash screens
- Configure permissions

### EAS Configuration (eas.json)

- Configure build profiles for development, preview, and production
- Set up submission configuration for app stores

## Environment Variables

Create a `.env` file for environment-specific configuration:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features to Implement

- [ ] Supabase integration for backend
- [ ] Push notifications
- [ ] Offline support
- [ ] Image upload for profile pictures
- [ ] Biometric authentication
- [ ] Deep linking
- [ ] Analytics integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary and confidential.