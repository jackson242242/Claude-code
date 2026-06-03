import type { Metadata } from 'next';
import { SharedTripView } from '@/components/SharedTripView';

export const metadata: Metadata = {
  title: 'Shared trip · World Cup 2026 Tour Guide',
};

interface SharedTripPageProps {
  params: Promise<{ token: string }>;
}

const SharedTripPage = async ({ params }: SharedTripPageProps) => {
  const { token } = await params;
  return <SharedTripView token={token} />;
};

export default SharedTripPage;
