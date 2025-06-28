import { useState, useEffect } from 'react';
import { MessageCircle, Search, Filter, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SupportTicket, SupportMessage } from '../../types/notifications';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketUsers, setTicketUsers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedTicket]);

  async function fetchTickets() {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:users!support_tickets_user_id_fkey(id, first_name, last_name, email, user_code, role),
          assigned:users!support_tickets_assigned_to_fkey(id, first_name, last_name)
        `)
        .order('updated_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setTickets(data || []);
      
      // Extract user data for quick access
      const users: Record<string, any> = {};
      data?.forEach(ticket => {
        if (ticket.user) {
          users[ticket.user.id] = ticket.user;
        }
      });
      setTicketUsers(users);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    if (!selectedTicket) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:users!support_messages_sender_id_fkey(id, first_name, last_name, role)
        `)
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }

  function subscribeToMessages() {
    if (!selectedTicket) return;

    const subscription = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from('users')
            .select('id, first_name, last_name, role')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, sender }]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function sendMessage() {
    if (!selectedTicket || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_internal: false
        });

      if (error) throw error;

      // Update ticket status to in_progress if it was waiting_user
      if (selectedTicket.status === 'waiting_user') {
        await supabase
          .from('support_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id);
        
        // Update local state
        setSelectedTicket({
          ...selectedTicket,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        });
        
        // Update tickets list
        setTickets(prev => 
          prev.map(t => t.id === selectedTicket.id ? {
            ...t,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          } : t)
        );
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTicketStatus(status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed') {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success(`Ticket status updated to ${status.replace('_', ' ')}`);
      
      // Update local state
      setSelectedTicket({
        ...selectedTicket,
        status,
        updated_at: new Date().toISOString()
      });
      
      // Update tickets list
      setTickets(prev => 
        prev.map(t => t.id === selectedTicket.id ? {
          ...t,
          status,
          updated_at: new Date().toISOString()
        } : t)
      );
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  }

  async function assignTicket() {
    if (!selectedTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          assigned_to: user.id,
          status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Ticket assigned to you');
      
      // Update local state and fetch updated ticket data
      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_user': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket => {
    const user = ticket.user as any;
    const searchString = searchQuery.toLowerCase();
    
    return (
      ticket.subject.toLowerCase().includes(searchString) ||
      ticket.description.toLowerCase().includes(searchString) ||
      user?.first_name?.toLowerCase().includes(searchString) ||
      user?.last_name?.toLowerCase().includes(searchString) ||
      user?.email?.toLowerCase().includes(searchString) ||
      user?.user_code?.toLowerCase().includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600">Manage customer support requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_user">Waiting for User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="account">Account</option>
            <option value="points">Points</option>
            <option value="rewards">Rewards</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Tickets and Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Support Tickets</h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const user = ticket.user as any;
                  const assigned = ticket.assigned as any;
                  
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <User size={14} />
                        <span>{user?.first_name} {user?.last_name}</span>
                        <span>•</span>
                        <span>{user?.role}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className={`px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-gray-500">
                          {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {assigned && (
                        <div className="mt-2 text-xs text-gray-500">
                          Assigned to: {assigned.first_name} {assigned.last_name}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow-sm border flex flex-col h-[600px]">
              {/* Ticket Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Category: {selectedTicket.category}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!selectedTicket.assigned_to && (
                      <button
                        onClick={assignTicket}
                        className="btn btn-sm btn-outline"
                      >
                        Assign to Me
                      </button>
                    )}
                    <div className="relative group">
                      <button className="btn btn-sm btn-primary">
                        Update Status
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                        <button
                          onClick={() => updateTicketStatus('open')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => updateTicketStatus('in_progress')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => updateTicketStatus('waiting_user')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Waiting for User
                        </button>
                        <button
                          onClick={() => updateTicketStatus('resolved')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Resolved
                        </button>
                        <button
                          onClick={() => updateTicketStatus('closed')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Closed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(selectedTicket.user as any)?.first_name} {(selectedTicket.user as any)?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedTicket.user as any)?.email} • {(selectedTicket.user as any)?.user_code}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {(selectedTicket.user as any)?.role}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Ticket Description */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => {
                  const isAdmin = (message.sender as any)?.role === 'admin';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        isAdmin 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium">
                            {isAdmin 
                              ? 'Support Team' 
                              : `${(message.sender as any)?.first_name} ${(message.sender as any)?.last_name}`}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${isAdmin ? 'text-primary-200' : 'text-gray-500'}`}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>No messages yet</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    disabled={submitting}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={submitting || !newMessage.trim()}
                    className="btn btn-primary"
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center h-[600px] flex flex-col items-center justify-center">
              <MessageCircle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
              <p className="text-gray-500 max-w-md">
                Select a ticket from the list to view details and respond to customer inquiries
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Tickets</p>
              <p className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Waiting for User</p>
              <p className="text-2xl font-bold text-orange-600">
                {tickets.filter(t => t.status === 'waiting_user').length}
              </p>
            </div>
            <User className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}