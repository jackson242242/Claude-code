-- ZombieSpawner.lua
-- Place this Script inside ServerScriptService
-- No setup required: if ServerStorage has no "Zombie" model, a full humanoid
-- zombie-soldier rig (head, torso, limbs, face, uniform, name tag, health bar)
-- is built automatically in code. Zombies chase the nearest player and attack.

local ServerStorage = game:GetService("ServerStorage")
local Players       = game:GetService("Players")

-- ── Config ───────────────────────────────────────────────────────────────────
local STARTING_ZOMBIES = 3     -- zombies on wave 1
local SPAWN_INTERVAL   = 1.5   -- seconds between each zombie spawn
local WAVE_BREAK       = 5     -- seconds between waves
local ATTACK_RANGE     = 4     -- studs: close enough to hit a player
local ATTACK_COOLDOWN  = 1.2   -- seconds between hits per zombie
local RETARGET_EVERY   = 0.25  -- seconds between AI target updates
local WALK_ANIM_ID     = "rbxassetid://180426354" -- default R6 walk cycle
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Zombie variants: each wave mixes these so soldiers look distinct ─────────
local VARIANTS = {
	{
		name = "Infected Soldier", chance = 60,
		health = 100, speed = 8, damage = 10,
		skin = Color3.fromRGB(121, 166, 110),   -- sickly green skin
		shirt = Color3.fromRGB(58, 73, 47),     -- olive fatigues
		pants = Color3.fromRGB(44, 51, 38),
	},
	{
		name = "Sprinter", chance = 25,
		health = 60, speed = 16, damage = 8,
		skin = Color3.fromRGB(168, 189, 142),   -- pale green
		shirt = Color3.fromRGB(92, 80, 56),     -- torn khaki
		pants = Color3.fromRGB(60, 56, 48),
	},
	{
		name = "Brute", chance = 15,
		health = 250, speed = 6, damage = 20,
		skin = Color3.fromRGB(88, 110, 78),     -- dark rotten green
		shirt = Color3.fromRGB(70, 35, 35),     -- blood-stained jacket
		pants = Color3.fromRGB(35, 35, 40),
	},
}

local function pickVariant()
	local roll, acc = math.random(1, 100), 0
	for _, v in ipairs(VARIANTS) do
		acc = acc + v.chance
		if roll <= acc then return v end
	end
	return VARIANTS[1]
end

-- ── Build a proper human-shaped R6 rig in code ───────────────────────────────
local function makeBodyPart(name, size, color, parent)
	local part = Instance.new("Part")
	part.Name      = name
	part.Size      = size
	part.Color     = color
	part.Material  = Enum.Material.SmoothPlastic
	part.TopSurface    = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent    = parent
	return part
end

local function makeMotor(name, part0, part1, c0, c1)
	local motor = Instance.new("Motor6D")
	motor.Name   = name
	motor.Part0  = part0
	motor.Part1  = part1
	motor.C0     = c0
	motor.C1     = c1
	motor.Parent = part0
	return motor
end

local function addNameTag(model, head, variant)
	local billboard = Instance.new("BillboardGui")
	billboard.Name       = "NameTag"
	billboard.Size       = UDim2.new(4, 0, 1.2, 0)
	billboard.StudsOffset = Vector3.new(0, 2, 0)
	billboard.AlwaysOnTop = true
	billboard.Adornee    = head
	billboard.Parent     = head

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Text       = variant.name
	nameLabel.TextColor3 = Color3.fromRGB(255, 90, 90)
	nameLabel.TextScaled = true
	nameLabel.Font       = Enum.Font.GothamBold
	nameLabel.Parent     = billboard

	local barBack = Instance.new("Frame")
	barBack.Position = UDim2.new(0.1, 0, 0.55, 0)
	barBack.Size     = UDim2.new(0.8, 0, 0.22, 0)
	barBack.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
	barBack.BorderSizePixel  = 0
	barBack.Parent   = billboard

	local barFill = Instance.new("Frame")
	barFill.Name = "Fill"
	barFill.Size = UDim2.new(1, 0, 1, 0)
	barFill.BackgroundColor3 = Color3.fromRGB(90, 220, 90)
	barFill.BorderSizePixel  = 0
	barFill.Parent = barBack

	local humanoid = model:FindFirstChildOfClass("Humanoid")
	humanoid.HealthChanged:Connect(function(health)
		local ratio = math.clamp(health / humanoid.MaxHealth, 0, 1)
		barFill.Size = UDim2.new(ratio, 0, 1, 0)
		barFill.BackgroundColor3 = ratio > 0.4
			and Color3.fromRGB(90, 220, 90)
			or Color3.fromRGB(220, 70, 70)
	end)
end

