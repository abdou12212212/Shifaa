/**
 * Results Component - Enhanced with Full CRUD Operations
 * Integrated with existing Next/Previous tabs and Arabic RTL support
 */

import { useState, useMemo } from 'react';
import { FaSearch, FaPlus, FaFilter } from 'react-icons/fa';
import Next from './tablesResults/Next';
import Previous from './tablesResults/Previous';

// Import modals and dialogs
import ResultFormModal from './modals/ResultFormModal';
import FilterModal from './modals/FilterModal';
import DeleteConfirmDialog from './modals/DeleteConfirmDialog';

// Import hooks (you'll need to create these based on the feature implementation)
import { useResults, useCreateResult, useUpdateResult, useDeleteResult } from '../hooks/useResults';

function Results() {
    // Tab State
    const [activetab, setactivetab] = useState("next");

    // Search State
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Filter State
    const [filters, setFilters] = useState({});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Selected Items State
    const [selectedItem, setSelectedItem] = useState(null);

    // Build query params
    const queryParams = useMemo(
        () => ({
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            tab: activetab,
            ...filters,
        }),
        [currentPage, pageSize, searchTerm, activetab, filters]
    );

    // Queries and Mutations
    const { data: resultsData, isLoading } = useResults(queryParams);

    const createMutation = useCreateResult({
        onSuccess: () => {
            setIsAddModalOpen(false);
            if (currentPage !== 1) setCurrentPage(1);
        },
    });

    const updateMutation = useUpdateResult({
        onSuccess: () => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
        },
    });

    const deleteMutation = useDeleteResult({
        onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
        },
    });

    // Calculate active filters count
    const activeFiltersCount = useMemo(() => {
        return Object.values(filters).filter((value) => value !== '' && value !== null).length;
    }, [filters]);

    // Handlers
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleAddClick = () => {
        setIsAddModalOpen(true);
    };

    const handleEditClick = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    };

    const handleCreateSubmit = (data) => {
        createMutation.mutate(data);
    };

    const handleUpdateSubmit = ({ id, data }) => {
        updateMutation.mutate({ id, data });
    };

    const handleDeleteConfirm = () => {
        if (selectedItem) {
            deleteMutation.mutate(selectedItem.id);
        }
    };

    const ActiveTab = () => {
        switch (activetab) {
            case 'next':
                return (
                    <Next
                        searchTerm={searchTerm}
                        filters={filters}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                );
            case 'previous':
                return (
                    <Previous
                        searchTerm={searchTerm}
                        filters={filters}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                );
            default:
                return <div>No tab selected</div>;
        }
    };

    return (
        <section className="space-y-6">
            {/* Search Section */}
            <div className="flex justify-end items-center">
                {/* Search Bar */}
                <div className="relative w-80">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full h-10 pl-10 pr-4 bg-[#F3FAF9] border-2 border-teal-600 rounded-lg text-right placeholder:text-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        placeholder="إبحث عن مقصدك هنا"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600" />
                </div>
            </div>

            {/* Action Buttons and Tabs Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Add and Filter Buttons */}
                <div className="flex gap-2 order-2 sm:order-1">
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 border border-teal-600 bg-[#F3FAF9] text-teal-600 rounded-lg px-5 py-2 hover:bg-teal-600 hover:text-white transition-colors"
                    >
                        <FaPlus />
                        <span>إضافة</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-7 rounded-lg border border-teal-600 px-4 py-1 font-semibold text-base leading-none tracking-normal text-center order-1 sm:order-2">
                    <button
                        className={`px-10 py-3 rounded-xl transition-colors ${
                            activetab === "previous" ? "bg-teal-600 text-white" : "hover:bg-teal-50"
                        }`}
                        onClick={() => {
                            setactivetab('previous');
                            setCurrentPage(1);
                        }}
                    >
                        السابقة
                    </button>
                    <button
                        className={`px-10 py-3 rounded-xl transition-colors ${
                            activetab === "next" ? "bg-teal-600 text-white" : "hover:bg-teal-50"
                        }`}
                        onClick={() => {
                            setactivetab('next');
                            setCurrentPage(1);
                        }}
                    >
                        القادمة
                    </button>
                </div>
            </div>

            {/* Stats Bar (Optional) */}
            {resultsData?.pagination && (
                <div className="flex justify-between items-center px-4 py-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="text-sm text-teal-700">
                        <span className="font-semibold">{resultsData.pagination.totalItems}</span> نتيجة إجمالية
                    </div>
                    <div className="text-sm text-teal-700">
                        صفحة <span className="font-semibold">{resultsData.pagination.currentPage}</span> من{' '}
                        <span className="font-semibold">{resultsData.pagination.totalPages}</span>
                    </div>
                </div>
            )}

            {/* Active Tab Content */}
            <div className="mt-6">
                {ActiveTab()}
            </div>

            {/* Modals */}
            <ResultFormModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateSubmit}
                isLoading={createMutation.isLoading}
                mode="create"
            />

            <ResultFormModal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                }}
                onSubmit={handleUpdateSubmit}
                initialData={selectedItem}
                isLoading={updateMutation.isLoading}
                mode="edit"
            />

            <FilterModal
                open={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
                activeFiltersCount={activeFiltersCount}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedItem(null);
                }}
                onConfirm={handleDeleteConfirm}
                isLoading={deleteMutation.isLoading}
                itemName={selectedItem?.field1}
            />
        </section>
    );
}

export default Results;
