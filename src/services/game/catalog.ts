import type { UnitTypeDef, ZombieTypeDef } from '@/types/game';

const SKIN = '#eab892';

/** Cost of the buildable 堡垒 (3×3 walled fort with a central arrow tower). */
export const FORT_COST = 500;

export const FORT_ITEM = {
  id: 'fort',
  campName: '堡垒',
  unitName: '箭塔城寨',
  cost: FORT_COST,
  campColor: '#969aa0',
  description: '3×3 城寨:八面石墙环绕一座自动射箭的中央箭塔,扎在要道上当关卡。',
} as const;

/** Every camp trains exactly one unit type — 盖什么营,出什么兵. */
export const UNIT_TYPES: readonly UnitTypeDef[] = [
  {
    id: 'infantry', campName: '步兵营', unitName: '步兵',
    description: '持剑近战,前排主力。',
    cost: 100, health: 140, speed: 1.7, damage: 15, range: 0.9, cooldown: 1.2,
    ranged: false, domain: 'land', maxAlive: 3, produceEvery: 8,
    body: 'human', weapon: 'sword',
    colors: { skin: SKIN, shirt: '#46618c', pants: '#2f3850' }, campColor: '#46618c',
  },
  {
    id: 'archer', campName: '弓兵营', unitName: '弓兵',
    description: '远程射箭;站上山地射程更远。',
    cost: 150, health: 80, speed: 1.7, damage: 12, range: 5, cooldown: 1.5,
    ranged: true, domain: 'land', maxAlive: 3, produceEvery: 8,
    body: 'human', weapon: 'bow',
    colors: { skin: SKIN, shirt: '#3f7a48', pants: '#32402f' }, campColor: '#3f7a48',
  },
  {
    id: 'crossbow', campName: '强弩营', unitName: '强弩兵',
    description: '弩矢射程更远、伤害更高,装填慢。',
    cost: 200, health: 100, speed: 1.5, damage: 25, range: 6.5, cooldown: 2.5,
    ranged: true, domain: 'land', maxAlive: 3, produceEvery: 10,
    body: 'human', weapon: 'crossbow',
    colors: { skin: SKIN, shirt: '#5a466e', pants: '#2d2837' }, campColor: '#5a466e',
  },
  {
    id: 'cavalry', campName: '骑兵营', unitName: '骑兵',
    description: '骑马持矛,全场最快的突击力量。',
    cost: 250, health: 180, speed: 3.2, damage: 20, range: 1, cooldown: 1.2,
    ranged: false, domain: 'land', maxAlive: 3, produceEvery: 12,
    body: 'rider', weapon: 'spear',
    colors: { skin: SKIN, shirt: '#963c3c', pants: '#3c2828' }, campColor: '#963c3c',
  },
  {
    id: 'barbarian', campName: '南蛮营', unitName: '南蛮兵',
    description: '赤膊挥棒,攻高血厚的狂战士。',
    cost: 150, health: 160, speed: 2.1, damage: 22, range: 0.9, cooldown: 1.0,
    ranged: false, domain: 'land', maxAlive: 3, produceEvery: 8,
    body: 'human', weapon: 'club',
    colors: { skin: '#be8c64', shirt: '#be8c64', pants: '#8c3228' }, campColor: '#aa5a32',
  },
  {
    id: 'marine', campName: '水兵营', unitName: '水兵',
    description: '两栖部队,能下河游泳拦截渡河之敌。',
    cost: 150, health: 120, speed: 1.9, damage: 14, range: 0.9, cooldown: 1.1,
    ranged: false, domain: 'amphibious', maxAlive: 3, produceEvery: 8,
    body: 'human', weapon: 'spear',
    colors: { skin: SKIN, shirt: '#dce1eb', pants: '#28468c' }, campColor: '#4682c8',
  },
  {
    id: 'beast', campName: '兽栏', unitName: '动物兵·战狼',
    description: '放出的战狼,迅猛的撕咬肉盾。',
    cost: 250, health: 220, speed: 2.6, damage: 20, range: 0.9, cooldown: 1.0,
    ranged: false, domain: 'land', maxAlive: 2, produceEvery: 12,
    body: 'wolf', weapon: 'none',
    colors: { skin: '#787880', shirt: '#6e6e73', pants: '#505055' }, campColor: '#6e6e73',
  },
  {
    id: 'rocket', campName: '火箭营', unitName: '火箭兵',
    description: '肩扛火箭,落点范围爆炸。',
    cost: 300, health: 90, speed: 1.5, damage: 30, range: 7, cooldown: 4.0,
    ranged: true, aoe: 1.6, domain: 'land', maxAlive: 2, produceEvery: 12,
    body: 'human', weapon: 'rocket',
    colors: { skin: SKIN, shirt: '#3c3c41', pants: '#28282d' }, campColor: '#e65028',
  },
  {
    id: 'ram', campName: '攻城车厂', unitName: '攻城车',
    description: '裹甲撞车,缓慢但一击千钧。',
    cost: 300, health: 500, speed: 0.9, damage: 50, range: 1.2, cooldown: 3.0,
    ranged: false, domain: 'land', maxAlive: 1, produceEvery: 18,
    body: 'ram', weapon: 'none',
    colors: { skin: SKIN, shirt: '#694b32', pants: '#694b32' }, campColor: '#694b32',
  },
  {
    id: 'catapult', campName: '投石车厂', unitName: '投石车',
    description: '巨石抛射,全场最远,溅射成片。',
    cost: 350, health: 300, speed: 0.8, damage: 40, range: 8.5, cooldown: 6.0,
    ranged: true, aoe: 2, domain: 'land', maxAlive: 1, produceEvery: 18,
    body: 'catapult', weapon: 'none',
    colors: { skin: SKIN, shirt: '#82643c', pants: '#82643c' }, campColor: '#82643c',
  },
  {
    id: 'raft', campName: '木筏坞', unitName: '木筏',
    description: '便宜的水上单位;船坞要盖在河边。',
    cost: 120, health: 150, speed: 1.6, damage: 10, range: 1, cooldown: 1.5,
    ranged: false, domain: 'water', maxAlive: 2, produceEvery: 10,
    body: 'raft', weapon: 'none',
    colors: { skin: SKIN, shirt: '#a0825a', pants: '#a0825a' }, campColor: '#a0825a',
  },
  {
    id: 'ship', campName: '战船坞', unitName: '战船',
    description: '河上炮台,炮击溅射;船坞要盖在河边。',
    cost: 400, health: 600, speed: 1.4, damage: 30, range: 7, cooldown: 4.0,
    ranged: true, aoe: 1.6, domain: 'water', maxAlive: 1, produceEvery: 20,
    body: 'ship', weapon: 'none',
    colors: { skin: SKIN, shirt: '#503c2d', pants: '#503c2d' }, campColor: '#2d5f96',
  },
];

