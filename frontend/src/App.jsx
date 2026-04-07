import Sidebar from "./components/Sidebar"
import Controls from "./components/Controls"
import Dates from "./components/Dates"
import Exams from "./components/Exams"
import Reports from "./components/Reports"
import Results from "./components/Results"
import Users from "./components/Users"
import Login from "./components/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import { NavigateSetter } from "./contexts/AuthContext"
import { Routes, Route } from "react-router";

function App() {
  return (
        <>
            <NavigateSetter />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                    <div className="flex flex-row-reverse">
                        <Sidebar />
                        <div className="flex-grow p-4">
                            <Routes>
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Controls />
                                    </ProtectedRoute>
                                } />
                                <Route path="/users" element={
                                    <ProtectedRoute>
                                        <Users />
                                    </ProtectedRoute>
                                } />
                                <Route path="/dates" element={
                                    <ProtectedRoute>
                                        <Dates />
                                    </ProtectedRoute>
                                } />
                                <Route path="/results" element={
                                    <ProtectedRoute>
                                        <Results />
                                    </ProtectedRoute>
                                } />
                                <Route path="/exams" element={
                                    <ProtectedRoute>
                                        <Exams />
                                    </ProtectedRoute>
                                } />
                                <Route path="/reports" element={
                                    <ProtectedRoute>
                                        <Reports />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </div>
                    </div>
                } />
            </Routes>
        </>
  )
}

export default App
