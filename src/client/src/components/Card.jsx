import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { useSupplier } from '../context/supplierContext';

const Card = ({ cardData, deleteEvent }) => {
    const navigate = useNavigate();
    const { setCurrentDoc, darkMode } = useSupplier();

    // Conditional styles based on darkMode
    const cardBgClass = darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900';
    const cardTitleClass = darkMode ? 'text-cyan-300' : 'text-blue-600';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const content = cardData?.content;
    const previewText = typeof content === 'string'
        ? content
        : typeof content?.ops?.[0]?.insert === 'string'
            ? content.ops[0].insert
            : '';

    return (
        <>
            {cardData?.title && (
                <div className="w-full">
                    <div className={`h-full rounded-lg shadow-sm ${cardBgClass}`}>
                        <div className="flex h-full flex-col p-4">
                            {/* Card Title and Metadata */}
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h5 className={`mb-0 font-semibold ${cardTitleClass}`}>{cardData?.title}</h5>
                                <small className={textMutedClass}>
                                    {new Date(cardData?.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                            <p className={`${textMutedClass} mb-2`}>Owner: {cardData?.owner?.username}</p>
                            {/* Preview Text */}
                            <p className="mb-4">
                                {previewText.slice(0, 50)}
                                {previewText.length > 50 ? '...' : ''}
                            </p>
                            {/* Action Buttons */}
                            <div className="mt-auto flex justify-between gap-3">
                                <button
                                    className="rounded border border-red-600 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                    onClick={() => document.dispatchEvent(new CustomEvent('open-modal', { detail: `deleteDoc${cardData?._id}` }))}
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => {
                                        navigate(`/edit/${cardData._id}`);
                                        setCurrentDoc(cardData);
                                    }}
                                    className="rounded border border-green-600 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Document"
                modalId={`deleteDoc${cardData?._id}`}
                content={
                    <>
                        <p className="text-lg text-red-600">
                            Are you sure you want to delete the document <strong>{cardData?.title}</strong>?
                        </p>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                className="mr-2 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                                onClick={() => document.dispatchEvent(new CustomEvent('close-modal', { detail: `deleteDoc${cardData?._id}` }))}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteEvent(cardData._id)}
                                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </>
                }
            />
        </>
    );
};

Card.propTypes = {
    cardData: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string,
        createdAt: PropTypes.string,
        owner: PropTypes.shape({
            username: PropTypes.string,
        }),
        content: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                ops: PropTypes.arrayOf(PropTypes.shape({
                    insert: PropTypes.oneOfType([
                        PropTypes.string,
                        PropTypes.object,
                    ]),
                })),
            }),
        ]),
    }).isRequired,
    deleteEvent: PropTypes.func.isRequired,
};

export default Card;
