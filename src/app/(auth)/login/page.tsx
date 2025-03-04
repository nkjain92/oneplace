'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      // Redirect to home page after successful login
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent'>
        Welcome Back
      </h1>

      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label htmlFor='email' className='block text-gray-700 font-medium mb-1'>
            Email
          </label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            required
            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='you@example.com'
          />
        </div>

        <div>
          <label htmlFor='password' className='block text-gray-700 font-medium mb-1'>
            Password
          </label>
          <input
            type='password'
            id='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            required
            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='••••••••'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className='mt-6 text-center text-gray-600'>
        Don&apos;t have an account?{' '}
        <Link href='/signup' className='text-blue-600 hover:underline'>
          Sign up
        </Link>
      </p>
    </div>
  );
}
