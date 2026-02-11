'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientListProps {
  companyId: string;
}

export function ClientList({ companyId }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createBrowserComponentClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: async () => {
      // Fetch clients with their chat sessions
      const { data, error } = await supabase
        .from('client')
        .select(`
          *,
          chat:chat(id)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60,
  });

  // Filter clients by search query
  const filteredClients = clients?.filter((client: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const firstName = client.first_name?.toLowerCase() || '';
    const lastName = client.last_name?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`;
    return firstName.includes(searchLower) || lastName.includes(searchLower) || fullName.includes(searchLower);
  });

  const handleOpenChat = (client: any) => {
    // Get the first chat for this client, if exists
    const chatId = client.chat?.[0]?.id;
    if (chatId) {
      router.push(`/app/inbox?chat=${chatId}`);
    } else {
      // No chat exists, just go to inbox
      router.push('/app/inbox');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'conflict':
      case 'needs_human':
        return (
          <Badge 
            className="border"
            style={{ 
              backgroundColor: 'rgba(205, 133, 0, 0.1)', 
              borderColor: '#CD8500',
              color: '#CD8500'
            }}
          >
            Needs Attention
          </Badge>
        );
      case 'resolved':
        return (
          <Badge 
            className="border"
            style={{ 
              backgroundColor: 'rgba(62, 207, 142, 0.1)', 
              borderColor: '#3ecf8e',
              color: '#3ecf8e'
            }}
          >
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge 
            className="border"
            style={{ 
              backgroundColor: 'rgba(107, 114, 128, 0.1)', 
              borderColor: '#6b7280',
              color: '#6b7280'
            }}
          >
            Active
          </Badge>
        );
    }
  };

  const getReviewBadge = (client: any) => {
    if (client.review_submitted) {
      return (
        <Badge 
          className="border"
          style={{ 
            backgroundColor: 'rgba(62, 207, 142, 0.1)', 
            borderColor: '#3ecf8e',
            color: '#3ecf8e'
          }}
        >
          Reviewed
        </Badge>
      );
    }
    if (client.review_request_sent) {
      return (
        <Badge 
          className="border"
          style={{ 
            backgroundColor: 'rgba(107, 114, 128, 0.1)', 
            borderColor: '#6b7280',
            color: '#6b7280'
          }}
        >
          Requested
        </Badge>
      );
    }
    return (
      <Badge 
        className="border"
        style={{ 
          backgroundColor: 'rgba(107, 114, 128, 0.1)', 
          borderColor: '#6b7280',
          color: '#6b7280'
        }}
      >
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex flex-col h-[450px]">
      {/* Search Input */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search clients by name..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Table Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-muted/30 text-sm font-medium text-muted-foreground sticky top-0">
          <div>Name</div>
          <div>Status</div>
        </div>

      {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients && filteredClients.length > 0 ? (
          <div className="divide-y">
            {filteredClients.map((client: any) => (
              <div
                key={client.id}
                className="flex justify-between items-center px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium truncate">
                  {client.first_name} {client.last_name}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(client.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenChat(client)}
                    title="Open conversation"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No clients match your search' : 'No clients found'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
