import { createContext, useContext, useEffect, useState } from "react";
import { getLocalStorageWithExpiry } from "../helpers/auth/auth.helper.js";
import { API } from "../helpers/config.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const storedAuth = getLocalStorageWithExpiry("auth");
  const [auth, setAuth] = useState({
    user: storedAuth?.user || null,
    token: storedAuth?.token || ""
  });
  const [authReady, setAuthReady] = useState(false);


  useEffect(() => {
    const data = getLocalStorageWithExpiry("auth");
    const token = data?.token;
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }

        });

        const result = await res.json().catch(() => ({}));
        if (res.status === 200) {
          setAuth({
            user: result.user,
            token: token
          });
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('auth');
          setAuth({ user: null, token: "" });
        } else {
          console.error(`Auth restore failed with status ${res.status}`);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setAuthReady(true);
      }
    }
    if (token) {
      fetchUser();
    } else {
      localStorage.removeItem('auth');
      setAuthReady(true);
    }
  }, []);



  return (
    <AuthContext.Provider value={{ auth, setAuth, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };