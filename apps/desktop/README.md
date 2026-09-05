# @g7m/desktop

Tauri 2 shell for Windows and macOS. Deliberately thin: window configuration,
menus and the updater. No application code.

## Prerequisites

Tauri compiles a Rust binary, so Rust is required — **the JavaScript toolchain
alone is not enough.**

| OS      | Needs |
| ------- | ----- |
| Windows | [Rust via rustup](https://rustup.rs), Microsoft C++ Build Tools, WebView2 (ships with Windows 11) |
| macOS   | Rust via rustup, Xcode Command Line Tools |

## Commands

```bash
pnpm --filter @g7m/desktop dev     # starts the Vite dev server, then the native window
pnpm --filter @g7m/desktop build   # builds apps/web, then bundles the installer
```

`beforeDevCommand` / `beforeBuildCommand` in `src-tauri/tauri.conf.json` run the
web build for you — do not build `apps/web` separately first.

## Content Security Policy

Unlike the Capacitor shell, Tauri enforces a CSP from `tauri.conf.json`. It is
currently set for Supabase, PowerSync and YouTube embeds. **A blocked request
fails silently in a WebView**, so when a new external host appears, add it there
first — see `DECISIONS.md` ADR-0010.
