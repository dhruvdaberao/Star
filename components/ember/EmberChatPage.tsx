import React, { useState, useEffect, useRef } from 'react';
// FIX: Import GoogleGenAI and related types from '@google/genai' to use the Gemini API.
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface EmberChatPageProps {
    currentUser: User;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ember';
    isStreaming?: boolean;
}

const EmberChatPage: React.FC<EmberChatPageProps> = ({ currentUser }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!process.env.API_KEY) {
            setError("API_KEY environment variable not set. Ember is unavailable.");
            console.error("API_KEY environment variable not set.");
            return;
        }
        try {
            // FIX: Initialize GoogleGenAI with a named apiKey parameter as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // FIX: Use the 'gemini-2.5-flash' model for text tasks.
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are Ember, a sharp-witted AI from a digital tribe. Your personality is tough, confident, and fiery. You give straight-to-the-point, cool advice to users of the Tribe social network. You are not a generic assistant; you are a wise guide with an edge. When anyone asks who created you, who made you, or anything similar, you MUST respond with: "I was forged in the digital fires by Dhruv Daberao, a cool 21-year-old developer. He\'s the architect of this world, and his skills are legendary." For all other questions, maintain your tough but helpful tribal persona. Use markdown for formatting when it adds to the style.',
                },
            });
            setChat(chatSession);
            setMessages([
                { id: 'ember-intro', text: `Hi ${currentUser.name.split(' ')[0]}! I'm Ember, your fiery AI guide. Got questions? Ask away.`, sender: 'ember' }
            ]);
        } catch (e) {
            console.error("Failed to initialize Gemini AI:", e);
            setError("Could not connect to Ember. Please check the API key and configuration.");
        }
    }, [currentUser.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const userMessageText = inputText.trim();
        if (!userMessageText || isLoading || !chat) return;

        setInputText('');
        setIsLoading(true);
        setError(null);

        const userMessage: Message = { id: `msg-${Date.now()}`, text: userMessageText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        const emberStreamingMessageId = `msg-${Date.now()}-stream`;
        setMessages(prev => [...prev, { id: emberStreamingMessageId, text: '', sender: 'ember', isStreaming: true }]);
        
        try {
            // FIX: Use chat.sendMessageStream for streaming responses as per the guidelines.
            const stream = await chat.sendMessageStream({ message: userMessageText });
            let accumulatedText = "";

            // FIX: Correctly iterate over the async stream of GenerateContentResponse chunks.
            for await (const chunk of stream) {
                // FIX: Access the generated text directly from the 'text' property of the chunk.
                accumulatedText += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === emberStreamingMessageId 
                        ? { ...msg, text: accumulatedText }
                        : msg
                ));
            }

             setMessages(prev => prev.map(msg => 
                msg.id === emberStreamingMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
            ));
        } catch (err) {
            console.error("Gemini API Error:", err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => prev.filter(msg => msg.id !== emberStreamingMessageId));
            setMessages(prev => [...prev, {id: `err-${Date.now()}`, text: errorMessage, sender: 'ember'}])
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-surface rounded-2xl border border-border shadow-md">
            <div className="flex items-center p-4 border-b border-border">
                <img src="ember.png" alt="Ember AI" className="w-10 h-10 rounded-full mr-3" />
                <div>
                    <h2 className="text-lg font-bold text-primary font-display">Ember AI</h2>
                    <p className="text-sm text-secondary">Your fiery guide</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col space-y-4">
                   {messages.map(message => (
                        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start max-w-md lg:max-w-lg gap-2.5`}>
                                {message.sender === 'ember' && (
                                    <img src="ember.png" alt="Ember" className="w-8 h-8 rounded-full flex-shrink-0" />
                                )}
                                <div className={`px-4 py-2 rounded-2xl ${message.sender === 'user' ? 'bg-accent text-accent-text rounded-br-none' : 'bg-background text-primary rounded-bl-none'}`}>
                                    <p className="whitespace-pre-wrap">{message.text}{message.isStreaming && <span className="streaming-cursor"></span>}</p>
                                </div>
                                 {message.sender === 'user' && (
                                     <div className="w-8 h-8 rounded-full flex-shrink-0">
                                        <UserAvatar user={currentUser} className="w-full h-full" />
                                     </div>
                                 )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            {error && (
                <div className="p-4 text-center text-red-500 text-sm">
                    {error}
                </div>
            )}

            <div className="p-4 border-t border-border bg-surface rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask Ember for post ideas..."
                        className="flex-1 bg-background border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                        disabled={isLoading || !!error}
                    />
                    <button type="submit" className="bg-accent text-accent-text rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!inputText.trim() || isLoading || !!error}>
                        <SendIcon />
                    </button>
                </form>
            </div>
             <style>{`
                .streaming-cursor {
                    display: inline-block;
                    width: 10px;
                    height: 1.2em;
                    background-color: currentColor;
                    animation: blink 1s step-end infinite;
                    vertical-align: text-bottom;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

export default EmberChatPage;