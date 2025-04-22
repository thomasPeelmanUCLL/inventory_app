// components/RegisterForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import UserService from '@services/UserService';

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({onRegisterSuccess}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: parseInt(formData.age),
        role: formData.role
      };

      console.log('Submitting user data:', userData); // Debug log

      const response = await UserService.createUser(userData);
      
      console.log('Registration response:', response); // Debug log
      
      setSuccess('Registration successful! Redirecting to login...');
      setFormData({
        email: '',
        password: '',
        name: '',
        age: '',
        role: 'user'
      });
      
      setTimeout(() => {
        router.push('/Login');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error); // Debug log
      setError(error.message || 'Failed to create user. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      
      <div>
        <label className="block text-white font-medium mb-1">Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-1">Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-1">Age:</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-1">Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;
