import type { Metadata } from 'next';
import { FitnessTracker } from '@/components/fitness/FitnessTracker';

export const metadata: Metadata = {
  title: '每日运动 · Matchday26',
  description:
    '本地优先的每日运动打卡：今日打卡环、连续天数、本周完成率、健身房 / 居家 / 休息模式切换。数据存在本设备。',
};

const FitnessPage = () => <FitnessTracker />;

export default FitnessPage;
