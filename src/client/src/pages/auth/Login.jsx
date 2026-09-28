import  { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';
import { login } from '../../helpers/auth/auth.helper.js';
import { useSupplier } from '../../context/supplierContext';

const Login = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { loading, setLoading, darkMode } = useSupplier();

  useEffect(() => {
    if (auth?.user) {
      navigate('/home');
    }
  }, [auth]);

  const [userCreds, setUser] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(userCreds).finally(() => setLoading(false));
    const { message, user, token, status } = result;

    if (status === 200) {
      setAuth({
        ...auth,
        user,
        token,
      });
      toast(message, { type: 'success' });
      navigate('/home');
      return;
    }

    toast(message, { type: 'error' });
  };

  return (
    <div className={`my-5 flex min-h-[80vh] items-center justify-center px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className={`w-full max-w-xl rounded p-8 shadow md:p-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h1 className={`mb-8 text-center text-4xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Login</h1>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
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
          <div className="mb-4">
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
          <div className="grid gap-2">
            <button disabled={loading} type="submit" className={`rounded px-4 py-2 font-medium ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
        <hr className={`my-6 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
        <p className="mb-0 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/register" className={darkMode ? 'text-gray-200 underline' : 'text-blue-600 underline'}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
