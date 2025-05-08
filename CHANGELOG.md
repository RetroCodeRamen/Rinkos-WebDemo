# Changelog

## [Unreleased]

### Added
- RinkoScript development environment (in progress)
  - Basic script editor interface
  - Save/Load functionality for scripts
  - Output display area
  - Note: Lua execution is currently not functional

### Changed
- Removed "System Info" option from main menu to reduce clutter
- Improved power-off overlay styling and interaction
- Enhanced startup animation sequence

### Fixed
- Power-on functionality after system shutdown
- Clock display and time synchronization
- Chat UI improvements and scrolling behavior

## [0.1.0] - 2024-03-19

### Added
- Initial release of RinkOS
- Basic menu system
- Chat functionality
  - Bunny Den (public chat)
  - Direct messaging
  - Active users list
- Settings menu
  - Username configuration
  - Device time setting
- Startup animation
- Power on/off sequence

## [0.01.0524] - 2024-05-24
### Added
- Bunnygram (bi-directional direct messaging) with minimal, e-ink friendly UI
- Bunny Den (main chatroom) with live updating and smooth scrolling
- Power Off overlay: device starts "off" and powers on with user interaction
- Startup animation: Rinko logo slides in, startup chime plays, then menu appears

### Changed
- Startup chime now plays only after user interaction and only once
- Logo animation is larger, slower, and holds for 4 seconds before fading out
- Chat and Bunnygram input fields preserve focus and cursor during polling
- UI and chat windows have fixed width and improved sizing for e-ink displays

### Fixed
- Bunnygram now shows all messages between two users (bi-directional)
- Prevented double startup chime and logo animation glitches
- Chat and Bunnygram scrolling and message loading are stable

---

Older changes are not tracked in this changelog. 