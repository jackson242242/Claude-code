-- ZombieSpawner.lua — 僵尸守城 (Zombie Base Defense)
-- Place this single Script inside ServerScriptService. Zero setup required.
--
-- Gameplay loop:
--   1. Zombie soldiers spawn in waves and chase players AND your troops.
--   2. Killing zombies earns shared team gold (shown top-left).
--   3. Walk to the Build Plaza (row of glowing podiums) and click a podium
--      to construct that camp: 步兵营 / 弓兵营 / 强弩营 / 骑兵营 / 南蛮营 /
--      水兵营 / 兽栏 / 火箭营 / 攻城车厂 / 投石车厂 / 木筏坞 / 战船坞.
--   4. Each camp automatically trains its own unit type. Troops are full
--      humanoid figures (face, uniform, weapon, name tag, health bar);
--      siege engines / ships are built from parts. All fight on their own.
--
-- Everything (rigs, camps, GUI, AI, projectiles) is created in code.
-- If ServerStorage contains a "Zombie" model it is used as the zombie
-- template; otherwise zombies are auto-built too.

local ServerStorage = game:GetService("ServerStorage")
local Players       = game:GetService("Players")

-- ── Config ───────────────────────────────────────────────────────────────────
local STARTING_ZOMBIES = 3      -- zombies on wave 1
local SPAWN_INTERVAL   = 1.5    -- seconds between each zombie spawn
local WAVE_BREAK       = 8      -- seconds between waves
local STARTING_GOLD    = 300    -- shared team gold at game start
local WAVE_CLEAR_BASE  = 50     -- bonus gold for clearing a wave (+10/wave)
local RETARGET_EVERY   = 0.25   -- seconds between AI target updates
local WALK_ANIM_ID     = "rbxassetid://180426354" -- default R6 walk cycle

local PLAZA_CENTER = Vector3.new(0, 0, 40)   -- build podium row
local CAMP_ORIGIN  = Vector3.new(-30, 0, 58) -- first camp slot (grid grows +x, +z)
local ZOMBIE_SPAWN = CFrame.new(0, 0.5, -50)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Workspace folders ────────────────────────────────────────────────────────
local function ensureFolder(name)
	local f = workspace:FindFirstChild(name)
	if not f then
		f = Instance.new("Folder")
		f.Name = name
		f.Parent = workspace
	end
	return f
end

local zombiesFolder  = ensureFolder("Zombies")
local soldiersFolder = ensureFolder("Soldiers")
local campsFolder    = ensureFolder("Camps")

-- ── Zombie variants ──────────────────────────────────────────────────────────
local ZOMBIE_VARIANTS = {
	{
		name = "Infected Soldier", chance = 60, bounty = 20,
		health = 100, speed = 8, damage = 10,
		skin = Color3.fromRGB(121, 166, 110),
		shirt = Color3.fromRGB(58, 73, 47),
		pants = Color3.fromRGB(44, 51, 38),
	},
	{
		name = "Sprinter", chance = 25, bounty = 25,
		health = 60, speed = 16, damage = 8,
		skin = Color3.fromRGB(168, 189, 142),
		shirt = Color3.fromRGB(92, 80, 56),
		pants = Color3.fromRGB(60, 56, 48),
	},
	{
		name = "Brute", chance = 15, bounty = 60,
		health = 250, speed = 6, damage = 20,
		skin = Color3.fromRGB(88, 110, 78),
		shirt = Color3.fromRGB(70, 35, 35),
		pants = Color3.fromRGB(35, 35, 40),
	},
}

local function pickZombieVariant()
	local roll, acc = math.random(1, 100), 0
	for _, v in ipairs(ZOMBIE_VARIANTS) do
		acc = acc + v.chance
		if roll <= acc then return v end
	end
	return ZOMBIE_VARIANTS[1]
end

