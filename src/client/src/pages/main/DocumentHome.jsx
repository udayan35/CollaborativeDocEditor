import { useEffect, useState } from 'react'
import { useAuth } from '../../context/authContext'
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { createNewDoc, deleteTheDoc, getAllLoggedInUserDocs } from '../../helpers/docs/doc.helper';
import { toast } from 'react-toastify';
import { useSupplier } from '../../context/supplierContext';
import { useNavigate } from 'react-router-dom';

const DocumentHome = () => {

    const { auth } = useAuth();
    const [data, setData] = useState([{}]);
    const [title, setTitle] = useState('');
    const { loading, setLoading, shouldUpdate, triggerUpdate } = useSupplier();
    const navigator = useNavigate();

    useEffect(() => {
        if (!auth) {
            toast.error('Please Login to continue');
            navigator('/');
        }
    }, [auth]);

    useEffect(() => {


        const setDocuments = async () => {

            const documents = await getAllLoggedInUserDocs(auth?.token);


            if (documents?.status === 200) {
                setData(documents?.data?.documents);
                return;
            }

            toast.error(documents?.message);



        }

        auth?.token ? setDocuments() : null;

        auth?.token ? document.title = `Welcome ${auth?.user?.username} 👋` : null


    }, [auth?.token, shouldUpdate]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await createNewDoc(title, auth?.token).finally(() => { setLoading(false); });

        if (result?.status === 201) {

            setTitle('');
            toast.success('Document Created Successfully');
            document.getElementById("closeTheModal").click();
            triggerUpdate();
            return;
        }

        toast.error(result?.message);


    }

    const handleDelete = async (id) => {
        setLoading(true);
        const res = await deleteTheDoc(id, auth?.token).finally(() => { setLoading(false); });
        if (res?.status === 200) {
            toast.success(res.message);
            triggerUpdate();
            return;
        }

        toast.error(res?.message);
    }

    return (
        <>
            <div className="mx-auto my-4 max-w-7xl px-4">
                <div className="flex flex-wrap items-center justify-between px-3">
                    {/* Greeting Section */}
                    <div className="w-full md:w-2/3">
                        <h1 className="text-4xl font-semibold text-blue-600">
                            Hello {auth?.user?.username} 👋
                        </h1>
                        <p className="text-lg text-gray-600">
                            Welcome to your document home page
                        </p>
                    </div>
                    {/* Create New Button */}
                    <div className="mt-3 flex w-full justify-start md:mt-0 md:w-1/3 md:justify-end">
                        <button
                            type="button"
                            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            onClick={() => document.dispatchEvent(new CustomEvent('open-modal', { detail: 'createDoc' }))}
                        >
                            Create New
                        </button>
                    </div>
                </div>

                {/* Cards Section */}
                <div className="my-4 grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {!loading ? (
                        data?.map((cardData, index) => (
                            <div key={index} className="my-3 flex justify-center">
                                <Card cardData={cardData} deleteEvent={handleDelete} />
                            </div>
                        ))
                    ) : (
                        <Loader />
                    )}
                </div>

                {/* Create New Document Modal */}
                <Modal
                    title="Create New Document"
                    modalId="createDoc"
                    content={
                        <form className="p-1" onSubmit={handleAdd}>
                            <div className="mb-3">
                                <label htmlFor="title" className="mb-1 block">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    id="title"
                                    placeholder="Document Title"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    }
                />
            </div>
        </>
    )
}

export default DocumentHome