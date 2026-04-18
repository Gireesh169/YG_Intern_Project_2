import React, { useState, useEffect, useRef } from "react";
import { FaFileAlt, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaEllipsisH } from "react-icons/fa";

const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
        case "pdf":
            return <FaFilePdf className="text-red-500 w-5 h-5" />;
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
            return <FaFileImage className="text-yellow-500 w-5 h-5" />;
        case "doc":
        case "docx":
            return <FaFileWord className="text-blue-600 w-5 h-5" />;
        case "xls":
        case "xlsx":
            return <FaFileExcel className="text-green-600 w-5 h-5" />;
        default:
            return <FaFileAlt className="text-gray-500 w-5 h-5" />;
    }
};

const FilesPanel = ({ messages, user }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const handleDownload = async (fileUrl, fileName) => {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-white shadow rounded-lg p-4 w-full overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Shared Files</h3>
            {messages.filter((msg) => msg.file_url).length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-4">
                    No files shared yet
                </p>
            ) : (
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Modified</th>
                            <th className="px-4 py-2">Modified By</th>
                            <th className="px-4 py-2">Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.filter((msg) => msg.file_url).map((message) => {
                            const modifiedBy = message.sender_id !== user?.id ? "You" : user?.full_name || user?.email;
                            const modifiedDate = new Date(message.modified_at || message.created_at).toLocaleDateString();

                            return (
                                <tr key={message.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        {getFileIcon(message.file_name)}
                                        <span className="truncate max-w-[180px]">{message.file_name}</span>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">{modifiedDate}</td>

                                    <td className="px-4 py-3 text-sm text-gray-600">{modifiedBy}</td>

                                    <td className="px-4 py-3 relative" ref={menuRef}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === message.id ? null : message.id)}
                                            className="p-1 rounded-full hover:bg-gray-100 transition"
                                        >
                                            <FaEllipsisH className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {openMenuId === message.id && (
                                            <div className="absolute right-0 top-8 bg-white shadow-lg rounded-md border w-32 z-50">
                                                <a
                                                    href={message.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        handleDownload(message.file_url, message.file_name);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Download
                                                </button>

                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default FilesPanel;