-- ── Unit catalog: each camp produces one unit type ───────────────────────────
-- ranged units stop at attackRange and shoot projectiles; aoe damages a radius.
-- vehicle units hide the human rig and weld a built shape onto it.
local SKIN  = Color3.fromRGB(234, 184, 146)
local UNIT_TYPES = {
	{
		id = "infantry", campName = "步兵营", unitName = "步兵", cost = 100,
		health = 140, speed = 14, damage = 15, attackRange = 5, attackCooldown = 1.2,
		maxAlive = 3, produceEvery = 8, weapon = "sword",
		skin = SKIN, shirt = Color3.fromRGB(70, 90, 130), pants = Color3.fromRGB(40, 45, 60),
		campColor = Color3.fromRGB(70, 90, 130),
	},
	{
		id = "archer", campName = "弓兵营", unitName = "弓兵", cost = 150,
		health = 80, speed = 14, damage = 12, attackRange = 35, attackCooldown = 1.5,
		ranged = true, projectileColor = Color3.fromRGB(120, 85, 50),
		maxAlive = 3, produceEvery = 8, weapon = "bow",
		skin = SKIN, shirt = Color3.fromRGB(60, 120, 70), pants = Color3.fromRGB(50, 60, 45),
		campColor = Color3.fromRGB(60, 120, 70),
	},
	{
		id = "crossbow", campName = "强弩营", unitName = "强弩兵", cost = 200,
		health = 100, speed = 12, damage = 25, attackRange = 45, attackCooldown = 2.5,
		ranged = true, projectileColor = Color3.fromRGB(60, 60, 60),
		maxAlive = 3, produceEvery = 10, weapon = "crossbow",
		skin = SKIN, shirt = Color3.fromRGB(90, 70, 110), pants = Color3.fromRGB(45, 40, 55),
		campColor = Color3.fromRGB(90, 70, 110),
	},
	{
		id = "cavalry", campName = "骑兵营", unitName = "骑兵", cost = 250,
		health = 180, speed = 26, damage = 20, attackRange = 6, attackCooldown = 1.2,
		maxAlive = 3, produceEvery = 12, weapon = "spear", vehicle = "horse",
		skin = SKIN, shirt = Color3.fromRGB(150, 60, 60), pants = Color3.fromRGB(60, 40, 40),
		campColor = Color3.fromRGB(150, 60, 60),
	},
	{
		id = "barbarian", campName = "南蛮营", unitName = "南蛮兵", cost = 150,
		health = 160, speed = 18, damage = 22, attackRange = 5, attackCooldown = 1.0,
		maxAlive = 3, produceEvery = 8, weapon = "club",
		skin = Color3.fromRGB(190, 140, 100), shirt = Color3.fromRGB(190, 140, 100), -- bare chest
		pants = Color3.fromRGB(140, 50, 40),
		campColor = Color3.fromRGB(170, 90, 50),
	},
	{
		id = "marine", campName = "水兵营", unitName = "水兵", cost = 150,
		health = 120, speed = 16, damage = 14, attackRange = 5, attackCooldown = 1.1,
		maxAlive = 3, produceEvery = 8, weapon = "spear",
		skin = SKIN, shirt = Color3.fromRGB(220, 225, 235), pants = Color3.fromRGB(40, 70, 140),
		campColor = Color3.fromRGB(70, 130, 200),
	},
	{
		id = "beast", campName = "兽栏", unitName = "动物兵·战狼", cost = 250,
		health = 220, speed = 20, damage = 20, attackRange = 5, attackCooldown = 1.0,
		maxAlive = 2, produceEvery = 12, vehicle = "beast",
		skin = SKIN, shirt = Color3.fromRGB(110, 110, 115), pants = Color3.fromRGB(80, 80, 85),
		campColor = Color3.fromRGB(110, 110, 115),
	},
	{
		id = "rocket", campName = "火箭营", unitName = "火箭兵", cost = 300,
		health = 90, speed = 12, damage = 30, attackRange = 50, attackCooldown = 4.0,
		ranged = true, aoe = 8, projectileColor = Color3.fromRGB(230, 80, 40),
		maxAlive = 2, produceEvery = 12, weapon = "rocket",
		skin = SKIN, shirt = Color3.fromRGB(60, 60, 65), pants = Color3.fromRGB(40, 40, 45),
		campColor = Color3.fromRGB(230, 80, 40),
	},
	{
		id = "ram", campName = "攻城车厂", unitName = "攻城车", cost = 300,
		health = 500, speed = 6, damage = 50, attackRange = 8, attackCooldown = 3.0,
		maxAlive = 1, produceEvery = 18, vehicle = "ram",
		skin = SKIN, shirt = Color3.fromRGB(105, 75, 50), pants = Color3.fromRGB(105, 75, 50),
		campColor = Color3.fromRGB(105, 75, 50),
	},
	{
		id = "catapult", campName = "投石车厂", unitName = "投石车", cost = 350,
		health = 300, speed = 5, damage = 40, attackRange = 60, attackCooldown = 6.0,
		ranged = true, aoe = 10, projectileColor = Color3.fromRGB(120, 120, 120),
		maxAlive = 1, produceEvery = 18, vehicle = "catapult",
		skin = SKIN, shirt = Color3.fromRGB(130, 100, 60), pants = Color3.fromRGB(130, 100, 60),
		campColor = Color3.fromRGB(130, 100, 60),
	},
	{
		id = "raft", campName = "木筏坞", unitName = "木筏", cost = 120,
		health = 150, speed = 10, damage = 10, attackRange = 6, attackCooldown = 1.5,
		maxAlive = 2, produceEvery = 10, vehicle = "raft",
		skin = SKIN, shirt = Color3.fromRGB(160, 130, 90), pants = Color3.fromRGB(160, 130, 90),
		campColor = Color3.fromRGB(160, 130, 90),
	},
	{
		id = "ship", campName = "战船坞", unitName = "战船", cost = 400,
		health = 600, speed = 8, damage = 30, attackRange = 50, attackCooldown = 4.0,
		ranged = true, aoe = 8, projectileColor = Color3.fromRGB(40, 40, 40),
		maxAlive = 1, produceEvery = 20, vehicle = "ship",
		skin = SKIN, shirt = Color3.fromRGB(80, 60, 45), pants = Color3.fromRGB(80, 60, 45),
		campColor = Color3.fromRGB(45, 95, 150),
	},
}

