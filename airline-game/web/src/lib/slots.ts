// M2.2 slot helpers — pure read-side mirrors of CONTRACT.md §3 slot 制度/谈判.
// The server settles everything; these only decide what the UI can offer.
import type { CitySlotInfo } from '@/types';

/** 空闲持有 slot 数 = playerHeld − playerUsed（开航每端需要 ≥ 1）。 */
export const freeHeldSlots = (info: CitySlotInfo | undefined): number =>
  info ? info.playerHeld - info.playerUsed : 0;

/**
 * 该端是否已有空闲持有 slot。slotMarket 缺该城市快照时（旧后端/未结算）
 * 不阻塞操作，交给服务端校验。
 */
export const hasFreeHeldSlot = (info: CitySlotInfo | undefined): boolean =>
  info === undefined || freeHeldSlots(info) >= 1;

/** 城市池是否已满（taken ≥ capacity），满则无法谈判。 */
export const isPoolFull = (info: CitySlotInfo): boolean => info.taken >= info.capacity;

/** 谈判成本 = slotFee × 800 × (1 + taken/capacity) — CONTRACT §3，确定性无 RNG。 */
export const slotNegotiationCost = (slotFee: number, info: CitySlotInfo): number =>
  slotFee * 800 * (1 + info.taken / info.capacity);