local function buildZombieModel(variant)
	local model = Instance.new("Model")
	model.Name = "Zombie"

	local hrp = makeBodyPart("HumanoidRootPart", Vector3.new(2, 2, 1), variant.shirt, model)
	hrp.Transparency = 1
	hrp.CanCollide   = true

	local torso    = makeBodyPart("Torso",     Vector3.new(2, 2, 1), variant.shirt, model)
	local head     = makeBodyPart("Head",      Vector3.new(2, 1, 1), variant.skin,  model)
	local leftArm  = makeBodyPart("Left Arm",  Vector3.new(1, 2, 1), variant.skin,  model)
	local rightArm = makeBodyPart("Right Arm", Vector3.new(1, 2, 1), variant.skin,  model)
	local leftLeg  = makeBodyPart("Left Leg",  Vector3.new(1, 2, 1), variant.pants, model)
	local rightLeg = makeBodyPart("Right Leg", Vector3.new(1, 2, 1), variant.pants, model)

	-- Round head + face so it reads as a person, not a brick
	local headMesh = Instance.new("SpecialMesh")
	headMesh.MeshType = Enum.MeshType.Head
	headMesh.Scale    = Vector3.new(1.25, 1.25, 1.25)
	headMesh.Parent   = head

	local face = Instance.new("Decal")
	face.Name    = "face"
	face.Texture = "rbxasset://textures/face.png"
	face.Face    = Enum.NormalId.Front
	face.Parent  = head

	-- Standard R6 joints (exact C0/C1 so default animations play correctly)
	makeMotor("RootJoint", hrp, torso,
		CFrame.new(0, 0, 0) * CFrame.Angles(-math.pi / 2, 0, math.pi),
		CFrame.new(0, 0, 0) * CFrame.Angles(-math.pi / 2, 0, math.pi))
	makeMotor("Neck", torso, head,
		CFrame.new(0, 1, 0) * CFrame.Angles(-math.pi / 2, 0, math.pi),
		CFrame.new(0, -0.5, 0) * CFrame.Angles(-math.pi / 2, 0, math.pi))
	makeMotor("Left Shoulder", torso, leftArm,
		CFrame.new(-1, 0.5, 0) * CFrame.Angles(0, -math.pi / 2, 0),
		CFrame.new(0.5, 0.5, 0) * CFrame.Angles(0, -math.pi / 2, 0))
	makeMotor("Right Shoulder", torso, rightArm,
		CFrame.new(1, 0.5, 0) * CFrame.Angles(0, math.pi / 2, 0),
		CFrame.new(-0.5, 0.5, 0) * CFrame.Angles(0, math.pi / 2, 0))
	makeMotor("Left Hip", torso, leftLeg,
		CFrame.new(-1, -1, 0) * CFrame.Angles(0, -math.pi / 2, 0),
		CFrame.new(-0.5, 1, 0) * CFrame.Angles(0, -math.pi / 2, 0))
	makeMotor("Right Hip", torso, rightLeg,
		CFrame.new(1, -1, 0) * CFrame.Angles(0, math.pi / 2, 0),
		CFrame.new(0.5, 1, 0) * CFrame.Angles(0, math.pi / 2, 0))

	local humanoid = Instance.new("Humanoid")
	humanoid.RigType       = Enum.HumanoidRigType.R6
	humanoid.MaxHealth     = variant.health
	humanoid.Health        = variant.health
	humanoid.WalkSpeed     = variant.speed
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.Parent        = model

	model.PrimaryPart = hrp
	addNameTag(model, head, variant)
	return model
end

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

-- ── Zombie AI: walk animation, chase nearest player, attack on contact ──────
local function nearestPlayerRoot(fromPosition)
	local best, bestDist = nil, math.huge
	for _, player in ipairs(Players:GetPlayers()) do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and humanoid and humanoid.Health > 0 then
			local dist = (root.Position - fromPosition).Magnitude
			if dist < bestDist then
				best, bestDist = root, dist
			end
		end
	end
	return best, bestDist
end

local function startZombieAI(zombie, variant)
	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	local root     = zombie:FindFirstChild("HumanoidRootPart")
	if not humanoid or not root then return end

	-- Looping walk cycle so the rig moves like a person
	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator", humanoid)
	local walkAnim = Instance.new("Animation")
	walkAnim.AnimationId = WALK_ANIM_ID
	local walkTrack = animator:LoadAnimation(walkAnim)
	walkTrack.Looped = true
	walkTrack:Play()

	task.spawn(function()
		local lastHit = 0
		while zombie.Parent and humanoid.Health > 0 do
			local targetRoot, dist = nearestPlayerRoot(root.Position)
			if targetRoot then
				humanoid:MoveTo(targetRoot.Position)
				if dist <= ATTACK_RANGE and os.clock() - lastHit >= ATTACK_COOLDOWN then
					lastHit = os.clock()
					local targetHumanoid = targetRoot.Parent:FindFirstChildOfClass("Humanoid")
					if targetHumanoid then
						targetHumanoid:TakeDamage(variant.damage)
					end
				end
			end
			task.wait(RETARGET_EVERY)
		end
		walkTrack:Stop()
	end)
end

-- ── Spawner state ─────────────────────────────────────────────────────────────
local currentWave     = 0
local activeZombies   = {}

local zombieTemplate = ServerStorage:FindFirstChild("Zombie")
if zombieTemplate then
	print("[ZombieSpawner] Using Zombie template from ServerStorage")
else
	print("[ZombieSpawner] No template found — building zombie soldiers in code")
end

local function spawnZombie()
	local variant = pickVariant()
	local zombie
	if zombieTemplate then
		zombie = zombieTemplate:Clone()
	else
		zombie = buildZombieModel(variant)
	end

	local offset = Vector3.new(math.random(-5, 5), 3, math.random(-5, 5))
	zombie:PivotTo(SPAWN_PART.CFrame + offset)
	zombie.Parent = workspace

	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	if humanoid then
		table.insert(activeZombies, zombie)
		startZombieAI(zombie, variant)

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
