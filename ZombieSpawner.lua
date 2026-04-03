-- ZombieSpawner.lua
-- Place this Script inside ServerScriptService
-- Only requirement: a "Zombie" model in ServerStorage with a Humanoid and HumanoidRootPart

local ServerStorage   = game:GetService("ServerStorage")
local Players         = game:GetService("Players")
local TweenService    = game:GetService("TweenService")

-- ── Config ───────────────────────────────────────────────────────────────────
local ZOMBIE_TEMPLATE  = ServerStorage:WaitForChild("Zombie")
local STARTING_ZOMBIES = 3     -- zombies on wave 1
local SPAWN_INTERVAL   = 1.5   -- seconds between each zombie spawn
local WAVE_BREAK       = 5     -- seconds between waves
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Auto-create spawn part if missing ────────────────────────────────────────
local SPAWN_PART = workspace:FindFirstChild("ZombieSpawn")
if not SPAWN_PART then
	SPAWN_PART = Instance.new("Part")
	SPAWN_PART.Name      = "ZombieSpawn"
	SPAWN_PART.Size      = Vector3.new(10, 1, 10)
	SPAWN_PART.Anchored  = true
	SPAWN_PART.CanCollide = false
	SPAWN_PART.Transparency = 0.7
	SPAWN_PART.BrickColor = BrickColor.new("Bright red")
	SPAWN_PART.CFrame    = CFrame.new(0, 0.5, -50)
	SPAWN_PART.Parent    = workspace

	local label = Instance.new("SurfaceGui", SPAWN_PART)
	local text  = Instance.new("TextLabel", label)
	text.Size = UDim2.new(1, 0, 1, 0)
	text.Text = "ZOMBIE SPAWN"
	text.TextColor3 = Color3.new(1, 1, 1)
	text.BackgroundTransparency = 1
	text.TextScaled = true
	print("[ZombieSpawner] Created ZombieSpawn part at (0, 0.5, -50)")
end

-- ── Auto-create Wave GUI for each player ─────────────────────────────────────
local function createWaveGui(player)
	local playerGui = player:WaitForChild("PlayerGui")

	-- Remove old one if it exists
	local old = playerGui:FindFirstChild("WaveGui")
	if old then old:Destroy() end

	local screenGui = Instance.new("ScreenGui")
	screenGui.Name            = "WaveGui"
	screenGui.ResetOnSpawn    = false

	-- Wave banner (top center)
	local banner = Instance.new("Frame", screenGui)
	banner.Name              = "Banner"
	banner.Size              = UDim2.new(0.4, 0, 0.08, 0)
	banner.Position          = UDim2.new(0.3, 0, 0.02, 0)
	banner.BackgroundColor3  = Color3.fromRGB(20, 20, 20)
	banner.BackgroundTransparency = 0.3
	banner.BorderSizePixel   = 0

	local corner = Instance.new("UICorner", banner)
	corner.CornerRadius = UDim.new(0.2, 0)

	local waveLabel = Instance.new("TextLabel", banner)
	waveLabel.Name              = "WaveLabel"
	waveLabel.Size              = UDim2.new(1, 0, 0.6, 0)
	waveLabel.Position          = UDim2.new(0, 0, 0, 0)
	waveLabel.BackgroundTransparency = 1
	waveLabel.TextColor3        = Color3.fromRGB(255, 80, 80)
	waveLabel.TextScaled        = true
	waveLabel.Font              = Enum.Font.GothamBold
	waveLabel.Text              = "Waiting for wave..."

	local zombieCountLabel = Instance.new("TextLabel", banner)
	zombieCountLabel.Name              = "ZombieCountLabel"
	zombieCountLabel.Size              = UDim2.new(1, 0, 0.4, 0)
	zombieCountLabel.Position          = UDim2.new(0, 0, 0.6, 0)
	zombieCountLabel.BackgroundTransparency = 1
	zombieCountLabel.TextColor3        = Color3.fromRGB(255, 200, 200)
	zombieCountLabel.TextScaled        = true
	zombieCountLabel.Font              = Enum.Font.Gotham
	zombieCountLabel.Text              = ""

	screenGui.Parent = playerGui