-- ── Part / rig helpers ───────────────────────────────────────────────────────
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

-- Decorative part welded rigidly to the root (used for vehicles/weapon mounts)
local function decoPart(model, hrp, size, color, offset, material, shape)
	local p = Instance.new("Part")
	p.Size       = size
	p.Color      = color
	p.Material   = material or Enum.Material.Wood
	p.CanCollide = false
	p.Massless   = true
	p.TopSurface    = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if shape then p.Shape = shape end
	p.CFrame = hrp.CFrame * offset
	p.Parent = model
	local weld = Instance.new("WeldConstraint")
	weld.Part0  = hrp
	weld.Part1  = p
	weld.Parent = p
	return p
end

local function addNameTag(model, head, displayName, nameColor)
	local billboard = Instance.new("BillboardGui")
	billboard.Name        = "NameTag"
	billboard.Size        = UDim2.new(4, 0, 1.2, 0)
	billboard.StudsOffset = Vector3.new(0, 2, 0)
	billboard.AlwaysOnTop = true
	billboard.Adornee     = head
	billboard.Parent      = head

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Text       = displayName
	nameLabel.TextColor3 = nameColor
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

-- One-part hand weapons, welded to the right arm so they follow the swing
local WEAPON_SPECS = {
	sword    = { size = Vector3.new(0.4, 3.2, 0.4), color = Color3.fromRGB(200, 200, 210),
	             material = Enum.Material.Metal,
	             c0 = CFrame.new(0, -1.1, -1.2) * CFrame.Angles(math.rad(-90), 0, 0) },
	spear    = { size = Vector3.new(0.3, 6, 0.3), color = Color3.fromRGB(130, 95, 60),
	             material = Enum.Material.Wood,
	             c0 = CFrame.new(0, -1, -1.5) * CFrame.Angles(math.rad(-90), 0, 0) },
	club     = { size = Vector3.new(0.7, 3, 0.7), color = Color3.fromRGB(110, 75, 45),
	             material = Enum.Material.Wood,
	             c0 = CFrame.new(0, -1.1, -1.1) * CFrame.Angles(math.rad(-90), 0, 0) },
	bow      = { size = Vector3.new(0.25, 4, 0.25), color = Color3.fromRGB(120, 85, 50),
	             material = Enum.Material.Wood,
	             c0 = CFrame.new(0, -1, -0.6) },
	crossbow = { size = Vector3.new(1.6, 0.3, 1.6), color = Color3.fromRGB(70, 55, 40),
	             material = Enum.Material.Wood,
	             c0 = CFrame.new(0, -1, -0.8) },
	rocket   = { size = Vector3.new(0.8, 0.8, 3), color = Color3.fromRGB(80, 80, 85),
	             material = Enum.Material.Metal,
	             c0 = CFrame.new(-0.2, -0.6, -0.9) },
}

local function addWeapon(model, rightArm, weaponId)
	local spec = WEAPON_SPECS[weaponId]
	if not spec then return end
	local w = Instance.new("Part")
	w.Name       = "Weapon"
	w.Size       = spec.size
	w.Color      = spec.color
	w.Material   = spec.material
	w.CanCollide = false
	w.Massless   = true
	w.Parent     = model
	local weld = Instance.new("Weld")
	weld.Part0  = rightArm
	weld.Part1  = w
	weld.C0     = spec.c0
	weld.Parent = rightArm
end

-- Vehicle bodies, welded around a hidden rig so Humanoid movement still works
local VEHICLE_BUILDERS = {
	horse = function(model, hrp, cfg)
		local brown = Color3.fromRGB(110, 75, 45)
		decoPart(model, hrp, Vector3.new(2, 2, 5), brown, CFrame.new(0, -1.6, 0), Enum.Material.SmoothPlastic)
		decoPart(model, hrp, Vector3.new(1.2, 1.2, 1.6), brown, CFrame.new(0, -0.6, -2.9), Enum.Material.SmoothPlastic)
		for _, x in ipairs({ -0.7, 0.7 }) do
			for _, z in ipairs({ -1.8, 1.8 }) do
				decoPart(model, hrp, Vector3.new(0.5, 1.8, 0.5), brown, CFrame.new(x, -3.1, z), Enum.Material.SmoothPlastic)
			end
		end
	end,
	beast = function(model, hrp, cfg)
		local grey = Color3.fromRGB(120, 120, 125)
		decoPart(model, hrp, Vector3.new(2.4, 2.2, 5), grey, CFrame.new(0, -1.2, 0), Enum.Material.SmoothPlastic)
		decoPart(model, hrp, Vector3.new(1.6, 1.4, 1.8), grey, CFrame.new(0, -0.5, -3), Enum.Material.SmoothPlastic)
		decoPart(model, hrp, Vector3.new(0.4, 0.7, 0.4), grey, CFrame.new(-0.5, 0.4, -3.2), Enum.Material.SmoothPlastic) -- ear
		decoPart(model, hrp, Vector3.new(0.4, 0.7, 0.4), grey, CFrame.new(0.5, 0.4, -3.2), Enum.Material.SmoothPlastic)  -- ear
		decoPart(model, hrp, Vector3.new(0.4, 0.4, 1.8), grey, CFrame.new(0, -0.8, 3.2), Enum.Material.SmoothPlastic)    -- tail
		for _, x in ipairs({ -0.8, 0.8 }) do
			for _, z in ipairs({ -1.7, 1.7 }) do
				decoPart(model, hrp, Vector3.new(0.5, 1.4, 0.5), grey, CFrame.new(x, -2.8, z), Enum.Material.SmoothPlastic)
			end
		end
	end,
	ram = function(model, hrp, cfg)
		local wood = Color3.fromRGB(105, 75, 50)
		decoPart(model, hrp, Vector3.new(5, 3.5, 8), wood, CFrame.new(0, 0, 0))                       -- covered cart
		decoPart(model, hrp, Vector3.new(5.6, 0.6, 8.6), Color3.fromRGB(70, 50, 35), CFrame.new(0, 2, 0)) -- roof
		decoPart(model, hrp, Vector3.new(1.4, 1.4, 6), Color3.fromRGB(90, 60, 40),
			CFrame.new(0, -0.6, -5), Enum.Material.Wood, Enum.PartType.Cylinder)                      -- ram log
		for _, x in ipairs({ -2.8, 2.8 }) do
			for _, z in ipairs({ -2.5, 2.5 }) do
				decoPart(model, hrp, Vector3.new(0.6, 2.4, 2.4), Color3.fromRGB(50, 40, 30),
					CFrame.new(x, -1.8, z) * CFrame.Angles(0, 0, math.rad(90)),
					Enum.Material.Wood, Enum.PartType.Cylinder)                                       -- wheels
			end
		end
	end,
	catapult = function(model, hrp, cfg)
		local wood = Color3.fromRGB(130, 100, 60)
		decoPart(model, hrp, Vector3.new(5, 1, 7), wood, CFrame.new(0, -1.5, 0))                      -- base
		decoPart(model, hrp, Vector3.new(0.8, 0.8, 7), wood,
			CFrame.new(0, 1, 0.5) * CFrame.Angles(math.rad(-35), 0, 0))                              -- throwing arm
		decoPart(model, hrp, Vector3.new(1.6, 0.8, 1.6), Color3.fromRGB(90, 70, 45), CFrame.new(0, 2.8, -2.2)) -- bucket
		for _, x in ipairs({ -2.6, 2.6 }) do
			for _, z in ipairs({ -2.2, 2.2 }) do
				decoPart(model, hrp, Vector3.new(0.6, 2, 2), Color3.fromRGB(50, 40, 30),
					CFrame.new(x, -1.8, z) * CFrame.Angles(0, 0, math.rad(90)),
					Enum.Material.Wood, Enum.PartType.Cylinder)
			end
		end
	end,
	raft = function(model, hrp, cfg)
		local plank = Color3.fromRGB(160, 130, 90)
		for i = -2, 2 do
			decoPart(model, hrp, Vector3.new(1.1, 0.5, 6), plank, CFrame.new(i * 1.2, -1.8, 0))
		end
		decoPart(model, hrp, Vector3.new(0.3, 4, 0.3), Color3.fromRGB(120, 95, 60), CFrame.new(0, 0.2, 0.5)) -- pole
	end,
	ship = function(model, hrp, cfg)
		local hullColor = Color3.fromRGB(80, 60, 45)
		decoPart(model, hrp, Vector3.new(6, 3, 14), hullColor, CFrame.new(0, -0.8, 0))                -- hull
		decoPart(model, hrp, Vector3.new(4, 2, 3), hullColor, CFrame.new(0, -0.3, -7.5))              -- bow
		decoPart(model, hrp, Vector3.new(0.5, 9, 0.5), Color3.fromRGB(110, 85, 55), CFrame.new(0, 4.5, 0)) -- mast
		decoPart(model, hrp, Vector3.new(5, 6, 0.2), Color3.fromRGB(235, 230, 215),
			CFrame.new(0, 5, -0.5), Enum.Material.Fabric)                                             -- sail
	end,
}

local VEHICLE_HIP_HEIGHT = { horse = 2.2, beast = 1.6, ram = 2.4, catapult = 2.2, raft = 0.8, ship = 2.4 }

