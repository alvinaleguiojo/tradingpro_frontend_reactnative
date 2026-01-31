# Trading Pro - React Native Mobile Trading App

A professional mobile trading application for XAUUSD (Gold vs US Dollar) built with React Native and Expo.

## Features

- **Real-time Price Display** - Live price updates with bid/ask spread
- **Buy & Sell Trading** - Quick trade execution with customizable lot sizes
- **Account Dashboard** - View balance, equity, margin, and P/L
- **Trade History** - Filter by open/closed positions with profit tracking
- **Professional Dark Theme** - Modern UI with gradient effects

## Screenshots

The app features:
- Dark professional trading theme
- Animated price changes
- Quick lot size selection
- Trade confirmation modal with SL/TP options
- Bottom navigation bar

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the project folder:
   ```bash
   cd mobile_trading_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app on your phone

## Project Structure

```
mobile_trading_app/
├── App.js                      # Main application entry
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── babel.config.js             # Babel configuration
├── assets/                     # App icons and images
└── src/
    ├── components/
    │   ├── Header.js           # App header with logo
    │   ├── AccountCard.js      # Account summary card
    │   ├── PriceDisplay.js     # XAUUSD price display
    │   ├── TradingButtons.js   # Buy/Sell buttons
    │   ├── TradeHistory.js     # Trade history list
    │   └── TradeModal.js       # Trade execution modal
    └── data/
        └── mockData.js         # Mock trading data
```

## Mock Data

The app uses simulated data including:
- Account balance of $25,000
- Real-time price fluctuations
- Sample trade history with open/closed positions
- Realistic XAUUSD price range (~$2040-2050)

## Technologies Used

- React Native
- Expo
- Expo Linear Gradient
- React Native Safe Area Context
- @expo/vector-icons

## Future Enhancements

- Real API integration
- Multiple trading pairs
- Charts and technical indicators
- Push notifications
- Order management (modify/close trades)
- Authentication system

## License

MIT License
