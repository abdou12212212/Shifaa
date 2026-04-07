import { useState, useRef } from 'react';
import { FaSearch} from 'react-icons/fa';
import Doctor from "./tablesUsers/Doctor"
import Patient from "./tablesUsers/Patient"
import Assistance from "./tablesUsers/Assistance"
function Users() {
    const [activetab, setactivetab] = useState("patient");
    const [searchQuery, setSearchQuery] = useState("");

    // Create refs for each component
    const patientRef = useRef(null);
    const doctorRef = useRef(null);
    const assistanceRef = useRef(null);

    // Handle add button click
    const handleAddClick = () => {
        switch (activetab) {
            case 'patient':
                patientRef.current?.openAddForm();
                break;
            case 'doctor':
                doctorRef.current?.openAddForm();
                break;
            case 'assistance':
                assistanceRef.current?.openAddForm();
                break;
            default:
                break;
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const ActiveTab=()=>{
        switch (activetab) {
            case 'patient':
                return <Patient ref={patientRef} searchQuery={searchQuery} />
            case 'doctor':
                return <Doctor ref={doctorRef} searchQuery={searchQuery} />
            case 'assistance':
                return <Assistance ref={assistanceRef} searchQuery={searchQuery} />
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
                    onChange={handleSearchChange}
                    className="w-full h-10 pl-10 pr-4 bg-[#F3FAF9] border-2 border-teal-600 rounded-lg text-right placeholder:text-teal-600/50"
                    placeholder="إبحث بالإسم أو رقم الهاتف"
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
                    <button className={`px-10 py-3 rounded-xl ${activetab === "patient" ? "bg-teal-600 text-white" : ""}`} onClick={()=>setactivetab('patient')}>المريض</button>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "doctor" ? "bg-teal-600 text-white" : ""}`} onClick={()=>setactivetab('doctor')}>الطبيب</button>
                    <button className={`px-10 py-3 rounded-xl ${activetab === "assistance" ? "bg-teal-600 text-white" : ""}`} onClick={()=>setactivetab('assistance')}>المساعد</button>
                </div>
            </div>
            <div>
                {ActiveTab()}
            </div>
        </section>
    )
}

export default Users
