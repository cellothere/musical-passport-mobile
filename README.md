# Musical Passport

Explore music from every country in the world. Spin the globe, pick a country, and discover artists, genres, and tracks you've never heard before.

## Running it yourself

**Prerequisites:** Node.js, the [Expo Go](https://expo.dev/client) app on your phone (iOS or Android)

```bash
git clone https://github.com/cellothere/musical-passport-mobile.git
cd musical-passport-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. It connects to the live backend automatically.

## Optional: point to your own backend

The app defaults to the hosted API. If you want to run your own:

```bash
cp .env.example .env
# set EXPO_PUBLIC_API_URL=http://your-server:3000
```

The backend source is not included in this repo, but the API is straightforward REST — see `services/api.ts` for all endpoints.

## Features

- 3D interactive globe — spin, drag, two-finger rotate
- Music recommendations by country, genre, and decade
- Artist cards with images, genre exploration, and "go deeper" trails
- Time Machine — explore a country's sound from any era
- Sound Alike — find global artists similar to ones you know
- Music Passport — insights on your listening DNA
- Spotify and Apple Music integration
