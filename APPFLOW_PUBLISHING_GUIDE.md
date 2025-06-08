# Publishing Tapee Cement Loyalty App using Ionic Appflow

## Overview
This guide covers publishing your app to both Google Play Store and Apple App Store using Ionic Appflow for iOS builds (since you don't have a Mac).

## Prerequisites

### 1. Ionic Appflow Account
- Sign up at [Ionic Appflow](https://ionic.io/appflow)
- Choose a plan that includes native builds (starts at $29/month)
- You'll need this for iOS builds without a Mac

### 2. Developer Accounts
- **Google Play Console**: $25 one-time fee
- **Apple Developer Account**: $99/year

## Step 1: Prepare Your App

### Update Capacitor Config for Production
Your `capacitor.config.ts` is already configured correctly. Make sure you have:

```typescript
const config: CapacitorConfig = {
  appId: 'com.tapeecement.loyalty',
  appName: 'Tapee Cement Loyalty',
  webDir: 'dist',
  // ... rest of config
};
```

### Build Production Assets
```bash
npm run build
npx cap sync
```

## Step 2: Setup Ionic Appflow

### 2.1 Connect Your Repository
1. Go to [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
2. Click "New App"
3. Connect your Git repository (GitHub, GitLab, etc.)
4. Select your project

### 2.2 Configure Build Settings
1. In Appflow dashboard, go to "Build" → "Environments"
2. Create production environment
3. Add environment variables if needed:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

## Step 3: Android Build (Google Play Store)

### 3.1 Generate Android Signing Key
```bash
# Install Java if not already installed
# Then generate keystore
keytool -genkey -v -keystore tapee-loyalty.keystore -alias tapee-loyalty -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save these details securely:
- Keystore password
- Key alias: `tapee-loyalty`
- Key password
- Keystore file location

### 3.2 Configure Android Build in Appflow
1. In Appflow, go to "Build" → "Android"
2. Upload your keystore file
3. Enter keystore details:
   - Keystore password
   - Key alias: `tapee-loyalty`
   - Key password
4. Select build type: "Release"
5. Target: "AAB" (Android App Bundle)

### 3.3 Trigger Android Build
1. Click "Build Now"
2. Wait for build completion (usually 5-10 minutes)
3. Download the AAB file

### 3.4 Upload to Google Play Console

1. **Create App in Google Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - App details:
     - Name: "Tapee Cement Loyalty"
     - Default language: English
     - App type: App
     - Category: Business

2. **Upload App Bundle**
   - Go to "Release" → "Production"
   - Upload your AAB file from Appflow
   - Add release notes

3. **Complete Store Listing**
   ```
   Short description:
   Loyalty rewards program for Tapee Cement customers. Earn points, redeem rewards.

   Full description:
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

4. **Upload Assets**
   - App icon: Use `public/icons/icon-512x512.png`
   - Screenshots: Take 2-8 screenshots of your app
   - Feature graphic: 1024x500 promotional image

5. **Content Rating & Policies**
   - Complete content rating questionnaire
   - Add privacy policy URL: `https://tapeecement.netlify.app/privacy`
   - Target audience: Adults

## Step 4: iOS Build (Apple App Store via Appflow)

### 4.1 Apple Developer Account Setup
1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/)
2. Pay $99 annual fee
3. Complete enrollment process

### 4.2 Create App Store Connect Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. App Information:
   - Name: "Tapee Cement Loyalty"
   - Bundle ID: `com.tapeecement.loyalty`
   - SKU: `tapee-cement-loyalty`
   - Primary Language: English

### 4.3 Generate iOS Certificates in Appflow
1. In Appflow dashboard, go to "Build" → "iOS"
2. Click "Generate Certificate"
3. Follow Appflow's guided process to:
   - Generate iOS Distribution Certificate
   - Create App Store Provisioning Profile
   - Appflow will handle the Apple Developer portal integration

### 4.4 Configure iOS Build
1. In Appflow, select iOS build
2. Choose "App Store" build type
3. Select your certificate and provisioning profile
4. Build configuration: "Release"

### 4.5 Trigger iOS Build
1. Click "Build Now"
2. Wait for build completion (usually 10-15 minutes)
3. Appflow will automatically upload to App Store Connect

### 4.6 Complete App Store Listing
1. In App Store Connect, go to your app
2. Complete app information:
   ```
   Subtitle: Cement Loyalty Rewards

   Description:
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

3. **Upload Screenshots**
   - iPhone screenshots (multiple sizes required)
   - iPad screenshots (if supporting iPad)
   - Use your app's actual screens

4. **App Review Information**
   - Contact information
   - Demo account (if needed)
   - Review notes

## Step 5: App Store Assets Creation

### Screenshots Needed
Take screenshots of these key screens:
1. **Login/Registration screen**
2. **Dashboard with points balance**
3. **Get Points screen**
4. **Rewards catalog**
5. **Transaction history**
6. **Profile management**

### Asset Specifications

**Google Play Store:**
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: 1080x1920 (portrait) or 1920x1080 (landscape)

**Apple App Store:**
- App icon: 1024x1024 PNG
- Screenshots: Various sizes for different devices
  - iPhone 6.7": 1290x2796
  - iPhone 6.5": 1242x2688
  - iPhone 5.5": 1242x2208

## Step 6: Privacy Policy & Legal

### Create Privacy Policy
Create a privacy policy at `https://tapeecement.netlify.app/privacy` covering:

```
TAPEE CEMENT LOYALTY APP PRIVACY POLICY

1. INFORMATION WE COLLECT
- Personal information (name, email, phone, address)
- Purchase data and transaction history
- Device information and usage analytics

2. HOW WE USE INFORMATION
- Process loyalty points and rewards
- Verify dealer transactions
- Improve app functionality
- Send important notifications

3. INFORMATION SHARING
- We do not sell personal information
- Share with authorized dealers for verification
- Comply with legal requirements

4. DATA SECURITY
- Encrypted data transmission
- Secure cloud storage
- Regular security audits

5. YOUR RIGHTS
- Access your data
- Request data deletion
- Update personal information

Contact: support@tapeecement.com
```

## Step 7: Submission & Review

### Google Play Store
1. Submit for review
2. Review time: 1-3 days
3. Monitor for any policy violations
4. Respond to review feedback if needed

### Apple App Store
1. Submit for review in App Store Connect
2. Review time: 1-7 days
3. More strict review process
4. May require additional information

## Step 8: Post-Launch

### Monitor Performance
- Track downloads and user ratings
- Monitor crash reports in Appflow
- Respond to user reviews

### Updates via Appflow
1. Make code changes
2. Push to your repository
3. Trigger new build in Appflow
4. Upload to respective stores

## Appflow Pricing

### Build Plans
- **Starter**: $29/month - 100 builds
- **Growth**: $99/month - 1000 builds
- **Scale**: $199/month - Unlimited builds

### Free Trial
- 14-day free trial available
- Includes native builds for testing

## Troubleshooting Common Issues

### Android Build Failures
- Check keystore file format
- Verify environment variables
- Ensure proper Capacitor sync

### iOS Build Failures
- Certificate/provisioning profile issues
- Bundle ID mismatch
- Missing required permissions

### App Store Rejections
- Privacy policy missing or inadequate
- App crashes or doesn't function properly
- Metadata doesn't match app functionality

## Timeline Estimate

### With Appflow
- **Setup**: 1-2 days
- **Android build & submission**: 1 day
- **iOS build & submission**: 1-2 days
- **Review process**: 1-7 days each
- **Total**: 4-12 days

## Cost Summary

### Monthly Costs
- Appflow subscription: $29-199/month
- Apple Developer: $99/year
- Google Play: $25 one-time

### Benefits of Appflow
- No Mac required for iOS builds
- Automated build process
- Easy certificate management
- Continuous integration
- Build history and logs

## Next Steps

1. **Sign up for Appflow** (start with free trial)
2. **Connect your repository**
3. **Generate Android keystore**
4. **Create developer accounts**
5. **Follow this guide step by step**

This approach will let you publish to both app stores without needing a Mac computer. Appflow handles all the complex iOS build processes for you!