# Mobile App Store Deployment Guide

This guide will help you deploy the Tapee Cement Loyalty mobile app to both Google Play Store and Apple App Store.

## Prerequisites

### For Both Platforms
- Expo account (free at https://expo.dev)
- EAS CLI installed (`npm install -g eas-cli`)
- App assets (icons, splash screens, screenshots)

### For Google Play Store
- Google Play Console account ($25 one-time fee)
- Google Service Account JSON file (for automated uploads)

### For Apple App Store
- Apple Developer Account ($99/year)
- Mac computer (for iOS builds and submissions)
- App Store Connect access

## Step 1: Setup EAS Build

1. **Login to Expo:**
```bash
eas login
```

2. **Configure EAS for your project:**
```bash
cd tapee-cement-mobile
eas build:configure
```

3. **Update your project ID in app.json:**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

## Step 2: Prepare App Assets

### App Icons
- **Android**: 512x512 PNG (adaptive icon)
- **iOS**: 1024x1024 PNG

### Splash Screens
- Create splash screen images for different screen sizes
- Use Expo's splash screen generator or create manually

### Screenshots
Take screenshots of key app screens:
1. Login screen
2. Dashboard
3. Get Points screen
4. Rewards screen
5. Profile screen

Required sizes:
- **Android**: 1080x1920 (portrait), 1920x1080 (landscape)
- **iOS**: Various sizes for different devices

## Step 3: Build for Android (Google Play Store)

### 3.1 Build AAB File
```bash
eas build --platform android --profile production
```

### 3.2 Create Google Play Console App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - **App name**: Tapee Cement Loyalty
   - **Default language**: English
   - **App type**: App
   - **Category**: Business

### 3.3 Upload AAB File

1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload your AAB file from EAS Build
4. Add release notes

### 3.4 Complete Store Listing

**App details:**
- **App name**: Tapee Cement Loyalty
- **Short description**: Loyalty rewards program for Tapee Cement customers
- **Full description**:
```
Tapee Cement Loyalty is a comprehensive rewards program for builders, contractors, and dealers.

🏗️ FEATURES:
• Earn 10 points for every cement bag purchased
• Redeem points for cash discounts, tours, and merchandise
• Track purchase history and points balance
• Dealer approval system for secure point verification
• User-friendly profile management

💰 BENEFITS:
• Exclusive rewards for loyal customers
• Easy point redemption process
• Transparent tracking system
• Secure and reliable platform

Join thousands of satisfied customers and start earning rewards today!

Perfect for:
✓ Builders and construction companies
✓ Contractors and masons
✓ Cement dealers and distributors
```

**Graphics:**
- Upload app icon (512x512)
- Upload feature graphic (1024x500)
- Upload screenshots for phone and tablet

**Store settings:**
- **Category**: Business
- **Content rating**: Complete questionnaire (should be "Everyone")
- **Target audience**: Adults
- **Privacy policy**: Required (create at your domain)

### 3.5 Submit for Review
1. Review all sections for completeness
2. Submit app for review
3. Review typically takes 1-3 days

## Step 4: Build for iOS (Apple App Store)

### 4.1 Build IPA File
```bash
eas build --platform ios --profile production
```

### 4.2 Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Name**: Tapee Cement Loyalty
   - **Bundle ID**: com.tapeecement.loyalty
   - **SKU**: tapee-cement-loyalty
   - **Primary Language**: English

### 4.3 Upload IPA File

**Option 1: Using EAS Submit (Recommended)**
```bash
eas submit --platform ios
```

**Option 2: Using Transporter App**
1. Download Transporter from Mac App Store
2. Upload IPA file from EAS Build

### 4.4 Complete App Store Listing

**App Information:**
- **Name**: Tapee Cement Loyalty
- **Subtitle**: Cement Loyalty Rewards
- **Category**: Business
- **Content Rights**: No, it does not contain, show, or access third-party content

**Pricing and Availability:**
- **Price**: Free
- **Availability**: All countries

**App Store Information:**
- **Description**:
```
Tapee Cement Loyalty is the ultimate rewards program for construction professionals.

🏗️ EARN POINTS EASILY
Get 10 points for every cement bag you purchase from authorized dealers.

🎁 REDEEM AMAZING REWARDS
• Cash discounts on future purchases
• Exclusive tour packages
• Premium construction tools and merchandise
• Special offers for loyal customers

📊 TRACK YOUR PROGRESS
• Real-time points balance
• Complete purchase history
• Transaction tracking
• Secure dealer verification system

👤 PROFESSIONAL FEATURES
• User-friendly profile management
• District-wise dealer network
• Secure authentication
• Mobile-optimized experience

Perfect for builders, contractors, masons, and cement dealers across Gujarat.

Join the Tapee Cement community and start earning valuable rewards for your loyalty today!
```

- **Keywords**: cement,loyalty,rewards,construction,building,contractor,builder,points
- **Support URL**: Your support website
- **Marketing URL**: Your main website

**Build Information:**
- Upload screenshots for all required device sizes
- Add app preview videos (optional but recommended)

**General App Information:**
- **App Icon**: 1024x1024 PNG
- **Age Rating**: 4+ (No Objectionable Content)
- **Copyright**: Your company name

### 4.5 Submit for Review

1. Complete all required sections
2. Add app review information:
   - **Contact Information**: Your contact details
   - **Demo Account**: If needed for review
   - **Notes**: Any special instructions for reviewers

3. Submit for review
4. Review typically takes 1-7 days

## Step 5: Automated Submissions (Optional)

### For Android
1. Create Google Service Account:
   - Go to Google Cloud Console
   - Create service account
   - Download JSON key file
   - Grant permissions in Google Play Console

2. Configure EAS Submit:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

3. Submit automatically:
```bash
eas submit --platform android
```

### For iOS
Configure in eas.json:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

## Step 6: Post-Launch

### Monitor Performance
- Track downloads and user ratings
- Monitor crash reports in Expo dashboard
- Respond to user reviews promptly

### Updates
1. Make code changes
2. Update version in app.json
3. Build new version with EAS
4. Submit update to stores

### Version Management
- **Android**: Increment `versionCode` in app.json
- **iOS**: Increment `buildNumber` in app.json
- Update `version` for both platforms

## Troubleshooting

### Common Build Issues
- **Certificate errors**: Ensure proper signing certificates
- **Bundle ID conflicts**: Use unique bundle identifier
- **Missing permissions**: Add required permissions in app.json

### Common Submission Issues
- **Metadata rejection**: Ensure descriptions match app functionality
- **Missing privacy policy**: Required for both stores
- **Age rating issues**: Complete content rating accurately

## Timeline Estimate

### Google Play Store
- **Setup and build**: 1-2 days
- **Store listing**: 1 day
- **Review process**: 1-3 days
- **Total**: 3-6 days

### Apple App Store
- **Setup and build**: 1-2 days
- **Store listing**: 1-2 days
- **Review process**: 1-7 days
- **Total**: 3-11 days

## Cost Summary

### Development Tools
- Expo: Free (paid plans available for teams)
- EAS Build: Free tier available, paid plans for more builds

### App Store Fees
- Google Play Console: $25 one-time
- Apple Developer Program: $99/year

### Optional Services
- App Store Optimization tools
- Analytics services
- Push notification services

## Support Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)

## Next Steps

1. **Complete app development** with Supabase integration
2. **Test thoroughly** on both platforms
3. **Prepare all required assets** (icons, screenshots, descriptions)
4. **Follow this deployment guide** step by step
5. **Monitor and maintain** your published apps

Good luck with your app store submissions!