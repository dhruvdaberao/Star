import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

// Define the context type locally for this component
interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
}

const LoginPage: React.FC = () => {
  const auth = useContext(AuthContext) as AuthContextType;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        if (!email || !password) return setError('Please enter email and password.');
        await auth.login(email, password);
      } else {
        if (!name || !username || !email || !password) return setError('Please fill all fields.');
        await auth.register(name, username, email, password);
      }
    } catch (err: any) {
       setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center space-x-3">
                <img src="tribe.png" alt="Tribe Logo" className="w-12 h-12" />
                <h1 className="text-4xl font-bold font-display text-primary">Tribe</h1>
            </div>
            <p className="text-secondary mt-2">Connect with your community.</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold text-center text-primary mb-8">{isLogin ? 'Log In' : 'Sign Up'}</h2>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
                <>
                    <div className="mb-4">
                        <label className="block text-secondary text-sm font-semibold mb-2" htmlFor="name">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                            placeholder="Alex Jordan"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-secondary text-sm font-semibold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                            placeholder="alexj"
                        />
                    </div>
                </>
            )}
            <div className="mb-4">
              <label className="block text-secondary text-sm font-semibold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-6">
              <label className="block text-secondary text-sm font-semibold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent text-accent-text font-semibold p-3 rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent transition-colors"
            >
              {isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-secondary text-sm mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => {setIsLogin(!isLogin); setError('')}} className="font-semibold text-accent hover:underline ml-2">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;