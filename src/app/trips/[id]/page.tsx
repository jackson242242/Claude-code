import { TripDetailView } from '@/components/TripDetailView';

interface TripPageProps {
  params: Promise<{ id: string }>;
}

const TripPage = async ({ params }: TripPageProps) => {
  const { id } = await params;
  return <TripDetailView tripId={id} />;
};

export default TripPage;