export const ZOMBIE_TYPES: readonly ZombieTypeDef[] = [
  {
    id: 'walker', name: '感染士兵', weight: 60, bounty: 20,
    health: 100, speed: 1.1, damage: 10, domain: 'land',
    colors: { skin: '#79a66e', shirt: '#3a492f', pants: '#2c3326' },
  },
  {
    id: 'sprinter', name: '奔跑者', weight: 25, bounty: 25,
    health: 60, speed: 2.2, damage: 8, domain: 'amphibious',
    colors: { skin: '#a8bd8e', shirt: '#5c5038', pants: '#3c3830' },
  },
  {
    id: 'brute', name: '蛮力怪', weight: 15, bounty: 60,
    health: 280, speed: 0.8, damage: 25, domain: 'land',
    colors: { skin: '#586e4e', shirt: '#462323', pants: '#232328' },
    scale: 1.35,
  },
];

export const getUnitType = (id: string): UnitTypeDef | undefined =>
  UNIT_TYPES.find((u) => u.id === id);

export const getZombieType = (id: string): ZombieTypeDef | undefined =>
  ZOMBIE_TYPES.find((z) => z.id === id);

/** Pick a zombie type from a uniform roll in [0, 1). */
export const pickZombieType = (roll: number): ZombieTypeDef => {
  const total = ZOMBIE_TYPES.reduce((sum, z) => sum + z.weight, 0);
  let acc = 0;
  for (const z of ZOMBIE_TYPES) {
    acc += z.weight;
    if (roll * total < acc) return z;
  }
  return ZOMBIE_TYPES[0];
};
