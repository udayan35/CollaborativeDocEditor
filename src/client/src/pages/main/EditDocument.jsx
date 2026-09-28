import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupplier } from '../../context/supplierContext';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import { addCollaboratorToDoc, getAllCollaborators } from '../../helpers/docs/doc.helper';
import { useAuth } from '../../context/authContext';
import { API } from '../../helpers/config';
import Editor from './Editor.jsx';
import * as Y from 'yjs';
import { SocketIOProvider } from '../../helpers/YjsProvider';
import { QuillYjsBinding } from '../../helpers/QuillYjsBinding';

const EditDocument = () => {
    const [currentUsers, setCurrentUsers] = useState([]);
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [collaborators, setCollaborators] = useState([]);
    const [isModified, setIsModified] = useState(false);

    const navigate = useNavigate();
    const { auth } = useAuth();
    const { currentDoc, socket, setCurrentDoc, darkMode, triggerUpdate, quill, setLoading } = useSupplier();
    const { id } = useParams();
    
    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const bindingRef = useRef(null);

    const handleAddCollaborator = async () => {
        setLoading(true);
        const res = await addCollaboratorToDoc(currentDoc?._id, collaboratorEmail, auth?.token).finally(() => setLoading(false));
        if (res?.status === 200) {
            setCollaboratorEmail('');
            document.getElementById('closeTheModal').click();
            toast.success(res?.data?.message);
            triggerUpdate();
            return;
        }
        toast.error(res?.data?.message);
    };

    // Initialize Yjs and sync on document load
    useEffect(() => {
        if (quill == null || !currentDoc?._id) return;
        try {
            // Create Y.Doc for this document
            if (!ydocRef.current) {
                ydocRef.current = new Y.Doc();
                
                // Create Socket.IO provider
                providerRef.current = new SocketIOProvider(socket, currentDoc._id, ydocRef.current);
                
                // Get or create Y.Text for collaborative text
                const ytext = ydocRef.current.getText('shared-text');
                
                // Set up Quill-Yjs binding
                bindingRef.current = new QuillYjsBinding(quill, ytext);
                
                // Listen for sync completion
                ydocRef.current.on('synced', (isSynced) => {
                    if (isSynced) {
                        quill.enable();
                        console.log('Document synchronized with Yjs');
                        toast.success('Document synchronized');//20704 //17605
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing Yjs:', error);
            toast.error('Failed to initialize collaborative editing');
        }

        return () => {
            // Cleanup will be done in leaveRoom effect
        };
    }, [quill, socket, currentDoc]);

    // Register document modifications and mark as modified (with Yjs)
    useEffect(() => {
        if (ydocRef.current == null || !currentDoc?._id) return;

        const ytext = ydocRef.current.getText('shared-text');

        const handleYjsUpdate = () => {
            setIsModified(true);
        };

        ytext.observe(handleYjsUpdate);

        return () => {
            ytext.unobserve(handleYjsUpdate);
        };
    }, [currentDoc]);

    // Check and save only if there are modifications (with Yjs state)
    useEffect(() => {
        if (ydocRef.current == null) return;

        const interval = setInterval(() => {
            if (isModified) {
                try {
                    const ytext = ydocRef.current.getText('shared-text');
                    const content = ytext.toString();
                    
                    toast.info('Saving document...');
                    socket.emit("save-doc", { docId: currentDoc?._id, data: content }, (error) => {
                        if (error) {
                            console.error(error);
                            toast.error('Failed to save document');
                        } else {
                            toast.success('Document saved successfully');
                            setIsModified(false);
                        }
                    });
                } catch (error) {
                    console.error('Error saving document:', error);
                    toast.error('Error saving document');
                }
            }
        }, 30000);  // Interval to check for modifications

        return () => {
            clearInterval(interval);
        };
    }, [isModified, currentDoc, socket]);

    // Function to save immediately when necessary (with Yjs)
    const saveDocumentImmediately = () => {
        if (isModified && ydocRef.current) {
            try {
                const ytext = ydocRef.current.getText('shared-text');
                const content = ytext.toString();
                
                socket.emit("save-doc", { docId: currentDoc?._id, data: content }, (error) => {
                    if (error) {
                        console.error(error);
                        toast.error('Failed to save document');
                    } else {
                        toast.success('Document saved successfully');
                        setIsModified(false);
                    }
                });
            } catch (error) {
                console.error('Error saving document:', error);
            }
        }
    };

    // Other collaborator and room functionalities
    useEffect(() => {
        const fetchCollaborators = async () => {
            setLoading(true);
            const res = await getAllCollaborators(currentDoc?._id, auth?.token).finally(() => setLoading(false));
            if (res?.status === 200) {
                setCollaborators(res?.data?.collaborators);
            }
        };

        const resetCurrentDocStateOnReload = async () => {
            const fetchDoc = await fetch(`${API}/documents/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth?.token}`
                }
            });
            const doc = await fetchDoc.json();
            console.log('Document content:', doc?.document?.content);
            setCurrentDoc(doc?.document);
            
        };

        if (!currentDoc && auth?.token) {
            resetCurrentDocStateOnReload();
        }
        if (auth?.token && currentDoc?._id) {
            fetchCollaborators();
        }
    }, [auth, currentDoc, id, setCurrentDoc, setLoading]);

    // Handle collaborative updates through Yjs binding (no manual send-changes needed)
    // The QuillYjsBinding automatically syncs Quill changes through the SocketIOProvider


    // Join/leave room for collaboration and Yjs sync
    useEffect(() => {
        if (quill == null || !currentDoc?._id) return;

        const handleSomeoneJoined = (data) => {
            setCurrentUsers(data?.roomUsers);
        };

        const handleSomeoneLeft = (data) => {
            setCurrentUsers(data?.roomUsers);
        };

        const handleInitialLoad = ({ content }) => {
            const ytext = ydocRef.current?.getText('shared-text');
            if (content && ytext?.length === 0) {
                bindingRef.current?.setContents(content);
            }
            quill.enable();
        };

        socket.once('load-document', handleInitialLoad);

        socket.emit('joinRoom', { roomId: currentDoc?._id, username: auth?.user?.username }, (error) => {
            if (error) {
                console.error('Error joining room:', error);
                socket.off('load-document', handleInitialLoad);
                return;
            }
            providerRef.current?.requestSync();
            socket.emit('get-doc', { docId: currentDoc._id });
        });

        socket.on('someoneJoined', handleSomeoneJoined);
        socket.on('someoneLeft', handleSomeoneLeft);

        return () => {
            if (quill) {
                quill.disable();
            }

            socket.emit('leaveRoom', { roomId: currentDoc?._id, username: auth?.user?.username }, (error) => {
                if (error) {
                    console.error('Error leaving room:', error);
                }
            });

            socket.off('someoneJoined', handleSomeoneJoined);
            socket.off('someoneLeft', handleSomeoneLeft);
            socket.off('load-document', handleInitialLoad);
            setCurrentUsers([]);

            // Cleanup Yjs provider and binding
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
            if (providerRef.current) {
                providerRef.current.destroy();
                providerRef.current = null;
            }
            if (ydocRef.current) {
                ydocRef.current.destroy();
                ydocRef.current = null;
            }
        };
    }, [currentDoc, socket, auth?.user?.username, quill]);

    // Handle remote cursor positions
    useEffect(() => {
        if (quill == null || !currentDoc?._id) return;

        const handleRemoteCursor = (data) => {
            if (data?.username === auth?.user?.username) return;

            const cursor = quill.getModule('cursors');
            if (cursor) {
                cursor.createCursor(data?.username, data?.username, '#' + Math.floor(Math.random()*16777215).toString(16));
                cursor.moveCursor(data?.username, data?.range);
            }
        };

        socket.on('receive-cursor', handleRemoteCursor);

        return () => {
            socket.off('receive-cursor', handleRemoteCursor);
        };
    }, [quill, currentDoc, socket, auth?.user?.username]);

    // Send local cursor position
    useEffect(() => {
        if (quill == null || !currentDoc?._id) return;

        const handleSelectionChange = (range) => {
            if (range) {
                socket.emit('send-cursor', {
                    roomId: currentDoc?._id,
                    username: auth?.user?.username,
                    range: range
                });
            }
        };

        quill.on('selection-change', handleSelectionChange);

        return () => {
            quill.off('selection-change', handleSelectionChange);
        };
    }, [quill, currentDoc, socket, auth?.user?.username]);



    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            <div className="flex min-h-screen flex-wrap">
                {/* Sidebar - collapses on smaller screens */}
                <div className={`w-full p-3 md:w-1/3 lg:w-1/4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`} style={{ minWidth: '280px' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold">Collaborators</h4>
                        <button
                            type="button"
                            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                            onClick={() => document.dispatchEvent(new CustomEvent('open-modal', { detail: 'addCollaborator' }))}
                        >
                            Add
                        </button>
                    </div>
                    
                    {/* Online Collaborators List */}
                    <ul className="mb-4 overflow-hidden rounded border border-gray-300">
                        <li className={`border-b p-3 ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-900'}`}>
                            Online Collaborators ({currentUsers?.length})
                        </li>
                        {currentUsers?.map((user, index) => (
                            <li key={index} className={`border-b p-3 last:border-b-0 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                {user?.username} {user?.username === auth?.user?.username && '(You)'}
                            </li>
                        ))}
                    </ul>

                    {/* Available Collaborators List */}
                    <ul className="overflow-hidden rounded border border-gray-300">
                        <li className={`border-b p-3 ${darkMode ? 'bg-blue-800 text-gray-100' : 'bg-blue-200 text-gray-900'}`}>
                            All Collaborators ({collaborators?.length})
                        </li>
                        {collaborators?.map((user, index) => (
                            <li key={index} className={`border-b p-3 last:border-b-0 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                {user?.username}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Editor Container - expands on smaller screens */}
                <div className="w-full p-4 md:w-2/3 lg:w-3/4">
                    <div className="mb-4 flex flex-col items-start justify-between md:flex-row md:items-center">
                        {/* Back Button */}
                        <button
                            type="button"
                            className={`mb-2 rounded bg-yellow-500 px-4 py-2 font-medium md:mb-0 ${darkMode ? 'text-white' : 'text-gray-900'} hover:bg-yellow-600`}
                            onClick={() => {
                                saveDocumentImmediately();
                                navigate('/home');
                            }}
                        >
                            <span aria-hidden="true">&larr;</span> Back
                        </button>
                        
                        {/* Document Title */}
                        <h1 className={`mb-2 text-center text-2xl font-semibold md:mb-0 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            Document Title: <u>{currentDoc?.title}</u>
                        </h1>

                        {/* View Collaborators Button */}
                        <button
                            type="button"
                            className="rounded bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
                            onClick={() => document.dispatchEvent(new CustomEvent('open-modal', { detail: 'collaborators' }))}
                        >
                            View Collaborators
                        </button>
                    </div>

                    {/* Quill Editor */}
                    <div className="editor-container rounded border p-3" style={{ minHeight: '60vh' }}>
                        <Editor />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                title="Add Collaborator"
                modalId="addCollaborator"
                content={
                    <>
                        <p className={`${darkMode ? 'text-gray-100' : 'text-gray-900'} text-lg`}>
                            Enter the email of the user you want to add as a collaborator
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="email"
                                value={collaboratorEmail}
                                onChange={(e) => setCollaboratorEmail(e.target.value)}
                                className={`min-w-0 flex-1 rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                placeholder="Email"
                            />
                            <button className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700" onClick={() => document.dispatchEvent(new CustomEvent('close-modal', { detail: 'addCollaborator' }))}>Close</button>
                            <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={handleAddCollaborator}>Add</button>
                        </div>
                    </>
                }
            />

            <Modal
                title="Collaborators"
                modalId="collaborators"
                content={
                    <ul className={`overflow-hidden rounded border border-gray-300 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                        {collaborators?.map((user, index) => (
                            <li key={index} className="border-b p-3 last:border-b-0">
                                {user?.username}
                            </li>
                        ))}
                    </ul>
                }
            />
        </div>
    );

};

export default EditDocument;
