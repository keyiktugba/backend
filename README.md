# 📱 Word Mines

**Mobile Game Development Project**

## 📝 Project Summary

Word Mines is a dynamic, real-time, two-player mobile word game. Developed using React Native and Node.js in a client-server architecture, the game provides a fun platform where users are matched randomly to form words from letters, with added mechanics like mines and bonuses.

### 🔑 Keywords
Mobil development · Dynamic gameplay · Client-server · React Native · Node.js · TypeScript · WebSocket · MongoDB Atlas · Expo Go

---

## 📲 Technologies

### 🖥️ Backend - Node.js + Express

- **Express.js** – Building RESTful APIs
- **Mongoose** – MongoDB data modeling
- **Dotenv** – Environment variables
- **Cors** – Cross-Origin request support
- **Socket.IO** – Real-time multiplayer game infrastructure
- 
### 🎨 Frontend - React Native (Expo)

- **React Native** – Mobile app components (View, Text, StyleSheet)
- **Expo** – Fast development and testing
- **expo-router** – Page routing system
- **expo-linear-gradient** – Background transition effects
- **@react-native-async-storage/async-storage** – Local data storage
- **Moti / react-native-reanimated** – Animations
- **react-native-safe-area-context** – Safe area support
- **axios** – API requests
- **TypeScript** – Type safety and readable code
- **FlatList, ScrollView, Alert, ActivityIndicator, Pressable, Dimensions** – UI components

### ☁️ Development Environment

- **MongoDB Atlas** – Cloud database
- **Render** – Backend server hosting
- **Expo Go** – Mobile app testing tool

---

## 🎮Game Mechanics

- Users sign up and log in to access the game.
- Players are matched randomly to start a game.
- Each player is given 7 letters.
- Each player has 2 pass rights; using both results in a loss.
- A player who surrenders is considered defeated.
- The game has a limited pool of 100 letters.
- Mines and bonuses are placed at random coordinates.
- Scores are calculated based on moves; the player with the highest score wins.

---

## 📦 Setup
### 1. Backend
```bash
npm install
npm run dev
```
### 2. Frontend 
```bash
npm install
npx expo start
```


Frontend Project Link: https://github.com/caglagok/my-app