-- Build a complete R6 humanoid model from a config table
local function buildHumanoidRig(cfg, displayName, tagColor)
	local model = Instance.new("Model")
	model.Name = displayName

	local hrp = makeBodyPart("HumanoidRootPart", Vector3.new(2, 2, 1), cfg.shirt, model)
	hrp.Transparency = 1
	hrp.CanCollide   = true
	hrp.CFrame       = CFrame.new(0, 100, 0) -- decorations weld relative to this

	local torso    = makeBodyPart("Torso",     Vector3.new(2, 2, 1), cfg.shirt, model)
	local head     = makeBodyPart("Head",      Vector3.new(2, 1, 1), cfg.skin,  model)
	local leftArm  = makeBodyPart("Left Arm",  Vector3.new(1, 2, 1), cfg.skin,  model)
	local rightArm = makeBodyPart("Right Arm", Vector3.new(1, 2, 1), cfg.skin,  model)
	local leftLeg  = makeBodyPart("Left Leg",  Vector3.new(1, 2, 1), cfg.pants, model)
	local rightLeg = makeBodyPart("Right Leg", Vector3.new(1, 2, 1), cfg.pants, model)

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
	humanoid.MaxHealth     = cfg.health
	humanoid.Health        = cfg.health
	humanoid.WalkSpeed     = cfg.speed
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.Parent        = model

	if cfg.vehicle then
		-- Hide the human rig; the welded vehicle body becomes the look.
		-- Cavalry keeps the rider visible (only legs hidden, inside the horse).
		local hideAll = cfg.vehicle ~= "horse"
		for _, part in ipairs({ torso, head, leftArm, rightArm, leftLeg, rightLeg }) do
			if hideAll or part == leftLeg or part == rightLeg then
				part.Transparency = 1
				part.CanCollide   = false
			end
		end
		if hideAll then face:Destroy() end
		VEHICLE_BUILDERS[cfg.vehicle](model, hrp, cfg)
		humanoid.HipHeight = VEHICLE_HIP_HEIGHT[cfg.vehicle] or 0
	end

	if cfg.weapon and (not cfg.vehicle or cfg.vehicle == "horse") then
		addWeapon(model, rightArm, cfg.weapon)
	end

	model.PrimaryPart = hrp
	addNameTag(model, head, displayName, tagColor)
	return model
end

-- ── Spawn part + Build Plaza ─────────────────────────────────────────────────
local SPAWN_PART = workspace:FindFirstChild("ZombieSpawn")
if not SPAWN_PART then
	SPAWN_PART = Instance.new("Part")
	SPAWN_PART.Name      = "ZombieSpawn"
	SPAWN_PART.Size      = Vector3.new(10, 1, 10)
	SPAWN_PART.Anchored  = true
	SPAWN_PART.CanCollide = false
	SPAWN_PART.Transparency = 0.7
	SPAWN_PART.BrickColor = BrickColor.new("Bright red")
	SPAWN_PART.CFrame    = ZOMBIE_SPAWN
	SPAWN_PART.Parent    = workspace

	local label = Instance.new("SurfaceGui", SPAWN_PART)
	local text  = Instance.new("TextLabel", label)
	text.Size = UDim2.new(1, 0, 1, 0)
	text.Text = "ZOMBIE SPAWN"
	text.TextColor3 = Color3.new(1, 1, 1)
	text.BackgroundTransparency = 1
	text.TextScaled = true
	print("[ZombieSpawner] Created ZombieSpawn part")
end

-- ── Team gold ────────────────────────────────────────────────────────────────
local teamGold = STARTING_GOLD

local function updateGoldGui(flashText)
	for _, player in ipairs(Players:GetPlayers()) do
		local gui = player.PlayerGui:FindFirstChild("WaveGui")
		local goldLabel = gui and gui:FindFirstChild("GoldLabel")
		if goldLabel then
			goldLabel.Text = flashText or ("💰 金币: " .. teamGold)
			goldLabel.TextColor3 = flashText
				and Color3.fromRGB(255, 90, 90)
				or Color3.fromRGB(255, 215, 80)
		end
	end
end

local function addGold(amount)
	teamGold = teamGold + amount
	updateGoldGui()
end

local function trySpendGold(amount)
	if teamGold < amount then
		updateGoldGui("金币不足! 需要 " .. amount)
		task.delay(1.2, function() updateGoldGui() end)
		return false
	end
	teamGold = teamGold - amount
	updateGoldGui()
	return true
end

-- ── Wave + gold GUI for each player ──────────────────────────────────────────
local function createWaveGui(player)
	local playerGui = player:WaitForChild("PlayerGui")

	local old = playerGui:FindFirstChild("WaveGui")
	if old then old:Destroy() end

	local screenGui = Instance.new("ScreenGui")
	screenGui.Name         = "WaveGui"
	screenGui.ResetOnSpawn = false

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

	-- Gold counter (top left)
	local goldLabel = Instance.new("TextLabel", screenGui)
	goldLabel.Name              = "GoldLabel"
	goldLabel.Size              = UDim2.new(0.18, 0, 0.05, 0)
	goldLabel.Position          = UDim2.new(0.02, 0, 0.02, 0)
	goldLabel.BackgroundColor3  = Color3.fromRGB(20, 20, 20)
	goldLabel.BackgroundTransparency = 0.3
	goldLabel.BorderSizePixel   = 0
	goldLabel.TextColor3        = Color3.fromRGB(255, 215, 80)
	goldLabel.TextScaled        = true
	goldLabel.Font              = Enum.Font.GothamBold
	goldLabel.Text              = "💰 金币: " .. teamGold

	local goldCorner = Instance.new("UICorner", goldLabel)
	goldCorner.CornerRadius = UDim.new(0.3, 0)

	screenGui.Parent = playerGui
