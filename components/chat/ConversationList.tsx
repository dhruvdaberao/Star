import React from 'react';
import { Conversation, User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface ConversationListProps {
  conversations: Conversation[];
  currentUser: User;
  allUsers: User[];
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, currentUser, allUsers, activeConversationId, onSelectConversation }) => {
  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="p-5 flex-shrink-0">
        <h2 className="text-3xl font-bold font-display text-primary">Messages</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        {conversations.map(conv => {
          // Find the other participant's full user object from the allUsers list
          const otherParticipantId = conv.participants.find(p => p.id !== currentUser.id)?.id;
          // Fix: Ensure otherParticipant is a valid User object and handle cases where it might not be found.
          const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
          if (!otherParticipant) {
            return null; // Don't render conversation if the other user isn't found
          }
          const isActive = conv.id === activeConversationId;
          
          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`flex items-center p-4 cursor-pointer transition-colors border-t border-border ${
                isActive ? 'bg-background' : 'hover:bg-background'
              }`}
            >
                <div className="w-12 h-12 rounded-full mr-4 flex-shrink-0">
                    <UserAvatar user={otherParticipant} className="w-full h-full" />
                </div>
              <div className="flex-1 overflow-hidden">
                <p className={`font-semibold text-primary`}>{otherParticipant.name}</p>
                <p className="text-sm text-secondary truncate">{conv.lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;