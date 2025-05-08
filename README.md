# RinkOS Web Demo

RinkOS is a retro-inspired operating system mockup, designed to revive the spirit of the classic Cybiko device for a modern world. This project is a web-based simulation of the RinkOS UI and core features, serving as a prototype for a future hardware implementation on ESP32 with LoRaWAN capabilities.

## Versioning System
- **Format:** `major.iteration.datecode` (e.g., `0.01.0524`)
  - **major:** Major version (0 = beta, 1 = first full release)
  - **iteration:** Feature iteration (e.g., .01 = first iteration)
  - **datecode:** Month and year of the release (MMYY)
- **Current Version:** `0.01.0524` (early beta, May 2024)

## Project Status & Roadmap
RinkOS is in early beta and missing many features. The goal for **version 1.0** is to include the following key features:

### Planned Features for 1.0
- **You & Me:** User profiles and social connections
- **Chat:** ✅ Real-time device-to-device messaging (broadcast and direct)
- **E-Mail:** Basic email client
- **CyCommunity:** Discovery of nearby users
- **Address/Phone Book**
- **Graphic Editor**
- **Organizer:** Calendar and scheduling
- **Settings:** Device configuration and preferences
- **Web Page System:** Super simple markup language and internal DNS for device-hosted pages
- **Lua Interpreter:** Ability to run simple Lua scripts

Once all these features are implemented, RinkOS will be considered version 1.0.

## Project Goals
- **Nostalgia Reimagined:** Bring back the fun and community of early 2000s handheld mesh devices like the Cybiko, with a modern twist.
- **Web-Based Mockup:** Simulate the RinkOS user experience in the browser, including:
  - E-ink style UI
  - Boot and menu screens
  - Chat rooms and instant messaging
  - Peer list and system info
  - Keyboard and on-screen navigation
- **Future Hardware:** The ultimate goal is to port RinkOS to real hardware (ESP32 + e-ink + LoRaWAN), enabling mesh communication and a suite of retro-inspired applications.

## Features (Current Beta)
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

## Timeline & Development Pace
- **Estimated time to 1.0:**
  - Average 2.5 hours/week
  - Estimated 1-6 hours/week depending on feature complexity
  - Project started: May 2024
  - **Rough estimate:** 6-12 months to reach 1.0, depending on available time and feature scope
- **Current time spent:** ~3 hours

---

**RinkOS** is a fun, open-source project to bring back the magic of social, hackable handhelds for a new generation! 