end

Players.PlayerAdded:Connect(createWaveGui)
for _, p in ipairs(Players:GetPlayers()) do
	createWaveGui(p)
end

-- ── Helper: update all players' wave GUI ─────────────────────────────────────
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

-- ── Targeting helpers ────────────────────────────────────────────────────────
local function livingRoot(model)
	local root = model and model:FindFirstChild("HumanoidRootPart")
	local humanoid = model and model:FindFirstChildOfClass("Humanoid")
	if root and humanoid and humanoid.Health > 0 then
		return root
	end
	return nil
end

-- Zombies hunt the nearest player OR friendly soldier
local function nearestZombieTarget(fromPosition)
	local best, bestDist = nil, math.huge
	for _, player in ipairs(Players:GetPlayers()) do
		local root = livingRoot(player.Character)
		if root then
			local dist = (root.Position - fromPosition).Magnitude
			if dist < bestDist then best, bestDist = root, dist end
		end
	end
	for _, soldier in ipairs(soldiersFolder:GetChildren()) do
		local root = livingRoot(soldier)
		if root then
			local dist = (root.Position - fromPosition).Magnitude
			if dist < bestDist then best, bestDist = root, dist end
		end
	end
	return best, bestDist
end

-- Soldiers hunt the nearest zombie
local function nearestZombie(fromPosition)
	local best, bestDist = nil, math.huge
	for _, zombie in ipairs(zombiesFolder:GetChildren()) do
		local root = livingRoot(zombie)
		if root then
			local dist = (root.Position - fromPosition).Magnitude
			if dist < bestDist then best, bestDist = root, dist end
		end
	end
	return best, bestDist
end

-- ── Projectiles (arrows, bolts, rockets, boulders, cannonballs) ──────────────
local function damageZombiesAround(position, radius, damage)
	for _, zombie in ipairs(zombiesFolder:GetChildren()) do
		local root = livingRoot(zombie)
		if root and (root.Position - position).Magnitude <= radius then
			local humanoid = zombie:FindFirstChildOfClass("Humanoid")
			if humanoid then humanoid:TakeDamage(damage) end
		end
	end
end

local function fireProjectile(fromPos, targetRoot, cfg)
	local projectile = Instance.new("Part")
	projectile.Size       = cfg.aoe and Vector3.new(1.2, 1.2, 1.2) or Vector3.new(0.3, 0.3, 1.6)
	projectile.Color      = cfg.projectileColor or Color3.fromRGB(120, 85, 50)
	projectile.Material   = Enum.Material.SmoothPlastic
	projectile.Anchored   = true
	projectile.CanCollide = false
	projectile.CFrame     = CFrame.new(fromPos, targetRoot.Position)
	projectile.Parent     = workspace

	task.spawn(function()
		local speed = 70
		local pos = fromPos
		while projectile.Parent do
			if not targetRoot.Parent then break end
			local targetPos = targetRoot.Position
			local step = speed * 0.03
			local toTarget = targetPos - pos
			if toTarget.Magnitude <= step then
				-- Impact
				if cfg.aoe then
					damageZombiesAround(targetPos, cfg.aoe, cfg.damage)
					local boom = Instance.new("Explosion")
					boom.Position = targetPos
					boom.BlastRadius = 0          -- visual only, damage is ours
					boom.BlastPressure = 0
					boom.Parent = workspace
				else
					local humanoid = targetRoot.Parent:FindFirstChildOfClass("Humanoid")
					if humanoid then humanoid:TakeDamage(cfg.damage) end
				end
				break
			end
			pos = pos + toTarget.Unit * step
			projectile.CFrame = CFrame.new(pos, targetPos)
			task.wait(0.03)
		end
		projectile:Destroy()
	end)
end

