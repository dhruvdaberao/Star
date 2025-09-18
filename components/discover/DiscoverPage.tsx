import React, { useState, useMemo } from 'react';
import { Post, User } from '../../types';
import PostCard from '../feed/PostCard';
import UserCard from '../users/UserCard';

interface DiscoverPageProps {
  posts: Post[];
  users: User[];
  currentUser: User;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, text: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
  onViewProfile: (user: User) => void;
}

const DiscoverPage: React.FC<DiscoverPageProps> = (props) => {
    const { posts, users, currentUser, onToggleFollow, onViewProfile, onLikePost, onCommentPost, onDeletePost, onDeleteComment } = props;
    const [searchTerm, setSearchTerm] = useState('');

    const otherUsers = useMemo(() => users.filter(u => u.id !== currentUser.id), [users, currentUser.id]);

    const filteredResults = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return null;

        if (term.startsWith('#')) {
            const tag = term.substring(1);
            if (!tag) return { type: 'posts', data: [] };
            return {
                type: 'posts',
                data: posts.filter(p => p.content.toLowerCase().includes(`#${tag}`))
            };
        }
        
        const isUsernameSearch = term.startsWith('@');
        const query = isUsernameSearch ? term.substring(1) : term;
        if (!query) return { type: 'users', data: [] };
        
        return {
            type: 'users',
            data: otherUsers.filter(u => 
                u.name.toLowerCase().includes(query) || 
                u.username.toLowerCase().includes(query)
            )
        };

    }, [searchTerm, posts, otherUsers]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-primary mb-6 font-display">Discover</h1>

            {/* Search Bar */}
            <div className="relative mb-8">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search people (@username) or tags (#react)..."
                    className="w-full bg-surface border border-border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                    <SearchIcon />
                </div>
            </div>

            {/* Conditional Rendering */}
            {!filteredResults && (
                <div>
                    <h2 className="text-xl font-bold text-primary mb-4 font-display">Suggested for you</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherUsers.slice(0, 6).map(user => (
                            <UserCard 
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                onToggleFollow={onToggleFollow}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {filteredResults && filteredResults.type === 'users' && (
                 <div>
                    <h2 className="text-xl font-bold text-primary mb-4 font-display">
                        {filteredResults.data.length > 0 ? 'Search Results: People' : 'No people found'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResults.data.map(user => (
                            <UserCard 
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                onToggleFollow={onToggleFollow}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filteredResults && filteredResults.type === 'posts' && (
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-primary mb-4 font-display">
                        {filteredResults.data.length > 0 ? `Search Results for ${searchTerm}` : `No posts found for ${searchTerm}`}
                    </h2>
                    <div className="space-y-6">
                        {filteredResults.data.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                currentUser={currentUser} 
                                onLike={onLikePost}
                                onComment={onCommentPost}
                                onDeletePost={onDeletePost}
                                onDeleteComment={onDeleteComment}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default DiscoverPage;