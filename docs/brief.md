# Project Brief: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09  
**Status**: Approved

---

## Executive Summary

Parachute is a browser-based faithful recreation of Nintendo's 1981 Game & Watch Parachute (model PR-21), one of the best-selling handhelds of the original Wide Screen series. The product targets retro gaming enthusiasts, casual browser players, and digital preservation advocates who want to experience this piece of gaming history without owning physical hardware, downloading ROMs, or running a heavyweight emulator. The game runs entirely in the browser — a single URL, instant load, zero friction — and preserves the exact visual language of the original: pale LCD screen, silhouette sprites, seven-segment score display, and the iconic helicopter-parachutist-boat-shark gameplay loop. It is deployed on Vercel as a performant static-first Next.js app.

---

## Problem Statement

### Current State
The Nintendo Game & Watch Parachute (1981) is a culturally significant artifact of gaming history. Original physical units change hands on eBay for $30–$150+, are increasingly fragile, and require specific battery sizes. The broader Game & Watch catalog has seen modest resurgence via the Nintendo Game & Watch: Ball re-release (2020) and the Zelda/Mario Game & Watch units (2021), proving collector demand is real and growing.

### Pain Points
- **Physical scarcity**: Working original units are collector items. Most people will never own one.
- **Emulators are overkill**: MAME and similar emulators work but require ROM files (legal grey area), configuration, and desktop installation. They're not designed for casual web access.
- **Existing web clones are low-quality**: The handful of JavaScript recreations that exist cut corners. Wrong timing. Wrong aesthetic. No authentic LCD ghost effect. No sound. Often not mobile-friendly.
- **Preservation gap**: The original game's exact timing, spawn rates, and difficulty curve are documented by the Game & Watch community but haven't been codified into a reference-quality browser implementation.

### Impact Analysis
Someone who grew up in the early 1980s wants to show their child what they played. They search "parachute game watch online". They find a mediocre Flash-era clone or an emulator setup guide. The moment of nostalgia is killed by friction. The preservation opportunity is wasted.

### Why Existing Solutions Fall Short

| Solution | Gap |
|----------|-----|
| Physical unit | Expensive, fragile, inaccessible |
| MAME emulator | Complex setup, ROM required, not browser-native |
| Existing JS clones | Poor fidelity, no LCD aesthetic, broken timing, no sound |
| Nintendo re-releases | Only covers selected titles; Parachute not included |

---

## Proposed Solution

A standalone Next.js web app that renders the game on an HTML5 Canvas. The canvas faithfully simulates the original LCD display: pale sage-green background (`#b8c9a3`), hard black silhouette sprites at discrete positions (not free-moving), and the characteristic LCD "ghost" effect where previous sprite positions linger at reduced opacity before clearing. Game mechanics replicate documented behavior: the helicopter traverses right to left and drops parachutists at defined intervals, parachutists fall through three vertical zones, the player's boat moves between five horizontal positions, catch = score point, miss = shark eats parachutist + MISS indicator, three misses = GAME OVER. Game B increases speed. Sound is synthesized via Web Audio API — catch blip, miss buzz, game-over jingle.

### Key Differentiators
- **Reference fidelity**: Sprite positions, timing intervals, and difficulty curve sourced from documented Game & Watch teardowns and community research.
- **LCD simulation**: Ghost effect, screen tint, and pixel-off visibility matching real hardware look.
- **Sound**: Web Audio API synthesis, not sampled audio — keeping bundle tiny and authentic to the era.
- **Device frame**: The browser renders not just the game but the full physical device aesthetic — cream plastic bezel, rose-tinted screen surround, PARACHUTE / WIDE SCREEN labels, GAME A label.
- **Zero friction**: No install. No account. One URL. Works on phone.

---

## Target Users

### Persona 1: Marco, 48 — The Nostalgic Parent
Marco was 6 when his older brother got a Game & Watch Parachute in 1982. He remembers the sound of the catch blip vividly. He has two kids now and wants to show them what video games looked like before consoles. He's not a gamer anymore — he's on his phone, he doesn't install apps. If you tell him there's a browser version of Parachute he can just open, he'll play it for ten minutes and feel something. He needs zero-friction access, authentic feel, and a way to share the URL with his kids.

**Goals**: Reconnect with childhood memory, share cultural context with his kids  
**Frustrations**: Downloads, accounts, anything that breaks the nostalgia bubble  
**Context**: Mobile phone, probably Safari, 5 minutes of free time