-- ── Soldier AI: rally at camp, charge the nearest zombie, attack ─────────────
local function startSoldierAI(soldier, cfg, rallyPosition)
	local humanoid = soldier:FindFirstChildOfClass("Humanoid")
	local root     = soldier:FindFirstChild("HumanoidRootPart")
	if not humanoid or not root then return end

	if not cfg.vehicle then
		local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator", humanoid)
		local walkAnim = Instance.new("Animation")
		walkAnim.AnimationId = WALK_ANIM_ID
		local track = animator:LoadAnimation(walkAnim)
		track.Looped = true
		track:Play()
	end

	task.spawn(function()
		local lastHit = 0
		while soldier.Parent and humanoid.Health > 0 do
			local targetRoot, dist = nearestZombie(root.Position)
			if targetRoot then
				if cfg.ranged and dist <= cfg.attackRange then
					-- Hold position, face the enemy, shoot
					humanoid:MoveTo(root.Position)
					root.CFrame = CFrame.new(root.Position, Vector3.new(targetRoot.Position.X, root.Position.Y, targetRoot.Position.Z))
					if os.clock() - lastHit >= cfg.attackCooldown then
						lastHit = os.clock()
						fireProjectile(root.Position + Vector3.new(0, 1.5, 0), targetRoot, cfg)
					end
				else
					humanoid:MoveTo(targetRoot.Position)
					if not cfg.ranged and dist <= cfg.attackRange
						and os.clock() - lastHit >= cfg.attackCooldown then
						lastHit = os.clock()
						local enemyHumanoid = targetRoot.Parent:FindFirstChildOfClass("Humanoid")
						if enemyHumanoid then enemyHumanoid:TakeDamage(cfg.damage) end
					end
				end
			else
				humanoid:MoveTo(rallyPosition)
			end
			task.wait(RETARGET_EVERY)
		end
	end)
end

-- ── Camps: construction + automatic unit production ──────────────────────────
local campSlotIndex = 0

local function nextCampPosition()
	local col = campSlotIndex % 6
	local row = math.floor(campSlotIndex / 6)
	campSlotIndex = campSlotIndex + 1
	return CAMP_ORIGIN + Vector3.new(col * 12, 0, row * 14)
end

local function spawnSoldier(cfg, campPosition)
	local soldier = buildHumanoidRig(cfg, cfg.unitName, Color3.fromRGB(120, 220, 120))
	local offset = Vector3.new(math.random(-3, 3), 4, -6)
	soldier:PivotTo(CFrame.new(campPosition + offset, campPosition + offset + Vector3.new(0, 0, -10)))
	soldier.Parent = soldiersFolder

	local rallyPosition = campPosition + Vector3.new(0, 0, -10)
	startSoldierAI(soldier, cfg, rallyPosition)

	local humanoid = soldier:FindFirstChildOfClass("Humanoid")
	humanoid.Died:Connect(function()
		task.delay(3, function()
			if soldier.Parent then soldier:Destroy() end
		end)
	end)
	return soldier
end

local function buildCamp(cfg)
	local position = nextCampPosition()

	local camp = Instance.new("Model")
	camp.Name = cfg.campName

	local building = Instance.new("Part")
	building.Size      = Vector3.new(8, 5, 8)
	building.Color     = cfg.campColor
	building.Material  = Enum.Material.Brick
	building.Anchored  = true
	building.CFrame    = CFrame.new(position + Vector3.new(0, 2.5, 0))
	building.Parent    = camp

	local roof = Instance.new("WedgePart")
	roof.Size     = Vector3.new(8, 3, 8)
	roof.Color    = Color3.fromRGB(70, 50, 40)
	roof.Material = Enum.Material.Slate
	roof.Anchored = true
	roof.CFrame   = CFrame.new(position + Vector3.new(0, 6.5, 0))
	roof.Parent   = camp

	local sign = Instance.new("BillboardGui")
	sign.Size        = UDim2.new(8, 0, 2, 0)
	sign.StudsOffset = Vector3.new(0, 6, 0)
	sign.AlwaysOnTop = true
	sign.Adornee     = building
	sign.Parent      = building

	local signText = Instance.new("TextLabel")
	signText.Size = UDim2.new(1, 0, 1, 0)
	signText.BackgroundTransparency = 1
	signText.Text       = cfg.campName
	signText.TextColor3 = Color3.fromRGB(255, 255, 255)
	signText.TextStrokeTransparency = 0.4
	signText.TextScaled = true
	signText.Font       = Enum.Font.GothamBold
	signText.Parent     = sign

	camp.Parent = campsFolder
	print(string.format("[ZombieSpawner] Built %s — produces %s every %ds (max %d alive)",
		cfg.campName, cfg.unitName, cfg.produceEvery, cfg.maxAlive))

	-- Production loop: keep up to maxAlive units in the field
	task.spawn(function()
		local aliveUnits = {}
		while camp.Parent do
			for i = #aliveUnits, 1, -1 do
				local unit = aliveUnits[i]
				local humanoid = unit and unit:FindFirstChildOfClass("Humanoid")
				if not unit.Parent or not humanoid or humanoid.Health <= 0 then
					table.remove(aliveUnits, i)
				end
			end
			if #aliveUnits < cfg.maxAlive then
				table.insert(aliveUnits, spawnSoldier(cfg, position))
			end
			task.wait(cfg.produceEvery)
		end
	end)
end

