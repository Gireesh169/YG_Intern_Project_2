
import React from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';

const ValidationAlertModal = ({ isOpen, onClose, errors }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-[fadeInUp_0.3s_ease-out]"
            >
                {/* Header */}
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-900">
                                Validation Failed
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                We found {errors.length} issue{errors.length === 1 ? '' : 's'} in your file.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Please check the rules</h4>
                                <p className="text-sm text-gray-600">Ensure your file follows the formatting guidelines.</p>
                            </div>
                        </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-4 px-1">Error Report</h4>
                    <div className="space-y-3">
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100/50"
                            >
                                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                    {index + 1}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        Dismiss and Fix
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValidationAlertModal;
