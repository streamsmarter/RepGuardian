'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Strip all non-digit characters and format to E.164
function formatToE164(input: string, countryCode: string = '1'): string | null {
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');
  
  // Handle numbers that already include country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // Handle 10-digit US numbers
  if (digitsOnly.length === 10) {
    return `+${countryCode}${digitsOnly}`;
  }
  
  // Handle numbers with other country codes (11+ digits starting with country code)
  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }
  
  return null;
}

// Validate that input only contains allowed phone characters
function isValidPhoneInput(input: string): boolean {
  // Only allow digits, spaces, parentheses, dashes, dots, and plus sign
  return /^[\d\s()\-+.]*$/.test(input);
}

function ReferForm() {
  const searchParams = useSearchParams();
  const refcode = searchParams.get('refcode');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid phone characters
    if (isValidPhoneInput(value)) {
      setPhoneNumber(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Format and validate phone number
    const formattedPhone = formatToE164(phoneNumber);
    if (!formattedPhone) {
      setError('Please enter a valid phone number (e.g., 747-251-0029)');
      return;
    }

    if (!refcode) {
      setError('Invalid referral link');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/refer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          refcode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.booking_link) {
        window.location.href = data.booking_link;
      } else {
        setError('Unable to redirect. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!refcode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-500">Invalid Link</CardTitle>
            <CardDescription>
              This referral link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            Enter your phone number to continue with your booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
                autoComplete="tel"
                maxLength={20}
                pattern="[\d\s()\-+.]*"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !phoneNumber.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Booking'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReferForm />
    </Suspense>
  );
}
