-- ZombieSpawner.lua
-- Place this Script inside ServerScriptService
-- Requires: A "Zombie" model in ServerStorage with a Humanoid inside

local ServerStorage = game:GetService("ServerStorage")
local Players = game:GetService("Players")

-- ── Config ──────────────────────────────────────────────────────────────────
local ZOMBIE_TEMPLATE   = ServerStorage:WaitForChild("Zombie")  -- your zombie model
local SPAWN_LOCATION    = workspace:WaitForChild("ZombieSpawn") -- a Part in Workspace named ZombieSpawn
local STARTING_ZOMBIES  = 3   -- zombies in wave 1
local SPAWN_INTERVAL    = 1.5 -- seconds between each zombie spawn
local WAVE_BREAK        = 5   -- seconds between waves
-- ────────────────────────────────────────────────────────────────────────────

local currentWave      = 0
local zombiesThisWave  = STARTING_ZOMBIES
local activeZombies    = {}

-- Spawn a single zombie at the spawn part
local function spawnZombie()
	local zombie = ZOMBIE_TEMPLATE:Clone()
	zombie:SetPrimaryPartCFrame(SPAWN_LOCATION.CFrame + Vector3.new(math.random(-5, 5), 0, math.random(-5, 5)))
	zombie.Parent = workspace

	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	if humanoid then
		table.insert(activeZombies, zombie)

		-- Remove from active list when the zombie dies
		humanoid.Died:Connect(function()
			for i, z in ipairs(activeZombies) do
				if z == zombie then
					table.remove(activeZombies, i)
					break
				end
			end
			task.delay(3, function()   -- small delay so death animation plays
				if zombie and zombie.Parent then
					zombie:Destroy()
				end
			end)
		end)
	end
end

-- Wait until all zombies in the current wave are dead
local function waitForWaveClear()
	while #activeZombies > 0 do
		task.wait(1)
	end
end

-- Main wave loop
local function startWaves()
	while true do
		currentWave       = currentWave + 1
		zombiesThisWave   = STARTING_ZOMBIES + (currentWave - 1)  -- +1 zombie per wave

		print(string.format("[ZombieSpawner] Wave %d starting — %d zombies", currentWave, zombiesThisWave))

		-- Announce wave to all players
		for _, player in ipairs(Players:GetPlayers()) do
			local gui = player.PlayerGui:FindFirstChild("WaveGui")
			if gui then
				local label = gui:FindFirstChild("WaveLabel")
				if label then
					label.Text = "Wave " .. currentWave .. " — " .. zombiesThisWave .. " Zombies!"
				end
			end
		end

		-- Spawn zombies one by one
		for i = 1, zombiesThisWave do
			spawnZombie()
			task.wait(SPAWN_INTERVAL)
		end

		-- Wait for all to die
		waitForWaveClear()

		print(string.format("[ZombieSpawner] Wave %d cleared! Next wave in %d seconds.", currentWave, WAVE_BREAK))

		-- Announce wave cleared
		for _, player in ipairs(Players:GetPlayers()) do
			local gui = player.PlayerGui:FindFirstChild("WaveGui")
			if gui then
				local label = gui:FindFirstChild("WaveLabel")
				if label then
					label.Text = "Wave " .. currentWave .. " Cleared! Next wave in " .. WAVE_BREAK .. "s..."
				end
			end
		end

		task.wait(WAVE_BREAK)
	end
end

startWaves()
