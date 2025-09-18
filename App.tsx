import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { User, Post, Comment, Conversation, Tribe, TribeMessage, Message } from './types';
import * as api from './api';

// Components
import Sidebar from './components/layout/Sidebar';
import FeedPage from './components/feed/FeedPage';
import ProfilePage from './components/profile/ProfilePage';
import ChatPage from './components/chat/ChatPage';
import DiscoverPage from './components/discover/DiscoverPage';
import LoginPage from './components/auth/LoginPage';
import EmberChatPage from './components/ember/EmberChatPage';
import DevNotesPage from './components/DevNotesPage';
import TribesPage from './components/tribes/TribesPage';
import TribeDetailPage from './components/tribes/TribeDetailPage';
import EditTribeModal from './components/tribes/EditTribeModal';
import CreatePost from './components/feed/CreatePost';

export type NavItem = 'Home' | 'Discover' | 'Messages' | 'Tribes' | 'Profile' | 'DevNotes' | 'Ember' | 'TribeDetail';

const App: React.FC = () => {
    const { currentUser, setCurrentUser, logout } = useAuth();
    
    // Global State
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [tribes, setTribes] = useState<Tribe[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation State
    const [activeNavItem, setActiveNavItem] = useState<NavItem>('Home');
    const [viewedUser, setViewedUser] = useState<User | null>(null);
    const [viewedTribe, setViewedTribe] = useState<Tribe | null>(null);
    const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);

    const fetchData = useCallback(async () => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const [usersData, postsData, tribesData] = await Promise.all([
                api.fetchUsers(),
                api.fetchPosts(),
                api.fetchTribes(),
            ]);

            // Populate author/sender objects from the flat users list
            const userMap = new Map(usersData.data.map((user: User) => [user.id, user]));
            
            const populatedPosts = postsData.data.map((post: any) => ({
                ...post,
                author: userMap.get(post.user),
                comments: post.comments != null ? post.comments.map((comment: any) => ({
                    ...comment,
                    author: userMap.get(comment.user),
                })) : [],
            })).filter((p: Post) => p.author);

            const populatedTribes = tribesData.data.map((tribe: any) => ({
                ...tribe,
                messages: tribe.messages ? tribe.messages.map((msg: any) => ({
                    ...msg,
                    sender: userMap.get(msg.sender)
                })).filter((m: TribeMessage) => m.sender) : []
            }));

            setUsers(usersData.data);
            setPosts(populatedPosts);
            setTribes(populatedTribes);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            // Handle error, maybe logout user if token is invalid
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Update users list when currentUser changes (e.g., after follow/unfollow)
    useEffect(() => {
        if (currentUser) {
            setUsers(prevUsers => {
                const userIndex = prevUsers.findIndex(u => u.id === currentUser.id);
                if (userIndex > -1) {
                    const newUsers = [...prevUsers];
                    newUsers[userIndex] = currentUser;
                    return newUsers;
                }
                return prevUsers;
            });
        }
    }, [currentUser]);


    // --- Navigation Handlers ---
    const handleSelectItem = (item: NavItem) => {
        if (item === 'Profile') {
            setViewedUser(currentUser);
        } else {
            setViewedUser(null);
        }
        if (item !== 'TribeDetail') {
            setViewedTribe(null);
        }
        setActiveNavItem(item);
    };

    const handleViewProfile = (user: User) => {
        setViewedUser(user);
        setActiveNavItem('Profile');
    };

    // --- Post Handlers ---
    const handleAddPost = async (content: string, imageUrl?: string) => {
        if (!currentUser) return;
        try {
            const { data: newPostData } = await api.createPost({ content, imageUrl });
            const newPost: Post = {
                ...newPostData,
                author: currentUser, // Attach full user object for immediate UI update
                comments: [],
            };
            setPosts(prevPosts => [newPost, ...prevPosts]);
        } catch (error) {
            console.error("Failed to add post:", error);
            alert("Could not create post. Please try again.");
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!currentUser) return;
        // Optimistic update
        setPosts(posts.map(p => {
            if (p.id === postId) {
                const isLiked = p.likes.includes(currentUser.id);
                const newLikes = isLiked
                    ? p.likes.filter(id => id !== currentUser.id)
                    : [...p.likes, currentUser.id];
                return { ...p, likes: newLikes };
            }
            return p;
        }));
        try {
            await api.likePost(postId);
        } catch (error) {
            console.error("Failed to like post:", error);
             // Revert on failure (optional, could just refetch)
        }
    };

    const handleCommentPost = async (postId: string, text: string) => {
        if (!currentUser) return;
        try {
            const { data: updatedPost } = await api.commentOnPost(postId, { text });
            const userMap = new Map(users.map((user: User) => [user.id, user]));
            const populatedPost = {
                ...updatedPost,
                author: userMap.get(updatedPost.user),
                comments: updatedPost.comments.map((comment: any) => ({
                    ...comment,
                    author: userMap.get(comment.user),
                })),
            };
            setPosts(posts.map(p => p.id === postId ? populatedPost : p));
        } catch (error) {
            console.error("Failed to comment:", error);
        }
    };

    const handleDeletePost = async (postId: string) => {
        const originalPosts = [...posts];
        setPosts(posts.filter(p => p.id !== postId)); // Optimistic
        try {
            await api.deletePost(postId);
        } catch (error) {
            console.error("Failed to delete post:", error);
            setPosts(originalPosts); // Revert
        }
    };

    const handleDeleteComment = async (postId: string, commentId: string) => {
        const originalPosts = JSON.parse(JSON.stringify(posts));
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p)); // Optimistic
        try {
            await api.deleteComment(postId, commentId);
        } catch (error) {
            console.error("Failed to delete comment:", error);
            setPosts(originalPosts); // Revert
        }
    };

    // --- User Handlers ---
    const handleUpdateUser = async (updatedUserData: Partial<User>) => {
        if (!currentUser) return;
        try {
            const { data: updatedUser } = await api.updateProfile(updatedUserData);
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            if (updatedUser.id === currentUser.id) {
                setCurrentUser(updatedUser);
            }
            if (viewedUser && viewedUser.id === updatedUser.id) {
                setViewedUser(updatedUser);
            }
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };
    
    const handleToggleFollow = async (targetUserId: string) => {
        if (!currentUser) return;
        
        // Optimistic update
        const isFollowing = currentUser.following.includes(targetUserId);
        const updatedCurrentUser = {
            ...currentUser,
            following: isFollowing
                ? currentUser.following.filter(id => id !== targetUserId)
                : [...currentUser.following, targetUserId]
        };
        setCurrentUser(updatedCurrentUser);

        setUsers(users.map(u => {
            if (u.id === currentUser.id) return updatedCurrentUser;
            if (u.id === targetUserId) {
                const isFollowedByCurrentUser = u.followers.includes(currentUser.id);
                return {
                    ...u,
                    followers: isFollowedByCurrentUser
                        ? u.followers.filter(id => id !== currentUser.id)
                        : [...u.followers, currentUser.id]
                };
            }
            return u;
        }));
        
        try {
            await api.toggleFollow(targetUserId);
        } catch(error) {
            console.error('Failed to toggle follow', error);
            // Revert state on failure
            fetchData();
        }
    };

    const handleToggleBlock = (targetUserId: string) => {
        // Mocked for now - requires backend implementation
        if (!currentUser) return;
        const isBlocked = currentUser.blockedUsers.includes(targetUserId);
        const updatedCurrentUser = {
            ...currentUser,
            blockedUsers: isBlocked
                ? currentUser.blockedUsers.filter(id => id !== targetUserId)
                : [...currentUser.blockedUsers, targetUserId],
            following: isBlocked ? currentUser.following : currentUser.following.filter(id => id !== targetUserId),
        };
        setCurrentUser(updatedCurrentUser);
        setUsers(users.map(u => (u.id === currentUser.id ? updatedCurrentUser : u)));
    };
    
    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure? This action is irreversible.")) {
            // await api.deleteAccount();
            alert("Account deleted (mock).");
            logout();
        }
    };

    // --- Tribe Handlers ---
    const handleJoinToggle = async (tribeId: string) => {
        if (!currentUser) return;
        try {
            const { data: updatedTribe } = await api.joinTribe(tribeId);
            setTribes(tribes.map(t => t.id === tribeId ? { ...t, members: updatedTribe.members } : t));
        } catch (error) {
            console.error("Failed to join/leave tribe:", error);
        }
    };

    const handleCreateTribe = async (name: string, description: string, avatarUrl?: string) => {
        try {
            const { data: newTribe } = await api.createTribe({ name, description, avatarUrl });
            setTribes(prev => [newTribe, ...prev]);
        } catch (error) {
            console.error("Failed to create tribe:", error);
        }
    };

    const handleViewTribe = async (tribe: Tribe) => {
        try {
            const { data: messages } = await api.fetchTribeMessages(tribe.id);
            const userMap = new Map(users.map((user: User) => [user.id, user]));
            const populatedMessages = messages.map((msg: any) => ({
                ...msg,
                sender: userMap.get(msg.sender)
            })).filter((m: TribeMessage) => m.sender);

            const tribeWithMessages = { ...tribe, messages: populatedMessages };
            setViewedTribe(tribeWithMessages);
            setActiveNavItem('TribeDetail');
        } catch (error) {
            console.error("Failed to fetch tribe messages:", error);
        }
    };

    const handleEditTribe = async (tribeId: string, name: string, description: string, avatarUrl?: string | null) => {
      try {
          const { data: updatedTribeData } = await api.updateTribe(tribeId, { name, description, avatarUrl: avatarUrl as string });
          setTribes(tribes.map(t => (t.id === tribeId ? { ...t, ...updatedTribeData } : t)));
          if (viewedTribe && viewedTribe.id === tribeId) {
              setViewedTribe(prev => prev ? { ...prev, ...updatedTribeData } : null);
          }
          setEditingTribe(null);
      } catch (error) {
          console.error("Failed to edit tribe:", error);
      }
    };
    
    const handleSendTribeMessage = async (tribeId: string, text: string) => {
        if (!currentUser || !viewedTribe) return;
        try {
            const { data: newMessageData } = await api.sendTribeMessage(tribeId, { text });
            const newMessage: TribeMessage = {
                ...newMessageData,
                sender: currentUser,
            };
            const updatedMessages = [...viewedTribe.messages, newMessage];
            const updatedTribe = { ...viewedTribe, messages: updatedMessages };

            setViewedTribe(updatedTribe);
            setTribes(tribes.map(t => t.id === tribeId ? { ...t, messages: updatedMessages } : t));
        } catch (error) {
            console.error("Failed to send tribe message:", error);
        }
    };

    const visiblePosts = useMemo(() => {
        if (!currentUser) return [];
        return posts.filter(p => !currentUser.blockedUsers.includes(p.author.id));
    }, [posts, currentUser]);

    const visibleUsers = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(u => !currentUser.blockedUsers.includes(u.id));
    }, [users, currentUser]);
    
    if (!currentUser) {
        return <LoginPage />;
    }
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeNavItem) {
            case 'Home':
                const feedPosts = visiblePosts.filter(p => currentUser.following.includes(p.author.id) || p.author.id === currentUser.id);
                return (
                    <div className="max-w-2xl mx-auto">
                        <CreatePost currentUser={currentUser} onAddPost={handleAddPost} />
                        <FeedPage
                            posts={feedPosts}
                            currentUser={currentUser}
                            onLikePost={handleLikePost}
                            onCommentPost={handleCommentPost}
                            onDeletePost={handleDeletePost}
                            onDeleteComment={handleDeleteComment}
                            onViewProfile={handleViewProfile}
                        />
                    </div>
                );
            case 'Discover':
                return <DiscoverPage
                    posts={visiblePosts}
                    users={visibleUsers}
                    currentUser={currentUser}
                    onLikePost={handleLikePost}
                    onCommentPost={handleCommentPost}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    onToggleFollow={handleToggleFollow}
                    onViewProfile={handleViewProfile}
                />;
            case 'Messages':
                return <ChatPage 
                    currentUser={currentUser}
                    allUsers={visibleUsers}
                />;
            case 'Tribes':
                return <TribesPage 
                    tribes={tribes}
                    currentUser={currentUser}
                    onJoinToggle={handleJoinToggle}
                    onCreateTribe={handleCreateTribe}
                    onViewTribe={handleViewTribe}
                    onEditTribe={(tribe) => setEditingTribe(tribe)}
                />;
            case 'TribeDetail':
                if (!viewedTribe) return <div>Tribe not found.</div>;
                return <TribeDetailPage
                    tribe={viewedTribe}
                    currentUser={currentUser}
                    onSendMessage={handleSendTribeMessage}
                    onBack={() => setActiveNavItem('Tribes')}
                    onViewProfile={handleViewProfile}
                    onEditTribe={(tribe) => setEditingTribe(tribe)}
                />;
            case 'Profile':
                if (!viewedUser || (currentUser.blockedUsers.includes(viewedUser.id))) {
                     return <div className="text-center p-8">User not found or is blocked.</div>;
                }
                const userPosts = visiblePosts.filter(p => p.author.id === viewedUser.id);
                return <ProfilePage
                    user={viewedUser}
                    allUsers={visibleUsers}
                    posts={userPosts}
                    currentUser={currentUser}
                    onLikePost={handleLikePost}
                    onCommentPost={handleCommentPost}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    onViewProfile={handleViewProfile}
                    onUpdateUser={handleUpdateUser}
                    onAddPost={handleAddPost}
                    onToggleFollow={handleToggleFollow}
                    onToggleBlock={handleToggleBlock}
                    onStartConversation={() => setActiveNavItem('Messages')}
                    onLogout={logout}
                    onDeleteAccount={handleDeleteAccount}
                />;
            case 'Ember':
                return <EmberChatPage currentUser={currentUser} />;
            case 'DevNotes':
                return <DevNotesPage />;
            default:
                return <div>Page not found</div>;
        }
    };

    return (
        <div className="bg-background min-h-screen text-primary">
            <Sidebar 
                activeItem={activeNavItem} 
                onSelectItem={handleSelectItem} 
                currentUser={currentUser}
            />
            <main className="pt-20 pb-20 md:pb-4 px-4 md:px-6 max-w-7xl mx-auto">
                {renderContent()}
            </main>
            {editingTribe && (
              <EditTribeModal
                tribe={editingTribe}
                onClose={() => setEditingTribe(null)}
                onSave={handleEditTribe}
              />
            )}
        </div>
    );
};

export default App;
