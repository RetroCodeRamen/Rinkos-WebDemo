# RinkOS Web Demo

RinkOS is a retro-inspired operating system mockup, designed to revive the spirit of the classic Cybiko device for a modern world. This project is a web-based simulation of the RinkOS UI and core features, serving as a prototype for a future hardware implementation on ESP32 with LoRaWAN capabilities.

## Project Goals
- **Nostalgia Reimagined:** Bring back the fun and community of early 2000s handheld mesh devices like the Cybiko, with a modern twist.
- **Web-Based Mockup:** Simulate the RinkOS user experience in the browser, including:
  - E-ink style UI
  - Boot and menu screens
  - Chat rooms and instant messaging
  - Peer list and system info
  - Keyboard and on-screen navigation
- **Future Hardware:** The ultimate goal is to port RinkOS to real hardware (ESP32 + e-ink + LoRaWAN), enabling mesh communication and a suite of retro-inspired applications.

## Features
- **Monochrome, retro UI** (e-ink simulation)
- **Boot and main menu** with keyboard navigation
- **Chat rooms** (broadcast messaging)
- **Instant messages** (direct user-to-user messaging)
- **Live peer list** (shows active users)
- **Settings** (change username, set device time)
- **Backend** (Node.js/Express, file-based JSON storage)

## How to Run
1. Clone this repo and install dependencies:
   ```bash
   git clone https://github.com/RetroCodeRamen/Rinkos-WebDemo.git
   cd Rinkos-WebDemo
   npm install
   ```
2. Start the backend:
   ```bash
   npm start
   ```
3. Open `index.html` in your browser to use the web demo.

## Roadmap
- Port to ESP32 hardware with e-ink display and keypad
- Add LoRaWAN mesh networking
- Expand the suite of applications (games, notes, file sharing, etc.)
- Enhance security and user authentication

---

**RinkOS** is a fun, open-source project to bring back the magic of social, hackable handhelds for a new generation! 