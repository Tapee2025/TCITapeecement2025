import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, User, Bot, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SupportTicket, SupportMessage } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';

export default function SupportChat() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const
  });

  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      
      // Auto-select the most recent open ticket
      const openTicket = data?.find(t => t.status !== 'closed' && t.status !== 'resolved');
      if (openTicket && !activeTicket) {
        setActiveTicket(openTicket);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, [currentUser, activeTicket]);

  const fetchMessages = useCallback(async () => {
    if (!activeTicket) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:users!support_messages_sender_id_fkey(first_name, last_name, role)
        `)
        .eq('ticket_id', activeTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [activeTicket]);

  const subscribeToMessages = useCallback(() => {
    if (!activeTicket) return;

    // Clean up previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const subscription = supabase
      .channel(`ticket-${activeTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${activeTicket.id}`
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from('users')
            .select('first_name, last_name, role')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, sender }]);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;
  }, [activeTicket]);

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchTickets();
    }

    return () => {
      // Clean up subscription when component unmounts
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUser, isOpen, fetchTickets]);

  useEffect(() => {
    if (activeTicket) {
      fetchMessages();
      subscribeToMessages();
    }

    return () => {
      // Clean up subscription when active ticket changes
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [activeTicket, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createTicket = async () => {
    if (!currentUser || !newTicketData.subject.trim() || !newTicketData.description.trim()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          subject: newTicketData.subject.trim(),
          description: newTicketData.description.trim(),
          category: newTicketData.category,
          priority: newTicketData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      setActiveTicket(data);
      setShowNewTicketForm(false);
      setNewTicketData({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!activeTicket || !newMessage.trim() || !currentUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: activeTicket.id,
          sender_id: currentUser.id,
          message: newMessage.trim(),
          is_internal: false
        });

      if (error) throw error;

      // Update ticket status to indicate user activity
      await supabase
        .from('support_tickets')
        .update({ 
          status: activeTicket.status === 'waiting_user' ? 'in_progress' : activeTicket.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTicket.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Check if there are any unresolved tickets
  const hasUnresolvedTickets = tickets.some(ticket => 
    ticket.status !== 'resolved' && ticket.status !== 'closed'
  );

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40 flex items-center justify-center"
        aria-label="Support chat"
      >
        <MessageCircle size={20} />
        {hasUnresolvedTickets && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-40 transition-all duration-300 ${
            isMinimized 
              ? 'bottom-20 right-6 w-64 h-12 rounded-t-lg rounded-b-none shadow-lg' 
              : 'bottom-6 right-6 w-72 sm:w-80 h-[450px] sm:h-[500px] rounded-lg shadow-xl'
          } bg-white border border-gray-200 flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-primary-600 text-white p-2 flex justify-between items-center">
            <h3 className="font-medium text-sm truncate">
              {isMinimized ? 'Support Chat' : (activeTicket ? `Ticket: ${activeTicket.subject}` : 'Support Chat')}
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Clean up when closing chat
                  if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                  }
                }}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content - Only show if not minimized */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!activeTicket ? (
                /* Ticket List or New Ticket Form */
                <div className="flex-1 p-3 overflow-y-auto">
                  {showNewTicketForm ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Create New Ticket</h4>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={newTicketData.subject}
                          onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Brief description of your issue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={newTicketData.category}
                          onChange={(e) => setNewTicketData(prev => ({ ...prev, category: e.target.value as any }))}
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="account">Account</option>
                          <option value="points">Points</option>
                          <option value="rewards">Rewards</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={newTicketData.description}
                          onChange={(e) => setNewTicketData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Please describe your issue in detail"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={createTicket}
                          disabled={loading || !newTicketData.subject.trim() || !newTicketData.description.trim()}
                          className="flex-1 bg-primary-600 text-white py-1.5 px-3 rounded-md text-xs hover:bg-primary-700 disabled:opacity-50"
                        >
                          {loading ? 'Creating...' : 'Create Ticket'}
                        </button>
                        <button
                          onClick={() => setShowNewTicketForm(false)}
                          className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm">Your Tickets</h4>
                        <button
                          onClick={() => setShowNewTicketForm(true)}
                          className="bg-primary-600 text-white px-2 py-1 rounded-md text-xs hover:bg-primary-700"
                        >
                          New Ticket
                        </button>
                      </div>
                      
                      {tickets.length > 0 ? (
                        <div className="space-y-2">
                          {tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              onClick={() => setActiveTicket(ticket)}
                              className="p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="font-medium text-xs truncate">{ticket.subject}</h5>
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-6">
                          <MessageCircle size={24} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-xs">No support tickets yet</p>
                          <button
                            onClick={() => setShowNewTicketForm(true)}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-xs"
                          >
                            Create your first ticket
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Chat Messages */
                <>
                  <div className="p-2 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-xs truncate">{activeTicket.subject}</h4>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(activeTicket.status)}`}>
                        {activeTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTicket(null)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {messages.map((message) => {
                      const isUser = message.sender_id === currentUser?.id;
                      const sender = message.sender as any;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] px-3 py-2 rounded-lg ${
                            isUser 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {!isUser && (
                              <div className="flex items-center mb-1">
                                {sender?.role === 'admin' ? (
                                  <Bot size={10} className="mr-1" />
                                ) : (
                                  <User size={10} className="mr-1" />
                                )}
                                <span className="text-xs font-medium">
                                  {sender?.role === 'admin' ? 'Support' : `${sender?.first_name} ${sender?.last_name}`}
                                </span>
                              </div>
                            )}
                            <p className="text-xs">{message.message}</p>
                            <p className={`text-[10px] mt-1 ${isUser ? 'text-primary-200' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-2 border-t border-gray-200">
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 rounded-md text-xs"
                        disabled={loading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={loading || !newMessage.trim()}
                        className="bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}