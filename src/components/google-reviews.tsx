'use client';

import { Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  time: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    author: 'John Smith',
    rating: 5,
    text: 'Excellent service! The team was very professional and responsive.',
    time: '2 days ago',
  },
  {
    id: '2',
    author: 'Sarah Johnson',
    rating: 4,
    text: 'Great experience overall. Would recommend to others.',
    time: '1 week ago',
  },
  {
    id: '3',
    author: 'Mike Williams',
    rating: 5,
    text: 'Outstanding support and quality work. Very satisfied!',
    time: '2 weeks ago',
  },
  {
    id: '4',
    author: 'Emily Davis',
    rating: 3,
    text: 'Good service but communication could be improved.',
    time: '3 weeks ago',
  },
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
};

export function GoogleReviews() {
  const averageRating = (
    mockReviews.reduce((acc, review) => acc + review.rating, 0) / mockReviews.length
  ).toFixed(1);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-base">Google Reviews</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold">{averageRating}</span>
          <StarRating rating={Math.round(Number(averageRating))} />
          <span className="text-xs text-muted-foreground">({mockReviews.length} reviews)</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {mockReviews.map((review) => (
            <div
              key={review.id}
              className="p-3 rounded-lg bg-muted/30 border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{review.author}</span>
                <span className="text-xs text-muted-foreground">{review.time}</span>
              </div>
              <StarRating rating={review.rating} />
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
