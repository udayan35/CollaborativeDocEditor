import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { getLocalStorageWithExpiry } from '../auth/auth.helper.js';

const PrivateRoutes = () => {
    const token = getLocalStorageWithExpiry('auth')?.token;
    const { auth, authReady } = useAuth();

    if (!authReady) {
        return null;
    }

    return token && auth?.user ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoutes;