import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, Mail, Inbox, UserCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Message, Profile } from '@/types';
import { sanitizeText, validateRequired, validateMaxLength, rateLimit } from '@/lib/validation';

export default function Messages() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadMessages();

    // Check for pre-filled compose from URL params
    const toParam = searchParams.get('to');
    const subjectParam = searchParams.get('subject');
    if (toParam) {
      setReceiverId(toParam);
      if (subjectParam) setSubject(subjectParam);
      setShowCompose(true);
    }

    // Load all profiles for the compose dropdown
    async function loadProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      setProfiles((data as Profile[]) ?? []);
    }
    loadProfiles();
  }, [loadMessages, searchParams]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    const subjectCheck = validateRequired(subject, 'Subject');
    if (!subjectCheck.valid) return setError(subjectCheck.message ?? null);

    const bodyCheck = validateRequired(body, 'Message');
    if (!bodyCheck.valid) return setError(bodyCheck.message ?? null);

    const subCheck = validateMaxLength(subject, 200, 'Subject');
    if (!subCheck.valid) return setError(subCheck.message ?? null);

    const bodyCheck2 = validateMaxLength(body, 5000, 'Message');
    if (!bodyCheck2.valid) return setError(bodyCheck2.message ?? null);

    const rl = rateLimit('message', 10, 60000);
    if (!rl.allowed) return setError(rl.message ?? null);

    setSending(true);

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: receiverId,
      subject: sanitizeText(subject),
      body: sanitizeText(body),
      read: false,
    });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    // Notify the receiver
    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'message',
      title: `New message: ${subject}`,
      body: `${profile.full_name} sent you a message.`,
      link: '/messages',
      read: false,
    });

    setSending(false);
    setShowCompose(false);
    setSubject('');
    setBody('');
    setReceiverId('');
    loadMessages();
  }

  async function selectMessage(msg: Message) {
    setSelectedMsg(msg);
    if (msg.receiver_id === profile?.id && !msg.read) {
      await supabase.from('messages').update({ read: true }).eq('id', msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      );
    }
  }

  async function handleDelete(msg: Message) {
    if (!window.confirm('Delete this message? This removes it for both people and cannot be undone.')) return;
    const { error: delError } = await supabase.from('messages').delete().eq('id', msg.id);
    if (delError) {
      window.alert('Could not delete the message: ' + delError.message);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setSelectedMsg(null);
  }

  const inboxMessages = messages.filter((m) => m.receiver_id === profile?.id);
  const sentMessages = messages.filter((m) => m.sender_id === profile?.id);
  const displayMessages = tab === 'inbox' ? inboxMessages : sentMessages;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Communicate with employers and candidates</p>
        </div>
        <button onClick={() => setShowCompose(!showCompose)} className="btn-primary">
          <Send className="w-4 h-4" /> Compose
        </button>
      </div>

      {showCompose && (
        <div className="card p-6 animate-slide-down">
          <h3 className="font-semibold mb-4">New Message</h3>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="label" htmlFor="receiver">To</label>
              <select
                id="receiver"
                className="input"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                <option value="">Select a recipient...</option>
                {profiles
                  .filter((p) => p.id !== profile?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role}
                      {p.company_name ? ` — ${p.company_name}` : ''})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                className="input"
                placeholder="Message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div>
              <label className="label" htmlFor="body">Message</label>
              <textarea
                id="body"
                className="input min-h-[150px] resize-y"
                placeholder="Write your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">{body.length}/5000 characters</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('inbox')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'inbox'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox className="w-4 h-4" /> Inbox ({inboxMessages.length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'sent'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send className="w-4 h-4" /> Sent ({sentMessages.length})
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="animate-pulse text-gray-400">Loading messages...</div>
          ) : displayMessages.length === 0 ? (
            <div className="card p-8 text-center">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No messages {tab === 'inbox' ? 'in your inbox' : 'sent'}.</p>
            </div>
          ) : (
            displayMessages.map((msg) => {
              const otherPerson = tab === 'inbox' ? msg.sender : msg.receiver;
              const isSelected = selectedMsg?.id === msg.id;
              const isUnread = tab === 'inbox' && !msg.read;
              return (
                <div
                  key={msg.id}
                  onClick={() => selectMessage(msg)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-50 border-2 border-primary-300'
                      : isUnread
                      ? 'bg-white border-2 border-transparent hover:bg-gray-50 font-medium'
                      : 'bg-white border-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isUnread && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">
                      {otherPerson?.full_name ?? 'Unknown'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{msg.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Message detail */}
        <div className="md:col-span-2">
          {selectedMsg ? (
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {tab === 'inbox' ? selectedMsg.sender?.full_name : selectedMsg.receiver?.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tab === 'inbox' ? 'From' : 'To'}: {tab === 'inbox' ? selectedMsg.sender?.email : selectedMsg.receiver?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedMsg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-3">{selectedMsg.subject}</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedMsg.body}</p>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {tab === 'inbox' && (
                  <button
                    onClick={() => {
                      setReceiverId(selectedMsg.sender_id);
                      setSubject(`Re: ${selectedMsg.subject}`);
                      setShowCompose(true);
                      setSelectedMsg(null);
                    }}
                    className="btn-secondary"
                  >
                    <Send className="w-4 h-4" /> Reply
                  </button>
                )}
                <button onClick={() => handleDelete(selectedMsg)} className="btn-secondary text-red-600">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">Select a message to read.</p>
            </div>
          )}
        </div>
      </div>
      <div ref={bottomRef} />
    </div>
  );
}