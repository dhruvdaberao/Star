import React, { useState, useEffect, useCallback } from 'react';
import { Conversation, User, Message } from '../../types';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import * as api from '../../api';

interface ChatPageProps {
  currentUser: User;
  allUsers: User[];
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, allUsers }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMessageAreaVisible, setMessageAreaVisible] = useState(false);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const { data } = await api.fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };
    getConversations();
  }, [currentUser.id]);
  
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    const otherUserId = conv.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;

    try {
        const { data } = await api.fetchMessages(otherUserId);
        setMessages(data);
        setActiveConversation(conv);
    } catch (error) {
        console.error("Failed to fetch messages", error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setMessageAreaVisible(true);
    } else {
      setMessageAreaVisible(!!activeConversation);
    }
  }, [activeConversation]);
  
  const handleBackToList = () => {
    setActiveConversation(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;
    const otherUserId = activeConversation.participants.find(p => p.id !== currentUser.id)?.id;
    if (!otherUserId) return;
    
    const tempMessageId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempMessageId,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
        await api.sendMessage(otherUserId, { message: text });
        // Optionally, refetch messages to get the real ID and timestamp from server
    } catch (error) {
        console.error("Failed to send message", error);
        setMessages(prev => prev.filter(m => m.id !== tempMessageId)); // Revert on failure
    }
  };
  
  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] bg-surface rounded-2xl border border-border shadow-md flex overflow-hidden relative">
       <div 
        className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 md:flex flex-col transition-transform duration-300 ease-in-out absolute md:static inset-0 border-r border-border ${
          isMessageAreaVisible && activeConversation ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        }`}
      >
        <ConversationList
            conversations={conversations}
            currentUser={currentUser}
            allUsers={allUsers}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
        />
      </div>
      
      <div 
        className={`w-full md:flex-1 flex flex-col transition-transform duration-300 ease-in-out absolute md:static inset-0 bg-background ${
            isMessageAreaVisible && activeConversation ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
        >
        {activeConversation ? (
            <MessageArea
                key={activeConversation.id}
                conversation={activeConversation}
                messages={messages}
                currentUser={currentUser}
                allUsers={allUsers}
                onSendMessage={handleSendMessage}
                onBack={handleBackToList}
            />
        ) : (
            <div className="hidden md:flex w-full h-full flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 text-secondary mb-4">
                    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-primary font-display">Your Messages</h2>
                <p className="text-secondary mt-2">Select a conversation from the list to start chatting.</p>
            </div>
        )}
       </div>
    </div>
  );
};

export default ChatPage;
