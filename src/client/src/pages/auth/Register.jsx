import { useState, useEffect } from 'react';
import { register } from '../../helpers/auth/auth.helper.js';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSupplier } from '../../context/supplierContext.jsx';
import { useAuth } from '../../context/authContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { loading, setLoading, darkMode } = useSupplier();
  const { auth } = useAuth();

  const [userCreds, setUser] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    if (auth?.user) {
      navigate('/home');
    }
  }, [auth, navigate]);

  const handleChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userCreds.username.length < 3) {
      toast.warning('Username must be at least 3 characters long');
      return;
    } else if (userCreds.password.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    } else if (userCreds.username.length > 10) {
      toast.warning('Username must be less than 10 characters long');
      return;
    }

    setLoading(true);
    const result = await register(userCreds).finally(() => setLoading(false));
    if (result.status === 201) {
      toast.success(result.message);
      navigate('/');
    } else if (result.status === 400) {
      toast.warning(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className={`my-5 flex min-h-[80vh] items-center justify-center px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className={`w-full max-w-xl rounded p-8 shadow md:p-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h1 className={`mb-8 text-center text-4xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Register</h1>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-3">
            <label htmlFor="username" className="mb-1 block">Username</label>
            <input
              type="text"
              className={`w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              id="username"
              value={userCreds.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="mb-1 block">Email</label>
            <input
              type="email"
              className={`w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              id="email"
              value={userCreds.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="mb-1 block">Password</label>
            <input
              type="password"
              className={`w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              id="password"
              value={userCreds.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="my-3 grid gap-2">
            <button type="submit" disabled={loading} className={`rounded px-4 py-2 font-medium ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <hr className={`my-6 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
        <p className="text-center">
          Already have an account?{' '}
          <Link to="/" className={darkMode ? 'text-gray-200 underline' : 'text-blue-600 underline'}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
