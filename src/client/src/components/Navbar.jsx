import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import DarkModeButton from './DarkModeButton/DarkModeButton.jsx';
import { useSupplier } from '../context/supplierContext.jsx';

const Navbar = () => {
  const { auth, setAuth } = useAuth();
  const {darkMode} = useSupplier();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth({
      user: null,
      token: null,
    });
    navigate('/');
  };

  return (
    <nav className={`border-b px-4 py-3 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavLink className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`} to="/">
          RealTimeEdify
        </NavLink>
        <div id="navbarNav">
          <ul className="flex items-center gap-4">
            {auth.user ? (
              <>
              <li>
                  <DarkModeButton />
                </li>
              <li>
                <button className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={handleLogout}>
                  Logout
                </button>
              </li>
              </>
            ) : (
              <>
                <li>
                  <DarkModeButton />
                </li>
                <li>
                  <NavLink
                    className={`hover:underline ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                    to="/"
                  >
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    className={`hover:underline ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                    to="/register"
                  >
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
