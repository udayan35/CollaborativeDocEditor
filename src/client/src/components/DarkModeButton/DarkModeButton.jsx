import { useEffect } from 'react';
import styles from './DarkModeButton.module.css';
import { useSupplier } from '../../context/supplierContext';

const DarkModeButton = () => {
  // Load the saved theme from localStorage or default to 'light'
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Destructure darkMode and setDarkMode from useSupplier hook
  const { darkMode, setDarkMode } = useSupplier(savedTheme === 'dark');

  useEffect(() => {
    const htmlElement = document.documentElement;

    htmlElement.classList.toggle('dark', darkMode);

    if (darkMode) {
      document.body.classList.add('bg-gray-900', 'text-white');
      document.body.classList.remove('bg-white', 'text-gray-900');
    } else {
      document.body.classList.add('bg-white', 'text-gray-900');
      document.body.classList.remove('bg-gray-900', 'text-white');
    }

    // Save the current theme preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Toggle the darkMode state
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <div className={styles.switchContainer}>
      <h1 style={{ fontWeight: '400', fontSize: '1rem', paddingTop: '0.5rem', paddingRight: '0.5rem' }}>
        {darkMode ? 'Dark Mode' : 'Light Mode'}
      </h1>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleDarkMode}
          className={styles.checkbox}
        />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

export default DarkModeButton;
