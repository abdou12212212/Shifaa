# Quick Start Guide - Appointment Management System

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Backend server running at `http://localhost:3000`
- Admin authentication token

### Installation & Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📂 Project Structure

```
frontend/src/
├── components/
│   ├── Dates.jsx                    # Main appointment container
│   ├── common/
│   │   ├── AppointmentModal.jsx     # Create/Edit modal
│   │   ├── StatusBadge.jsx          # Status display
│   │   ├── FilterPanel.jsx          # Filtering UI
│   │   └── CalendarDatePicker.jsx   # Calendar component
│   └── tablesDates/
│       ├── Next.jsx                 # Upcoming appointments
│       ├── Previous.jsx             # Completed appointments
│       ├── NoConfirmed.jsx          # Pending appointments
│       └── Emergency.jsx            # Emergency appointments
├── contexts/
│   ├── AuthContext.jsx              # Authentication
│   └── AppointmentContext.jsx       # Appointment state
└── services/
    ├── api.js                       # Base API service
    └── appointmentApi.js            # Appointment API methods
```

---

## 🎯 Key Features

### 1. **View Appointments**
Navigate between tabs to view different appointment statuses:
- **القادمة (Next)**: Upcoming appointments
- **غير مؤكدة (NoConfirmed)**: Pending confirmation
- **السابقة (Previous)**: Completed appointments
- **الحالات الإستعجالية (Emergency)**: Emergency cases

### 2. **Create Appointment**
```javascript
// Click "إضافة" button
// Fill form in AppointmentModal
// Required fields:
- Patient name/search
- Patient phone
- Appointment date
- Appointment time
- Address
- Total cost
```

### 3. **Search & Filter**
- **Search bar**: Search by patient name, phone, or reference ID
- **Filter button**: Open advanced filters (status, date range, urgency)

### 4. **Edit Appointment**
- Click edit icon (✏️) in table row
- Modify notes and status inline
- Click save icon (💾)

### 5. **Assign Assistant**
- Click "تعيين" in assistant column
- Select from available assistants
- Sorted by current workload

---

## 🔧 Configuration

### API Base URL
Located in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

### Appointment Statuses
Defined in `src/services/appointmentApi.js`:
```javascript
export const APPOINTMENT_STATUS = {
    PENDING: 'Pending Confirmation',
    UPCOMING: 'Upcoming',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};
```

---

## 🎨 Customization

### Colors
Modify in component files or add to Tailwind config:
```javascript
// Primary color
className="bg-teal-600 text-white"

// Status colors (in appointmentApi.js)
export const STATUS_COLORS = {
    'Pending Confirmation': 'bg-yellow-100 text-yellow-800',
    'Upcoming': 'bg-blue-100 text-blue-800',
    // ... etc
};
```

### Arabic Labels
Located in `src/services/appointmentApi.js`:
```javascript
export const STATUS_LABELS_AR = {
    'Pending Confirmation': 'غير مؤكد',
    'Upcoming': 'قادم',
    // ... etc
};
```

---

## 🔌 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/appointments` | Fetch appointments |
| `POST /api/admin/appointments` | Create appointment |
| `PATCH /api/admin/appointments/:id` | Update appointment |
| `DELETE /api/admin/appointments/:id` | Delete appointment |
| `PATCH /api/admin/appointments/:id/assign-assistant` | Assign assistant |
| `GET /api/admin/appointments/available-assistants` | Get assistants |
| `GET /api/admin/patients` | Search patients |
| `GET /api/admin/doctors` | Search doctors |

---

## 🐛 Troubleshooting

### Issue: "Server returned non-JSON response"
**Solution**: Ensure backend is running at `http://localhost:3000`

### Issue: Authentication errors
**Solution**: Check that you're logged in and token is valid in localStorage

### Issue: Appointments not loading
**Solution**:
1. Check network tab in browser DevTools
2. Verify API endpoint URLs
3. Check backend logs

### Issue: Modal not opening
**Solution**: Check console for errors, ensure all dependencies installed

---

## 📚 Common Tasks

### Add a New Filter
```javascript
// 1. Add to FilterPanel.jsx
<div>
  <label>New Filter</label>
  <select value={filters.newField} onChange={...}>
    <option>Option 1</option>
  </select>
</div>

// 2. Include in handleApply
const handleApply = () => {
  onApplyFilters({ ...filters, newField: value });
};
```

### Change Date Format
```javascript
// Edit in src/services/appointmentApi.js
export const formatAppointmentDateTime = (datetime) => {
  const date = new Date(datetime);
  const dateStr = date.toLocaleDateString('ar-DZ', {
    // Customize format here
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // ...
};
```

### Add Validation Rule
```javascript
// In AppointmentModal.jsx, validateForm()
const validateForm = () => {
  if (!formData.newField) {
    setError('New field is required');
    return false;
  }
  // ...
};
```

---

## 🔒 Security Notes

- All API calls include authentication token
- Token stored in localStorage
- No sensitive data in client-side code
- HTTPS recommended for production

---

## 📖 Further Reading

- Full documentation: `APPOINTMENT_INTEGRATION_SUMMARY.md`
- Backend API: `ADMIN_API_DOCUMENTATION.md`
- React Context: [React Docs](https://react.dev/reference/react/useContext)
- Tailwind CSS: [Tailwind Docs](https://tailwindcss.com/docs)

---

## 🆘 Getting Help

1. Check console for errors
2. Review `APPOINTMENT_INTEGRATION_SUMMARY.md`
3. Check backend API documentation
4. Review component source code (includes JSDoc comments)

---

**Last Updated**: 2025-10-22
**Version**: 1.0
