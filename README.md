# Tapee Cement Loyalty Mobile App

A React Native mobile application for the Tapee Cement Loyalty Program, built with Expo for cross-platform deployment.

## 🏗️ Project Overview

The Tapee Cement Loyalty Mobile App allows builders, contractors, and dealers to manage their loyalty points, redeem rewards, and track transactions directly from their mobile devices.

## 📱 Features

### For Customers (Builders/Contractors)
- ✅ Earn 10 points per cement bag purchased
- ✅ Submit point requests to dealers
- ✅ Browse and redeem rewards
- ✅ Track transaction history
- ✅ Manage profile and account settings

### For Dealers
- ✅ Approve customer point requests
- ✅ View transaction history
- ✅ Access dealer-specific features

### Core Features
- 🔐 Secure authentication
- 📊 Real-time points tracking
- 🎁 Rewards catalog
- 📱 Native mobile experience
- 🔄 Offline support
- 🔔 Push notifications (planned)

## 🛠️ Tech Stack

- **Framework**: React Native + Expo SDK 50
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **UI Components**: React Native + Custom Components
- **Icons**: Expo Vector Icons
- **State Management**: React Context + Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Build & Deploy**: Expo Application Services (EAS)

## 📁 Project Structure

```
tapee-cement-loyalty-mobile/
├── src/
│   ├── components/              # Reusable UI components
│   ├── screens/                # Screen components
│   │   ├── auth/               # Authentication screens
│   │   ├── dashboard/          # Main app screens
│   │   └── dealer/             # Dealer-specific screens
│   ├── navigation/             # Navigation configuration
│   ├── services/               # API and backend services
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── constants/              # App constants
├── assets/                     # Images, fonts, and other assets
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tapee-cement-loyalty-mobile.git
cd tapee-cement-loyalty-mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Expo CLI globally**
```bash
npm install -g @expo/cli
```

4. **Start the development server**
```bash
npm start
```

### Running on Devices

#### Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Run on web (for testing)
npm run web
```

#### Physical Device
1. Install Expo Go app on your device
2. Scan the QR code from the terminal
3. The app will load on your device

## 🔧 Configuration

### Environment Setup

Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### App Configuration

Update `app.json` with your app details:
```json
{
  "expo": {
    "name": "Tapee Cement Loyalty",
    "slug": "tapee-cement-loyalty",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2979f2"
    },
    "ios": {
      "bundleIdentifier": "com.tapeecement.loyalty"
    },
    "android": {
      "package": "com.tapeecement.loyalty"
    }
  }
}
```

## 🏗️ Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login to Expo**
```bash
eas login
```

3. **Configure EAS**
```bash
eas build:configure
```

4. **Build for Android**
```bash
eas build --platform android --profile production
```

5. **Build for iOS**
```bash
eas build --platform ios --profile production
```

### Local Builds

#### Android
```bash
# Generate APK for testing
eas build --platform android --profile preview --local

# Generate AAB for Play Store
eas build --platform android --profile production --local
```

#### iOS (Mac only)
```bash
# Generate IPA for App Store
eas build --platform ios --profile production --local
```

## 📱 App Store Deployment

### Google Play Store

1. **Prepare Assets**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (various sizes)
   - App description and metadata

2. **Build AAB**
```bash
eas build --platform android --profile production
```

3. **Upload to Play Console**
   - Create app in Google Play Console
   - Upload AAB file
   - Complete store listing
   - Submit for review

### Apple App Store

1. **Prepare Assets**
   - App icon (1024x1024 PNG)
   - Screenshots for all device sizes
   - App description and metadata

2. **Build IPA**
```bash
eas build --platform ios --profile production
```

3. **Upload to App Store Connect**
```bash
eas submit --platform ios
```

## 🧪 Testing

### Unit Testing
```bash
npm test
```

### E2E Testing
```bash
# Install Detox (for E2E testing)
npm install -g detox-cli

# Run E2E tests
npm run test:e2e
```

### Device Testing
- Test on multiple device sizes
- Test on both iOS and Android
- Test offline functionality
- Test performance on older devices

## 🔄 Updates and Maintenance

### Over-the-Air Updates
```bash
# Publish update without app store review
eas update --branch production --message "Bug fixes and improvements"
```

### Version Management
1. Update version in `app.json`
2. Update version in `package.json`
3. Build new version
4. Submit to app stores

## 📊 Analytics and Monitoring

### Expo Analytics
- Built-in crash reporting
- Performance monitoring
- User analytics

### Custom Analytics
- Track user engagement
- Monitor feature usage
- Performance metrics

## 🛡️ Security

### Best Practices
- Secure API endpoints
- Validate user inputs
- Implement proper authentication
- Use HTTPS for all requests
- Store sensitive data securely

### Data Protection
- Follow GDPR guidelines
- Implement data encryption
- Secure user authentication
- Regular security audits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

### Community
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://reactnative.dev/community/overview)

### Issues
For bug reports and feature requests, please create an issue in the GitHub repository.

## 🗺️ Roadmap

### Version 1.1
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Offline mode improvements
- [ ] Performance optimizations

### Version 1.2
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Social sharing features

### Version 2.0
- [ ] AR features for product scanning
- [ ] Advanced reward system
- [ ] Gamification elements
- [ ] Integration with IoT devices

---

**Built with ❤️ for the construction industry**