end

Players.PlayerAdded:Connect(createWaveGui)

-- Also give GUI to any players already in game
for _, p in ipairs(Players:GetPlayers()) do
	createWaveGui(p)
end

-- ── Helper: update all players' GUI ──────────────────────────────────────────
local function updateGui(waveTxt, countTxt, color)
	for _, player in ipairs(Players:GetPlayers()) do
		local gui = player.PlayerGui:FindFirstChild("WaveGui")
		if not gui then continue end
		local banner = gui:FindFirstChild("Banner")
		if not banner then continue end
		local wl = banner:FindFirstChild("WaveLabel")
		local cl = banner:FindFirstChild("ZombieCountLabel")
		if wl then
			wl.Text       = waveTxt
			wl.TextColor3 = color or Color3.fromRGB(255, 80, 80)
		end
		if cl then cl.Text = countTxt end
	end
end

-- ── Spawner state ─────────────────────────────────────────────────────────────
local currentWave     = 0
local activeZombies   = {}

local function spawnZombie()
	local zombie = ZOMBIE_TEMPLATE:Clone()
	local offset = Vector3.new(math.random(-5, 5), 0, math.random(-5, 5))
	zombie:SetPrimaryPartCFrame(SPAWN_PART.CFrame + offset)
	zombie.Parent = workspace

	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	if humanoid then
		table.insert(activeZombies, zombie)

		humanoid.Died:Connect(function()
			for i, z in ipairs(activeZombies) do
				if z == zombie then
					table.remove(activeZombies, i)
					break
				end
			end
			task.delay(3, function()
				if zombie and zombie.Parent then
					zombie:Destroy()
				end
			end)
		end)
	end
end

local function waitForWaveClear()
	while #activeZombies > 0 do
		-- Live zombie count in GUI
		updateGui(
			"Wave " .. currentWave,
			#activeZombies .. " zombie(s) remaining",
			Color3.fromRGB(255, 80, 80)
		)
		task.wait(0.5)
	end
end

-- ── Countdown display ─────────────────────────────────────────────────────────
local function showCountdown(seconds)
	for i = seconds, 1, -1 do
		updateGui(
			"Wave " .. (currentWave + 1) .. " incoming!",
			"Next wave in " .. i .. "s...",
			Color3.fromRGB(255, 200, 50)
		)
		task.wait(1)
	end
end

-- ── Main wave loop ────────────────────────────────────────────────────────────
local function startWaves()
	while true do
		currentWave      = currentWave + 1
		local totalZombies = STARTING_ZOMBIES + (currentWave - 1) -- +1 per wave

		print(string.format("[ZombieSpawner] Wave %d — %d zombies", currentWave, totalZombies))

		updateGui(
			"Wave " .. currentWave .. " — START!",
			totalZombies .. " zombies incoming!",
			Color3.fromRGB(255, 50, 50)
		)
		task.wait(2)

		-- Spawn zombies one by one
		for i = 1, totalZombies do
			spawnZombie()
			updateGui(
				"Wave " .. currentWave,
				"Spawning zombie " .. i .. "/" .. totalZombies,
				Color3.fromRGB(255, 80, 80)
			)
			task.wait(SPAWN_INTERVAL)
		end

		-- Wait for all zombies to die
		waitForWaveClear()

		print(string.format("[ZombieSpawner] Wave %d cleared!", currentWave))

		updateGui(
			"Wave " .. currentWave .. " Cleared!",
			"Great job!",
			Color3.fromRGB(50, 255, 100)
		)
		task.wait(2)

		-- Countdown to next wave
		showCountdown(WAVE_BREAK)
	end
end

startWaves()
