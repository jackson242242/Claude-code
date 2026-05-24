# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Roblox game scripting repository. The sole script is `ZombieSpawner.lua`, a self-contained `Script` to be placed in **ServerScriptService** inside Roblox Studio. There is no build system, package manager, or test runner — development and testing happen directly inside the Roblox Studio editor and Play mode.

## Deployment

1. Open Roblox Studio on the target game.
2. Copy `ZombieSpawner.lua` contents into a new `Script` inside `ServerScriptService`.
3. Ensure a model named **"Zombie"** exists in `ServerStorage` with at minimum a `Humanoid` and a `HumanoidRootPart`.
4. Press **Play** (or **Playtest**) to run.

No compilation or build step is needed. The script runs server-side only.

## Architecture

The script is intentionally monolithic — all logic lives in one file with clear section comments (`-- ── ... ───`).

**Execution flow:**

```
startWaves()  (infinite loop)
  └─ spawnZombie() × N          — clones Zombie template, registers Died callback
  └─ waitForWaveClear()         — polls activeZombies table every 0.5 s
  └─ showCountdown(WAVE_BREAK)  — updates GUI with countdown
```

**State:**
- `activeZombies` — module-level table tracking live zombie instances. Entries are removed inside `humanoid.Died` callbacks.
- `currentWave` — integer incremented each loop iteration.

**GUI:**
- `createWaveGui(player)` builds a `ScreenGui` ("WaveGui") in each player's `PlayerGui` on join.
- `updateGui(waveTxt, countTxt, color)` iterates all current players and updates the same labels.

## Config constants

All tuning lives at the top of the file:

| Constant | Default | Meaning |
|---|---|---|
| `STARTING_ZOMBIES` | `3` | Zombies on wave 1 |
| `SPAWN_INTERVAL` | `1.5` | Seconds between individual zombie spawns |
| `WAVE_BREAK` | `5` | Seconds between waves (countdown) |

Zombie count scales linearly: `STARTING_ZOMBIES + (currentWave - 1)`.

## Conventions

- Roblox Lua (Luau) idioms: `task.wait`, `task.delay`, `Instance.new`, service singletons via `game:GetService`.
- `TweenService` is imported but currently unused — do not remove unless certain it will never be needed for death animations.
- Section dividers use the `-- ── ... ───` style; maintain this for consistency.
- `print` statements are prefixed with `[ZombieSpawner]` for log filtering in the Roblox Studio Output window.
