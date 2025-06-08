# Mobile App Deployment Guide

## Prerequisites

Before you can deploy to app stores, you need:

### For iOS (App Store):
1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Complete enrollment process

2. **Mac Computer** with Xcode installed
   - Download Xcode from Mac App Store
   - Install Xcode Command Line Tools

3. **iOS Development Certificate**
   - Create in Apple Developer Console
   - Download and install on your Mac

### For Android (Google Play):
1. **Google Play Console Account** ($25 one-time fee)
   - Sign up at https://play.google.com/console

2. **Android Studio** (free)
   - Download from https://developer.android.com/studio

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Web App
```bash
npm run build
```

### 3. Add Mobile Platforms
```bash
# Add iOS platform (requires Mac)
npm run add:ios

# Add Android platform
npm run add:android
```

### 4. Sync Web Assets to Mobile
```bash
npm run sync
```

## iOS Deployment

### 1. Open iOS Project
```bash
npm run ios
```

### 2. Configure in Xcode
1. Select your development team
2. Update Bundle Identifier: `com.tapeecement.loyalty`
3. Set deployment target to iOS 13.0+
4. Configure signing certificates

### 3. Build for App Store
1. In Xcode: Product → Archive
2. Upload to App Store Connect
3. Submit for review

### 4. App Store Listing Requirements
- **App Name**: Tapee Cement Loyalty
- **Description**: Professional loyalty rewards program for Tapee Cement customers. Earn points for purchases and redeem exciting rewards.
- **Keywords**: cement, loyalty, rewards, construction, building materials
- **Category**: Business
- **Screenshots**: Required for all device sizes
- **App Icon**: 1024x1024px (provided in public/icons/)

## Android Deployment

### 1. Open Android Project
```bash
npm run android
```

### 2. Generate Signed APK
1. In Android Studio: Build → Generate Signed Bundle/APK
2. Create new keystore or use existing
3. Build release APK/AAB

### 3. Upload to Google Play Console
1. Create new app in Play Console
2. Upload APK/AAB file
3. Complete store listing
4. Submit for review

### 4. Play Store Listing Requirements
- **App Name**: Tapee Cement Loyalty
- **Short Description**: Loyalty rewards for Tapee Cement customers
- **Full Description**: 
  ```
  Tapee Cement Loyalty is a comprehensive rewards program designed for builders, contractors, and dealers. 
  
  Features:
  • Earn 10 points for every cement bag purchased
  • Redeem points for cash discounts, tours, and merchandise
  • Track purchase history and points balance
  • Dealer approval system for point verification
  • Secure user authentication and profile management
  
  Join thousands of satisfied customers and start earning rewards today!
  ```
- **Category**: Business
- **Content Rating**: Everyone
- **Screenshots**: Required for phone and tablet
- **Feature Graphic**: 1024x500px

## App Store Assets Needed

### Icons (Already provided in public/icons/):
- iOS: 1024x1024px (App Store), various sizes for app
- Android: 512x512px (Play Store), various sizes for app

### Screenshots:
You'll need to take screenshots of:
1. Login/Registration screen
2. Dashboard with points balance
3. Rewards catalog
4. Transaction history
5. Profile management

### Marketing Materials:
- **Feature Graphic** (Android): 1024x500px
- **App Preview Video** (Optional but recommended)
- **Privacy Policy URL**: Required for both stores
- **Terms of Service URL**: Required for both stores

## Testing Before Submission

### 1. Test on Physical Devices
```bash
# iOS (requires Mac and iOS device)
npx cap run ios --device

# Android
npx cap run android --device
```

### 2. Test Core Functionality
- [ ] User registration and login
- [ ] Points earning workflow
- [ ] Rewards redemption
- [ ] Profile management
- [ ] Offline functionality
- [ ] Push notifications (if implemented)

## Submission Checklist

### iOS App Store:
- [ ] App built and archived in Xcode
- [ ] All required screenshots uploaded
- [ ] App description and metadata complete
- [ ] Privacy policy and terms of service URLs provided
- [ ] App submitted for review

### Google Play Store:
- [ ] Signed APK/AAB uploaded
- [ ] Store listing complete with descriptions
- [ ] Screenshots for all required device types
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided
- [ ] App submitted for review

## Post-Submission

### Review Process:
- **iOS**: 1-7 days typically
- **Android**: 1-3 days typically

### After Approval:
1. App will be available in stores
2. Monitor user reviews and ratings
3. Plan for regular updates
4. Track app analytics and user engagement

## Maintenance

### Regular Updates:
```bash
# Update web app
npm run build

# Sync changes to mobile
npm run sync

# Rebuild and resubmit to stores
```

### Version Management:
- Update version numbers in `package.json` and `capacitor.config.ts`
- Follow semantic versioning (1.0.0, 1.0.1, 1.1.0, etc.)
- Maintain changelog for store update descriptions

## Support

For technical issues:
- Capacitor Documentation: https://capacitorjs.com/docs
- iOS Development: https://developer.apple.com/documentation
- Android Development: https://developer.android.com/docs

For store-specific issues:
- App Store Connect: https://developer.apple.com/support
- Google Play Console: https://support.google.com/googleplay/android-developer