### Persona 2: Yuki, 29 — The Retro Gaming Collector
Yuki runs a small YouTube channel reviewing Game & Watch hardware. She owns three physical units but not Parachute. She would use a faithful web recreation as a reference and for content creation — comparing the web version to documented sources, embedding it in videos, linking from her channel. She cares intensely about accuracy. If the timing is off by 20%, she will notice and she will post about it.

**Goals**: Reference-quality recreation, shareable URL for content  
**Frustrations**: Inaccurate clones, missing LCD aesthetic, wrong game speed  
**Context**: Desktop Chrome, researching, high attention

### Persona 3: Priya, 22 — The Casual Lunch-Breaker
Priya doesn't know what Game & Watch is. She clicked a Reddit link that said "someone recreated an old 1981 Nintendo game in the browser." She's mildly curious, she has three minutes. She needs the game to be immediately understandable — you move the boat, catch the people. She'll play one or two rounds and either bookmark it or forget it. She plays on her phone.

**Goals**: Quick fun, immediate comprehension, no reading required  
**Frustrations**: Tutorial walls, anything that takes more than two seconds to start  
**Context**: Mobile, low commitment, discovery mode

---

## Competitive Landscape

### Direct Competitors

**1. MAME / RetroArch Web (Internet Archive)**  
MAME emulates Game & Watch perfectly but requires ROM uploads, browser plugin permissions, and setup time. The Internet Archive hosts some G&W ROMs via MAME in the browser — but it's buried, slow to load, and the UX is hostile. Fidelity: high. Accessibility: near zero.

**2. Existing JS Clones (various)**  
A search for "parachute game watch online" surfaces 3–4 clones from 2008–2015. Common problems: Flash-era code ports (now broken), wrong LCD color, no ghost effect, incorrect timing, no sound, desktop-only, and no visible source. These are abandonware.

**3. Nintendo's Official Re-releases**  
Nintendo released hardware re-issues (Ball 2020, Mario/Zelda 2021) with built-in LCD games. Parachute was not included. Nintendo has no official browser play option for any Game & Watch title. No competition here but signals the IP landscape.

### Adjacent Competitors (browser retro games)
- **Pico-8 games on itch.io**: Higher fidelity retro aesthetic, but different genre and audience
- **Classic Reload**: Hosts DOS and console ROMs; legal grey zone; not preserved-first
- **Emularity / JS games on Internet Archive**: Same problem as MAME — power-user only

### Competitive Summary
There is no quality, faithful, mobile-friendly, zero-friction browser recreation of Parachute. The gap is real and uncontested.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Parachutist spawn timing | ±50ms of documented hardware timing |
| Bundle size | < 200KB uncompressed |
| Time to interactive | < 1.5s on 3G (Lighthouse) |
| Mobile usability score | ≥ 90 (Lighthouse) |
| Accessibility score | ≥ 85 (Lighthouse) |
| Game A + Game B | Both implemented |
| Miss system | 3 misses → GAME OVER, visually accurate |
| Sound | Catch, miss, game-over events with synthesized audio |

---

## MVP Scope

### In Scope
- Game A and Game B modes
- Helicopter traversal (right-to-left, periodic)
- Parachutist spawning, 3-zone fall, catch/miss logic
- Boat movement (5 positions, keyboard + touch)
- Score display (7-segment style, up to 999)
- Miss counter (3 = game over)
- Shark animation on miss event
- MISS text overlay on miss
- LCD ghost/persistence effect
- Web Audio API sound synthesis
- Full device frame (cream bezel, screen surround, labels)
- Game A / B mode selector
- Mobile-responsive (portrait phone to 1440p desktop)
- Vercel deployment

### Out of Scope (v1)
- Game C or Time mode
- High score persistence (no backend)
- Multiplayer
- Custom difficulty tuning
- Accessibility mode (motion reduction) — noted for v2
- PWA / offline mode — noted for v2

---

## Tech Preferences

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3 (strict)
- **Rendering**: HTML5 Canvas 2D API
- **Audio**: Web Audio API (OscillatorNode, GainNode)
- **Styling**: Tailwind CSS 3.4
- **Deployment**: Vercel (Edge Network)
- **Testing**: Vitest + @testing-library/react

---

## Go-to-Market

This is an open-source preservation project, not a commercial product. Distribution strategy:

1. **Reddit**: Post to r/gameandwatch, r/retrogaming, r/webdev with a "I built this" post
2. **Twitter/X**: Tag Game & Watch collector communities
3. **GitHub**: Open source (MIT) for preservation and community contribution
4. **Hacker News**: "Show HN: Faithful Game & Watch Parachute in the browser"
5. **YouTube community**: Reach out to Game & Watch content creators with shareable link

No paid marketing. No monetization. The URL is the product.
