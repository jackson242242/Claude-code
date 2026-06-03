import { BookingDetailView } from '@/components/BookingDetailView';

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

const BookingPage = async ({ params }: BookingPageProps) => {
  const { id } = await params;
  return <BookingDetailView bookingId={id} />;
};

export default BookingPage;
