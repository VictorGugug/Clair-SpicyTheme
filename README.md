# Clair-SpicyTheme

Spicetify theme with an animated cover art background behind the whole app and glass panels.

The name is the idea: **Clair** is French for *clear*, from Latin *clarus*: bright, plain and loud, one word for light and for sound, and the same root as English *clear* and *clarity*. Clair keeps the app clear so your own artwork and wallpaper stay in view.

- **Light** (default) or **Dark**: bright cover colors with see-through panels, or dimmed colors with deeper panels. Blur, Warp, Motion, Saturation and Brightness stay adjustable.
- **Sync with Spicy Lyrics**: shown only when Spicy Lyrics is installed. When on, Clair uses the Spicy Lyrics background (same shader, blur, saturation, dithering, brightness filter and tempo/beat speed) and follows its settings live, including the static Auto, Artist Header, Cover Art and Color modes and blur. The background is mapped onto the lyrics panel exactly like Spicy draws it, so the lyrics page and the rest of the app form one continuous background.

The accent follows the current cover through the same Spotify dynamic colors (`getDynamicColorsByUris`) that Spicy Lyrics uses.

![Clair-SpicyTheme](preview.png)

## Install from Marketplace

Open Spicetify Marketplace, go to Themes, search for **Clair-SpicyTheme** and click Install. To use Sync with Spicy Lyrics, also install the Spicy Lyrics extension from Marketplace.

## Install manually (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\INSTALL.ps1
powershell -ExecutionPolicy Bypass -File .\INSTALL.ps1 -Scheme Clair-OLED
```

The installer runs `spicetify backup` first and moves any previous copy of the theme to `Clair-SpicyTheme.bak-<timestamp>`.

## Settings

Click the gear button next to your avatar (top right). The window uses the same layout as the Spicy Lyrics settings: a sidebar with the theme name, a search box and four tabs, then About below a divider, and a pane of grouped cards.

| Tab | Options |
| --- | --- |
| Appearance | Light (default) or Dark under Style, then Material: Panel opacity, Glass blur, Corner radius |
| Background | Background on or off, Sync with Spicy Lyrics (when installed; shows its current background and a button to open its settings), otherwise Blur, Warp, Motion, Saturation, Brightness |
| Color | Accent (cover art, presets or custom), Custom color, Surface tint |
| More | Window controls (Default, Clair, or No controls), Minimal mode (hides friend activity), Maximum performance, Reset |
| About | Theme version, what the name means, and links to the repository and the issue tracker |

The search box filters rows on every tab and dims the tabs with no match.

Hold the eye button in the header to step the whole window aside and look at the app behind it.

Changes apply instantly and persist. Console: `ClairTheme.openSettings()`, `ClairTheme.version`.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\UNINSTALL.ps1
powershell -ExecutionPolicy Bypass -File .\UNINSTALL.ps1 -FullRestore
```

After a Spotify update breaks styling: `spicetify restore backup apply`, then `spicetify backup apply`.

## Schemes

`Clair-Dark` (default) and `Clair-OLED` (pure black). Their `button` color is the fallback accent when cover colors are unavailable.

## About

Version 1.0.0, also shown in Settings under About.

Clair is an independent theme. It is not official, and it is not associated or affiliated with Spicy Lyrics. Spicy Lyrics is a separate project by its own authors; Clair only reads its settings when Sync is on.
