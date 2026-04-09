# Idea: Parachute Game

## One-Liner
A pixel-faithful web recreation of the 1981 Nintendo Game & Watch Parachute handheld, playable in any browser.

## Problem
The original Game & Watch Parachute (PR-21) is a piece of gaming history. Physical units are rare and fragile. Emulators exist but are heavyweight, require ROMs, and aren't designed for quick casual play. There is no quality, standalone, open-access web version that faithfully recreates the look, feel, timing, and mechanics of the original.

## Proposed Solution
A pure browser-based HTML5/Canvas game that reproduces the Parachute Game & Watch with 1:1 fidelity: the exact LCD aesthetic (pale green screen, silhouette sprites, LCD ghost effect), original timing and difficulty curves (Game A / Game B), score system, miss counter (3 misses = game over), shark appearances, and sound effects synthesized in Web Audio API. Deployed on Vercel, zero install, instant play.

## Audience
- Retro gaming enthusiasts who played the original as children
- Casual browser gamers seeking a quick session (commuters, lunch-breakers)
- Game historians and nostalgia collectors
- Developers and designers interested in faithful digital preservation

## Success Criteria
- Timing of paratrooper spawning and fall rate matches documented Game & Watch behavior within ±50ms
- All visual elements (helicopter, parachutists, boat, shark, water, palms, score, miss indicator) render faithfully
- Game A and Game B modes implemented
- Playable on desktop (keyboard), tablet (touch), and mobile (swipe/tap)
- < 200KB total bundle, loads in < 1s on 3G
- Deployed to Vercel with custom domain

## Platform
Web (Next.js / Vercel)

## Domain
Retro gaming / browser games

## Tech Preferences
Next.js 14 (App Router), TypeScript, HTML5 Canvas for game rendering, Web Audio API for sound, Tailwind for the surrounding UI shell, Framer Motion for the device frame animations. Vercel deployment.
