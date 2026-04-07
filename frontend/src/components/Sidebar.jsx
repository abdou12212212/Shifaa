import { Link } from 'react-router';
import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
    const {user} = useAuth();
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    if(!user) return null ;

    return (
    <section className="flex  sticky top-0 flex-row-reverse justify-between h-screen text-right">
        <nav className="w-90 flex justify-center pt-25 rounded-tl-4xl rounded-bl-4xl bg-teal-600 text-white font-bold text-[25px] leading-[100%] tracking-[0] font-rubik">
            <ul className="flex flex-col gap-8">
                <li className="text-xl mb-8">LOGO</li>
                <li><Link to="/">لوحة التحكم</Link></li>
                <li><Link to="/users">إدارة المستخدمين</Link></li>
                <li><Link to="/dates">إدارة المواعيد</Link></li>
                <li><Link to="/results">إدارة النتائج</Link></li>
                <li><Link to="/exams">إدارة الإختبارات</Link></li>
                <li><Link to="/reports">التقارير و التحاليل</Link></li>
                <li onClick={handleLogout}><Link to="/logout">Logout</Link></li>
            </ul>
        </nav>
    </section>
    )
}

export default Sidebar
