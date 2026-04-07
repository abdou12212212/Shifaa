/**
 * Delete Confirmation Dialog - Arabic RTL Support
 * Shows confirmation before deleting a result
 */

import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'هل أنت متأكد؟',
  description = 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف العنصر المحدد نهائياً.',
  itemName,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md animate-scaleIn" dir="rtl">
        <div className="p-8">
          {/* Icon and Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <FaExclamationTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>

          {/* Description */}
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-3">{description}</p>
            {itemName && (
              <p className="font-medium text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                العنصر: {itemName}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جاري الحذف...
                </>
              ) : (
                <>
                  <FaTrash />
                  حذف
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
