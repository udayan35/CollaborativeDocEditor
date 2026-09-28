import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSupplier } from '../context/supplierContext';

const Modal = ({ modalId, title, content, isInfo = false }) => {
    const { darkMode } = useSupplier();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = (event) => {
            if (event.detail === modalId) setIsOpen(true);
        };
        document.addEventListener('open-modal', handleOpen);
        return () => document.removeEventListener('open-modal', handleOpen);
    }, [modalId]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, []);

    useEffect(() => {
        const closeModal = (event) => {
            if (event.detail === modalId) setIsOpen(false);
        };
        document.addEventListener('close-modal', closeModal);
        return () => document.removeEventListener('close-modal', closeModal);
    }, [modalId]);

    const closeModal = () => setIsOpen(false);

    return (
        <div
            id={modalId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${modalId}-title`}
            className={`fixed inset-0 z-50 items-center justify-center bg-black/50 p-4 ${isOpen ? 'flex' : 'hidden'}`}
            onMouseDown={(event) => event.target === event.currentTarget && closeModal()}
        >
            <div className={`w-full max-w-lg rounded-lg shadow-xl ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                <div className={`flex items-center justify-between border-b p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h1 className="text-lg font-semibold" id={`${modalId}-title`}>{title}</h1>
                    <button type="button" onClick={closeModal} className="rounded p-1 text-2xl leading-none opacity-60 hover:opacity-100" aria-label="Close">&times;</button>
                </div>
                <div className="p-4">
                    {content}
                </div>
                <div className={`flex justify-end border-t p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {isInfo && <button type="button" onClick={closeModal} className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">Close</button>}
                    <button type="button" onClick={closeModal} className="hidden" id="closeTheModal">Close</button>
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    modalId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.node.isRequired,
    isInfo: PropTypes.bool,
};

export default Modal;
