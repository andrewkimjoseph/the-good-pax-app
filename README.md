# The Good Pax App

The place where **Canvassing (Pax)** and **GoodDollar** meet.

A decentralized application (dApp) for claiming Universal Basic Income (UBI) on the GoodDollar protocol, built on the Celo blockchain. The Good Pax App helps verified humans claim daily **G$**, and discover **Pax**—where users can complete tasks and earn **G$ and stablecoins**.

## Overview

The Good Pax App is your gateway to Universal Basic Income (UBI) on the Celo blockchain. It's a user-friendly web application that allows verified users to:

- **Claim Daily UBI**: Get free G$ (GoodDollar) tokens every single day
- **Pax (Canvassing)**: Complete tasks and earn G$ and stablecoins
- **Swap Tokens**: Exchange G$ tokens for other cryptocurrencies
- **Human Verification**: Secure facial verification ensures one person = one account

### Pax links

- Pax Web: https://thepax.site
- Pax Android: https://thepax.app/thegoodpaxapp

## 🚀 Features

### Core Functionality

- **Daily UBI Claims**: Users can claim their Universal Basic Income daily after completing verification
- **Pax (Canvassing)**: Discover Pax and complete tasks to earn G$ and stablecoins
- **Wallet Integration**: Support for multiple wallets including MetaMask, WalletConnect, Valora, Rabby, and injected wallets
- **Human Verification**: Integration with GoodDollar's identity verification system to prevent abuse
- **Farcaster MiniApp**: Native integration with Farcaster for seamless social media experience
- **Transaction Notifications**: Real-time transaction status updates via BlockScout integration

> Note: the historical engagement rewards program has ended (cap reached). The `/engage` route is kept as an informational page.

### Technical Features

- **Multi-Analytics**: Comprehensive event tracking via PostHog, Vercel Analytics, Meta Pixel, and TikTok Pixel
- **Ad Attribution**: Facebook Click ID (fbclid) tracking for ad campaign attribution
- **Error Monitoring**: Sentry integration for error tracking and monitoring
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation for robust development

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 19.1.2
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Blockchain**: Celo Network
- **Wallet Integration**: Wagmi 2.16.9, RainbowKit 2.2.8
- **Blockchain Client**: Viem 2.37.1
- **GoodDollar SDKs**:
  - `@goodsdks/citizen-sdk`: ^1.2.2 (UBI claiming)
  - `@goodsdks/identity-sdk`: ^1.0.5 (Human verification)
- **Analytics**: PostHog, Vercel Analytics, Meta Pixel, TikTok Pixel
- **Error Tracking**: Sentry (@sentry/nextjs)
- **UI Components**: Radix UI, Lucide React icons

### Project Structure

```
the-good-pax-app/
├── front-end/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── claim/             # UBI claiming page
│   │   ├── engage/            # Engagement program ended (info)
│   │   ├── onboarding/        # User onboarding flow
│   │   ├── api/               # API routes
│   │   │   └── getAppSignature/  # (Legacy) signature generation
│   │   └── .well-known/       # Farcaster configuration
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── Providers.tsx      # Wallet & query providers
│   │   ├── Header.tsx         # Navigation header
│   │   └── Footer.tsx         # Footer component
│   ├── services/              # Business logic services
│   │   ├── analytics.ts       # Analytics service
│   │   ├── checkWalletVerification.ts  # Verification logic
│   │   ├── getAppSignature.ts # Signature helper
│   │   └── fbclid.ts          # Facebook attribution
│   ├── middleware.ts          # Next.js middleware (onboarding redirect)
│   ├── next.config.ts         # Next.js configuration
│   └── package.json           # Dependencies
└── README.md                  # This file
```

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 20 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: For version control
- **Crypto Wallet**: MetaMask, Valora, or any Web3 wallet compatible with Celo
- **Environment Variables**: See [Environment Setup](#environment-setup)

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd the-good-pax-app
   ```

2. **Navigate to the front-end directory**:
   ```bash
   cd front-end
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables** (see [Environment Setup](#environment-setup)):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Setup

Create a `.env.local` file in the `front-end/` directory with the following variables:

### Required Variables

```env
# App Configuration
NEXT_PUBLIC_APP_ADDRESS=0x...          # Your app's Ethereum address
NEXT_PUBLIC_INVITER_ADDRESS=0x...      # (Legacy) inviter address (engagement)

# (Legacy) Backend API for engagement signatures
APP_PRIVATE_KEY=0x...                   # Private key for app signature (server-side only)
REWARDS_CONTRACT=0x...                  # Rewards contract address

# Blockchain RPC
NEXT_PUBLIC_DRPC_API_KEY=your_drpc_key # DRPC API key for Celo RPC

# Analytics (Optional but recommended)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Meta Pixel (Optional)
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id

# TikTok Pixel (Optional)
NEXT_PUBLIC_TIKTOK_PIXEL_ID=your_tiktok_pixel_id

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=canvassing
SENTRY_PROJECT=thegoodpaxapp
```

### Security Notes

- **Never commit** `.env.local` to version control
- **APP_PRIVATE_KEY** should only be used server-side (in API routes)
- Keep all private keys secure and rotate them regularly

## 🎮 Usage

### For Users

1. **Visit the app**: Navigate to the deployed URL or `http://localhost:3000`
2. **Complete onboarding**: First-time users will see an onboarding flow explaining the app
3. **Connect wallet**: Click to connect your Web3 wallet (MetaMask, Valora, etc.)
4. **Get verified**: Complete facial verification to prove you're human
5. **Claim UBI**: Once verified, claim your daily UBI from the home page
6. **Explore Pax**: Complete tasks in Pax and earn G$ and stablecoins
7. **Swap tokens**: Exchange G$ for other cryptocurrencies via the swap link

### For Developers

#### Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run BrowserStack tests
npm run test:browserstack
```

#### Key Pages

- **`/`**: Home page with wallet connection and main actions
- **`/onboarding`**: First-time user onboarding flow
- **`/claim`**: Daily UBI claiming interface
- **`/engage`**: Engagement rewards program ended (info)

#### API Routes

- **`/api/getAppSignature`**: (Legacy) POST endpoint for generating app signatures (engagement)
  - Requires: `user`, `validUntilBlock`, `inviter` (optional)
  - Returns: `signature` (hex string)

## 🔐 Security & Verification

### Human Verification Flow

1. User connects wallet
2. App checks verification status via GoodDollar Identity SDK
3. If not verified, user is redirected to complete facial verification
4. Once verified, user can claim UBI

## 📊 Analytics & Tracking

The app includes comprehensive analytics tracking:

### Events Tracked

- **Page Views**: Home, Claim, Engage, Onboarding
- **User Actions**: Wallet connections, verification completions
- **Transactions**: UBI claims (and historical engagement events)
- **Ad Attribution**: Facebook Click ID (fbclid) tracking for ad campaigns

### Analytics Providers

- **PostHog**: Product analytics and user behavior
- **Vercel Analytics**: Performance and usage metrics
- **Meta Pixel**: Facebook ad conversion tracking
- **TikTok Pixel**: TikTok ad conversion tracking

All analytics events are tracked via the centralized `analytics` service in `services/analytics.ts`.

## 🌐 Blockchain Integration

### Network

- **Primary Network**: Celo Mainnet
- **Chain ID**: 42220
- **RPC Provider**: DRPC (configurable)

### Smart Contracts

- **GoodDollar Protocol**: UBI distribution contract
- **Identity Contract**: Human verification contract

### Wallet Support

- MetaMask
- WalletConnect
- Valora (Celo native wallet)
- Rabby Wallet
- Injected wallets (browser extensions)

## 🧪 Testing

### BrowserStack Testing

The project includes BrowserStack integration for cross-browser testing:

```bash
npm run test:browserstack
```

Ensure your BrowserStack credentials are configured in environment variables.

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables in Production

Ensure all required environment variables are set in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Other platforms: Follow their respective documentation

## 📱 Farcaster Integration

The app includes native Farcaster MiniApp support:

- **Configuration**: `/app/.well-known/farcaster.json/route.ts`
- **Integration**: `components/FarcasterMiniAppIntegration.tsx`
- **Metadata**: Configured in `app/layout.tsx`

Users can launch the app directly from Farcaster with seamless wallet integration.

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Ensure you're on the Celo network
   - Check that your wallet supports Celo
   - Try refreshing the page

2. **Verification Not Working**
   - Clear browser cookies and cache
   - Ensure you're using a supported browser
   - Check network connectivity

3. **Transaction Reverts**
   - Verify you have sufficient gas (CELO) in your wallet
   - Check if you've already claimed (cooldown period)
   - Ensure you're verified and whitelisted

4. **Analytics Not Tracking**
   - Check browser console for errors
   - Verify environment variables are set correctly
   - Ensure ad blockers aren't blocking tracking scripts

### Debug Mode

Enable debug logging by checking browser console. The app logs important events and errors for debugging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration provided
- Maintain consistent formatting with Prettier
- Write meaningful commit messages

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- **GoodDollar**: For the UBI protocol and SDKs
- **Celo**: For the blockchain infrastructure
- **Canvassing**: For project development and maintenance
- **Farcaster**: For MiniApp integration support

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues**: Open an issue in the repository
- **Documentation**: Check the inline code documentation
- **GoodDollar Docs**: [https://docs.gooddollar.org](https://docs.gooddollar.org)

## 🔄 Version History

- **v1.2.0** (Current)
  - Pivot to Canvassing (Pax) x GoodDollar hub
  - Engagement rewards program ended; `/engage` is informational
  - Updated onboarding + home messaging

## 🗺️ Roadmap

Future enhancements may include:

- [ ] Multi-chain support
- [ ] Enhanced analytics dashboard
- [ ] Social features and referrals
- [ ] Improved UI/UX based on user feedback

---

**Built with ❤️ by Canvassing**

*Empowering financial inclusion through Universal Basic Income*
