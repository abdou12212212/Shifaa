import { useState, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import Next from "./tablesDates/Next"
import Previous from "./tablesDates/Previous"
import Emergency from "./tablesDates/Emergency"
import NoConfirmed from "./tablesDates/NoConfirmed"
import FilterPanel from "./common/FilterPanel"
import CreateAppointmentModal from "./common/CreateAppointmentModal"
import { AppointmentProvider, useAppointments } from '../contexts/AppointmentContext';

function DatesContent() {
    const { createAppointment, fetchAppointments } = useAppointments();
    const [activetab, setactivetab] = useState("next");
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        date_from: '',
        date_to: '',
        is_urgent: undefined
    });

    // Create refs for each component
    const nextRef = useRef(null);
    const previousRef = useRef(null);
    const emergencyRef = useRef(null);
    const noConfirmedRef = useRef(null);

    // Handle add button click - open the centralized modal
    const handleAddClick = () => {
        setShowAddModal(true);
    };

    // Handle create appointment
    const handleCreateAppointment = async (appointmentData) => {
        const result = await createAppointment(appointmentData);
        if (result.success) {
            // Refresh the current tab's data
            await fetchAppointments(filters);
        }
        return result;
    };

    // Handle search
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setFilters(prev => ({ ...prev, search: value }));
    };

    // Handle filter apply
    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        // Trigger refresh in active tab component
        const currentRef = getCurrentRef();
        if (currentRef?.current?.applyFilters) {
            currentRef.current.applyFilters(newFilters);
        }
    };

    const getCurrentRef = () => {
        switch (activetab) {
            case 'next':
                return nextRef;
            case 'previous':
                return previousRef;
            case 'emergency':
                return emergencyRef;
            case 'noConfirmed':
                return noConfirmedRef;
            default:
                return null;
        }
    };

    const ActiveTab = () => {
        const commonProps = { filters };

        switch (activetab) {
            case 'next':
                return <Next ref={nextRef} {...commonProps} />
            case 'previous':
                return <Previous ref={previousRef} {...commonProps} />
            case 'emergency':
                return <Emergency ref={emergencyRef} {...commonProps} />
            case 'noConfirmed':
                return <NoConfirmed ref={noConfirmedRef} {...commonProps} />
            default:
                return <div>No tab selected</div>;  
        }
    }

    return (
        <section>
            <div className="flex justify-end mb-10">
                <div className="relative w-80">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full h-10 pl-10 pr-4 bg-[#F3FAF9] border-2 border-teal-600 rounded-lg text-right placeholder:text-teal-600/50"
                        placeholder="إبحث عن مقصدك هنا"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600" />
                </div>
            </div>
            <div className='flex justify-between'>
                <div className='flex gap-2'>
                    <button
                        onClick={handleAddClick}
                        className='border-1 border-teal-600 bg-[#F3FAF9] text-teal-600 rounded-lg px-5 py-2 hover:bg-teal-600 hover:text-white transition-colors'
                    >
                        إضافة
                    </button>
                </div>
                <div className='flex justify-center gap-7 rounded-lg border-1 border-teal-600 px-4 py-1 font-semibold text-base leading-none tracking-normal text-center'>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "emergency" ? "bg-teal-600 text-white" : ""}`} onClick={() => setactivetab('emergency')}>الحالات الإستعجالية</button>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "previous" ? "bg-teal-600 text-white" : ""}`} onClick={() => setactivetab('previous')}>السابقة</button>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "noConfirmed" ? "bg-teal-600 text-white" : ""}`} onClick={() => setactivetab('noConfirmed')}>غير مؤكدة</button>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "next" ? "bg-teal-600 text-white" : ""}`} onClick={() => setactivetab('next')}>القادمة</button>
                </div>
            </div>
            <div>
                {ActiveTab()}
            </div>

            {/* Create Appointment Modal */}
            <CreateAppointmentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreateAppointment}
            />

            {/* Filter Panel */}
            <FilterPanel
                isOpen={showFilterPanel}
                onClose={() => setShowFilterPanel(false)}
                onApplyFilters={handleApplyFilters}
                initialFilters={filters}
            />
        </section>
    )
}

// Wrapper component with AppointmentProvider
function Dates() {
    return (
        <AppointmentProvider>
            <DatesContent />
        </AppointmentProvider>
    );
}

export default Dates
