# Brand Identity: Parachute Game

**Version**: 1.0  
**Date**: 2026-04-09

---

## Brand Strategy

### Archetype: The Sage + The Innocent
Parachute sits at the intersection of two archetypes. The Sage — because this is a preservation project, a faithful witness to something that happened, accurate and respectful of history. The Innocent — because Game & Watch is joy distilled to its purest form. One button. One goal. Pure play. The brand doesn't try to be cool or modern. It steps aside and lets the original speak.

### Personality
- **Faithful** — no creative license taken with the source material. What you see is what Nintendo made in 1981.
- **Quiet** — no marketing noise. The game is the product. No popups, no tracking, no upsell.
- **Nostalgic without being sentimental** — the tone is fond, not saccharine. We remember this thing clearly, not through a soft-focus lens.
- **Precise** — timing, color, and sprite geometry sourced from documented hardware behavior.

### Voice & Tone Matrix

| Context | Voice | Example DO | Example DON'T |
|---------|-------|-----------|--------------|
| Page title | Direct, sparse | "Parachute" | "Parachute: The Ultimate Retro Experience" |
| Instructions | Minimal, assumed | "← → to move" | "Welcome! Here's how to play our exciting game!" |
| README | Honest, technical | "A faithful recreation of Nintendo's 1981 PR-21" | "The best Game & Watch clone on the web!" |
| Error message | Calm, factual | "Canvas not supported. Please use Chrome." | "Uh oh! Something went wrong 😅" |
| Open source | Collegial, precise | "MIT. Fork it. Fix things." | "We believe in open source community values!" |

---

## Messaging Hierarchy

### Tagline (≤ 7 words)
**"The Game & Watch. In your browser."**

### Positioning Statement
For retro gaming enthusiasts who want to experience the 1981 Nintendo Parachute without owning hardware or running an emulator, Parachute is the only browser recreation that prioritizes fidelity over novelty — exact timing, authentic LCD aesthetics, synthesized sound, and zero friction.

### Supporting Messages
1. No install. No account. One URL.
2. Timing and mechanics sourced from documented Game & Watch hardware behavior.
3. LCD ghost effect, 7-segment score, synthesized sounds — everything.

---

## Logo Directions

### Primary: Wordmark
"PARACHUTE" set in a condensed grotesque sans-serif (Helvetica Neue Condensed Bold equivalent) in all caps, tracking +50. Color: `#1a1a1a` on light backgrounds, `#b8c9a3` on dark. No decorative elements. The word itself is the logo.

### Symbol Mark
A minimal vector silhouette of a parachutist (zone 0 pose — open canopy, figure below) at 24×40px. Pure black. No outline. Used as favicon, app icon, and social avatar. This is drawn from the game's actual parachutist_zone0 sprite.

### Combination Mark
Wordmark + symbol side by side. Symbol left, wordmark right, vertically centered. Used in README header and social meta images.

### Favicon
The symbol mark at 32×32, cropped tight. Rendered as SVG favicon.

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--lcd-green` | `#b8c9a3` | The screen. Primary brand color. LCD background everywhere. |
| `--sprite-black` | `#1a1a1a` | All sprites. Not pure black — slightly warm, matching LCD sprite warmth. |

### Device Frame Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--frame-cream` | `#e8e0d0` | Device body. Warm off-white plastic. |
| `--frame-rose` | `#c47a7a` | Screen surround. The distinctive rose/mauve bezel. |
| `--frame-navy` | `#3a3a5c` | Game A button. |
| `--frame-burgundy` | `#5c3a3a` | Game B button. |

### UI Shell Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--page-dark` | `#1a1a1a` | Page background behind device. Same as sprite-black. |
| `--page-accent` | `#b8c9a3` | UI text, links. Inverted LCD green. |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--miss-red` | `#c04040` | Future: miss counter pips (not used in v1 canvas) |
| `--ghost-overlay` | `rgba(26,26,26,0.12)` | Ghost persistence effect |
| `--gameover-overlay` | `rgba(0,0,0,0.15)` | GAME OVER screen tint |

### Rationale
Every color in this palette is sampled directly from or derived from the original Game & Watch hardware. The LCD green `#b8c9a3` is calibrated from high-resolution photographs of a working PR-21 unit under neutral lighting. The rose bezel `#c47a7a` is similarly calibrated. Nothing is invented.

---

## Typography

### Platform: Web

| Role | Font | Weight | Size | Notes |
|------|------|--------|------|-------|
| Device labels | Helvetica Neue, Arial | Bold | `clamp(10px, 1.8vw, 18px)` | All caps, tracking +2px |
| UI text (README, overlays) | System UI | Regular | 14–16px | System font stack, no web font load |
| Score display | Canvas-drawn | N/A | ~18px logical | Custom 7-segment rects, not font-based |

**No web fonts are loaded.** Every typographic element uses either system fonts or is drawn directly on Canvas. This is intentional — zero font loading = faster TTI, no FOUT, and the system font on most devices (SF Pro, Segoe UI) feels correct for the sparse UI shell around the device.

---

## Application Guidelines

### App Icon / Favicon
- Symbol mark (parachutist silhouette) centered on `#b8c9a3` background
- 16, 32, 180 (Apple touch), 192 (Android) sizes
- SVG master, rasterized from that

### Social / Open Graph Image
- 1200×630px
- Dark background (`#1a1a1a`)
- Device frame centered with game playing (frame 15 composition: two parachutists in-flight)
- Wordmark "PARACHUTE" in `#b8c9a3` above device
- Tagline in small type below

### GitHub Repository
- README header: combination mark
- No badges except "Deploy with Vercel" (functional, not decorative)
- Code screenshots use the LCD green color scheme in terminal (custom iTerm2/VS Code theme optional)

### Screenshot Guidelines (App Store / Social)
- Show the full device frame — never just the canvas cropped
- No UI chrome modifications for screenshots
- Preferred composition: game mid-play with 2 parachutists in-flight