-- ── Build Plaza: clickable podiums, one per camp type ────────────────────────
local function buildPlaza()
	for index, cfg in ipairs(UNIT_TYPES) do
		local col = (index - 1) % 6
		local row = math.floor((index - 1) / 6)
		local position = PLAZA_CENTER + Vector3.new((col - 2.5) * 7, 1.5, row * 7)

		local podium = Instance.new("Part")
		podium.Name      = "BuildPodium_" .. cfg.id
		podium.Size      = Vector3.new(4, 3, 4)
		podium.Color     = cfg.campColor
		podium.Material  = Enum.Material.Neon
		podium.Anchored  = true
		podium.CFrame    = CFrame.new(position)
		podium.Parent    = workspace

		local sign = Instance.new("BillboardGui")
		sign.Size        = UDim2.new(6, 0, 2.4, 0)
		sign.StudsOffset = Vector3.new(0, 3, 0)
		sign.AlwaysOnTop = true
		sign.Adornee     = podium
		sign.Parent      = podium

		local signText = Instance.new("TextLabel")
		signText.Size = UDim2.new(1, 0, 1, 0)
		signText.BackgroundTransparency = 1
		signText.Text       = string.format("%s\n出%s · 💰%d", cfg.campName, cfg.unitName, cfg.cost)
		signText.TextColor3 = Color3.fromRGB(255, 255, 255)
		signText.TextStrokeTransparency = 0.4
		signText.TextScaled = true
		signText.Font       = Enum.Font.GothamBold
		signText.Parent     = sign

		local click = Instance.new("ClickDetector")
		click.MaxActivationDistance = 40
		click.Parent = podium

		click.MouseClick:Connect(function()
			if trySpendGold(cfg.cost) then
				buildCamp(cfg)
			end
		end)
	end
	print("[ZombieSpawner] Build Plaza ready — click a podium to construct a camp")
end

buildPlaza()

-- ── Zombie AI: walk animation, chase nearest target, attack on contact ──────
local function startZombieAI(zombie, variant)
	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	local root     = zombie:FindFirstChild("HumanoidRootPart")
	if not humanoid or not root then return end

	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator", humanoid)
	local walkAnim = Instance.new("Animation")
	walkAnim.AnimationId = WALK_ANIM_ID
	local walkTrack = animator:LoadAnimation(walkAnim)
	walkTrack.Looped = true
	walkTrack:Play()

	task.spawn(function()
		local lastHit = 0
		while zombie.Parent and humanoid.Health > 0 do
			local targetRoot, dist = nearestZombieTarget(root.Position)
			if targetRoot then
				humanoid:MoveTo(targetRoot.Position)
				if dist <= 4 and os.clock() - lastHit >= 1.2 then
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
local currentWave   = 0
local activeZombies = {}

local zombieTemplate = ServerStorage:FindFirstChild("Zombie")
if zombieTemplate then
	print("[ZombieSpawner] Using Zombie template from ServerStorage")
else
	print("[ZombieSpawner] No template found — building zombie soldiers in code")
end

local function spawnZombie()
	local variant = pickZombieVariant()
	local zombie
	if zombieTemplate then
		zombie = zombieTemplate:Clone()
	else
		zombie = buildHumanoidRig(variant, variant.name, Color3.fromRGB(255, 90, 90))
	end

	local offset = Vector3.new(math.random(-5, 5), 3, math.random(-5, 5))
	zombie:PivotTo(SPAWN_PART.CFrame + offset)
	zombie.Parent = zombiesFolder

	local humanoid = zombie:FindFirstChildOfClass("Humanoid")
	if humanoid then
		table.insert(activeZombies, zombie)
		startZombieAI(zombie, variant)

		humanoid.Died:Connect(function()
			addGold(variant.bounty)
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
			"Next wave in " .. i .. "s... 抓紧建造兵营!",
			Color3.fromRGB(255, 200, 50)
		)
		task.wait(1)
	end
end

-- ── Main wave loop ────────────────────────────────────────────────────────────
local function startWaves()
	while true do
		currentWave        = currentWave + 1
		local totalZombies = STARTING_ZOMBIES + (currentWave - 1) -- +1 per wave

		print(string.format("[ZombieSpawner] Wave %d — %d zombies", currentWave, totalZombies))

		updateGui(
			"Wave " .. currentWave .. " — START!",
			totalZombies .. " zombies incoming!",
			Color3.fromRGB(255, 50, 50)
		)
		task.wait(2)

		for i = 1, totalZombies do
			spawnZombie()
			updateGui(
				"Wave " .. currentWave,
				"Spawning zombie " .. i .. "/" .. totalZombies,
				Color3.fromRGB(255, 80, 80)
			)
			task.wait(SPAWN_INTERVAL)
		end

		waitForWaveClear()

		local bonus = WAVE_CLEAR_BASE + 10 * currentWave
		addGold(bonus)
		print(string.format("[ZombieSpawner] Wave %d cleared! +%d gold", currentWave, bonus))

		updateGui(
			"Wave " .. currentWave .. " Cleared!",
			"奖励 +" .. bonus .. " 金币!",
			Color3.fromRGB(50, 255, 100)
		)
		task.wait(2)

		showCountdown(WAVE_BREAK)
	end
end

startWaves()
