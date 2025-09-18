import React, { useState, useRef, useEffect } from 'react';
import { Conversation, User, Message } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface MessageAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

const MessageArea: React.FC<MessageAreaProps> = ({ conversation, messages, currentUser, allUsers, onSendMessage, onBack }) => {
  const [inputText, setInputText] = useState('');
  const otherParticipantId = conversation.participants.find(p => p.id !== currentUser.id)?.id;
  const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  if (!otherParticipant) {
      return (
          <div className="flex flex-col h-full bg-surface">
              <div className="flex items-center p-3 border-b border-border flex-shrink-0">
                  <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
                      <BackIcon />
                  </button>
                  <h2 className="text-lg font-bold text-primary">Error</h2>
              </div>
              <div className="flex-1 flex items-center justify-center">
                  <p className="text-secondary">Could not load conversation.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header (Fixed) */}
      <div className="flex items-center p-3 border-b border-border bg-surface flex-shrink-0">
        <button onClick={onBack} className="md:hidden p-2 mr-2 text-primary">
            <BackIcon />
        </button>
        <div className="w-10 h-10 rounded-full mr-3 flex-shrink-0">
            <UserAvatar user={otherParticipant} className="w-full h-full" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-primary leading-tight">{otherParticipant.name}</h2>
            <p className="text-sm text-secondary leading-tight">@{otherParticipant.username}</p>
        </div>
      </div>

      {/* Messages (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col space-y-2">
          {messages.map(message => {
            const isCurrentUser = message.senderId === currentUser.id;
            const sentAt = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            return (
              <div key={message.id} className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 self-start">
                        <UserAvatar user={otherParticipant} className="w-full h-full" />
                    </div>
                )}
                <div className={`flex flex-col w-full max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-xl ${isCurrentUser ? 'bg-accent text-accent-text' : 'bg-surface text-primary shadow-sm'}`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                    <p className="text-xs text-secondary mt-1.5 px-1">{sentAt}</p>
                </div>
              </div>
            );
          })}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input (Fixed) */}
      <div className="p-4 border-t border-border bg-surface flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
          />
          <button type="submit" className="bg-accent text-accent-text rounded-full w-11 h-11 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!inputText.trim()}>
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

export default MessageArea;
