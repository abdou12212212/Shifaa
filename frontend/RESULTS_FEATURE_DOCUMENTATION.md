# Results Feature Documentation

## Overview
This document provides comprehensive documentation for the Results Management feature in the Shifa application. The feature allows administrators to view, manage, and upload test results for patient appointments.

## Table of Contents
1. [Architecture](#architecture)
2. [Components](#components)
3. [API Integration](#api-integration)
4. [User Workflows](#user-workflows)
5. [File Upload](#file-upload)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Results.jsx                     # Main results page
│   │   ├── common/
│   │   │   ├── ResultUploadModal.jsx       # Upload modal component
│   │   │   └── ResultViewerModal.jsx       # Result viewer component
│   │   └── tablesResults/
│   │       ├── Next.jsx                    # Active results table
│   │       └── Previous.jsx                # Previous results (stub)
│   └── services/
│       ├── api.js                          # Main API service
│       ├── appointmentApi.js               # Appointment-specific APIs
│       └── fileUpload.js                   # File upload utilities
```

### Tech Stack
- **Frontend Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: React Icons (Font Awesome)
- **State Management**: React Hooks (useState, useEffect)
- **API Communication**: Fetch API with custom hooks

---

## Components

### 1. Results.jsx
**Location**: `src/components/Results.jsx`

**Purpose**: Main container for the results management feature.

**Features**:
- Tab navigation between "السابقة" (Next/Active) and "القادمة" (Previous)
- Search functionality
- Add and Filter buttons (placeholders)
- Arabic RTL support

**Props**: None (root component)

**State**:
- `activetab`: Current active tab ('next' | 'previous')

**Usage**:
```jsx
import Results from './components/Results';

<Route path="/results" element={<Results />} />
```

---

### 2. ResultUploadModal
**Location**: `src/components/common/ResultUploadModal.jsx`

**Purpose**: Modal for uploading test result files.

**Features**:
- File selection with drag & drop support
- File type validation (PDF, PNG, JPG)
- File size validation (max 10MB)
- Image preview for image files
- Upload progress indicator
- Test selection dropdown
- Auto-calculation of upload progress

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Controls modal visibility |
| onClose | function | Yes | Callback when modal closes |
| appointment | object | Yes | Appointment data |
| onUpload | function | Yes | Upload callback (appointmentId, testId, fileUrl) => Promise |

**Appointment Object Structure**:
```javascript
{
  appointment_id: number,
  appointment_ref_id: string,
  patient_name: string,
  patient_phone: string,
  test_ids: string,        // Comma-separated IDs
  test_names: string,      // Comma-separated names
  test_codes: string       // Comma-separated codes
}
```

**Usage**:
```jsx
import ResultUploadModal from './components/common/ResultUploadModal';

<ResultUploadModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  appointment={selectedAppointment}
  onUpload={async (appointmentId, testId, fileUrl) => {
    // Handle upload
    await uploadTestResults(appointmentId, testId, fileUrl);
  }}
/>
```

---

### 3. ResultViewerModal
**Location**: `src/components/common/ResultViewerModal.jsx`

**Purpose**: Modal for viewing uploaded test result files.

**Features**:
- Display PDF files in iframe
- Display images with full-screen preview
- Download button
- Print button
- Result metadata display

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Controls modal visibility |
| onClose | function | Yes | Callback when modal closes |
| result | object | Yes | Result data |
| appointment | object | No | Appointment data (for context) |

**Result Object Structure**:
```javascript
{
  result_id: number,
  test_id: number,
  test_name: string,
  result_file_url: string,
  uploaded_at: string (ISO date)
}
```

**Usage**:
```jsx
import ResultViewerModal from './components/common/ResultViewerModal';

<ResultViewerModal
  isOpen={showViewer}
  onClose={() => setShowViewer(false)}
  result={selectedResult}
  appointment={appointmentData}
/>
```

---

### 4. Next.jsx (Enhanced Results Table)
**Location**: `src/components/tablesResults/Next.jsx`

**Purpose**: Displays and manages active test results.

**Features**:
- Fetches test appointments from backend
- Enhanced table with modern styling
- Action buttons: Upload, View, Edit
- Detailed appointment modal
- Status badges with color coding
- Loading and error states
- Empty state handling
- Real-time data refresh

**State Management**:
```javascript
{
  appointments: [],              // List of appointments
  loading: boolean,              // Loading state
  error: string|null,            // Error message
  selectedAppointment: object,   // Currently selected appointment
  showModal: boolean,            // Details modal visibility
  editMode: boolean,             // Edit mode toggle
  showUploadModal: boolean,      // Upload modal visibility
  showViewerModal: boolean,      // Viewer modal visibility
  selectedResult: object,        // Currently viewed result
  appointmentResults: []         // Results for selected appointment
}
```

**Key Functions**:
- `fetchAppointments()`: Loads all test appointments
- `fetchAppointmentDetails(id)`: Loads detailed appointment info with results
- `updateAppointment(id, data)`: Updates appointment details
- `uploadTestResults(appointmentId, testId, fileUrl)`: Uploads test result
- `handleUpload(appointment)`: Opens upload modal
- `handleView(appointment)`: Opens details modal
- `handleEdit(appointment)`: Opens edit modal
- `handleViewResult(result)`: Opens result viewer

---

## API Integration

### Endpoints Used

#### 1. Get All Test Appointments
```javascript
GET /admin/tests

Response:
{
  "success": true,
  "data": [
    {
      "appointment_id": 101,
      "appointment_ref_id": "APP-2025-001",
      "patient_name": "محمد أحمد",
      "patient_phone": "0123456789",
      "test_ids": "1,2",
      "test_names": "فحص دم, تحليل بول",
      "test_codes": "CBC, UA",
      "assistant_name": "فاطمة علي",
      "total_cost": 250.00,
      "status": "In Progress"
    }
  ]
}
```

#### 2. Get Appointment Details
```javascript
GET /admin/appointments/:appointmentId

Response:
{
  "success": true,
  "data": {
    "appointment": { /* appointment details */ },
    "tests": [ /* test details */ ],
    "results": [
      {
        "result_id": 1,
        "test_id": 1,
        "test_name": "فحص دم شامل",
        "result_file_url": "https://example.com/result.pdf",
        "uploaded_at": "2025-10-26T14:00:00.000Z"
      }
    ]
  }
}
```

#### 3. Update Appointment
```javascript
PUT /admin/tests/:appointmentId

Body:
{
  "status": "Completed",
  "total_cost": 300.00,
  "payment_method": "cash",
  "patient_notes": "Notes here",
  "lab_notes": "Lab notes here"
}

Response:
{
  "success": true,
  "message": "تم تحديث الموعد بنجاح"
}
```

#### 4. Upload Test Results
```javascript
POST /admin/tests/results

Body:
{
  "appointment_id": 101,
  "test_id": 1,
  "result_file_url": "https://example.com/result.pdf"
}

Response:
{
  "success": true,
  "message": "تم رفع نتائج التحاليل بنجاح"
}
```

### API Service Hook

**Location**: `src/services/api.js`

**Usage**:
```javascript
import { useApi } from '../services/api';

const { apiCall } = useApi();

// GET request
const data = await apiCall('/admin/tests');

// POST request
const result = await apiCall('/admin/tests/results', {
  method: 'POST',
  body: JSON.stringify({ appointment_id: 101, test_id: 1, result_file_url: 'url' })
});
```

---

## User Workflows

### Workflow 1: Upload Test Result

1. **Navigate to Results Page**
   - Click "إدارة النتائج" in sidebar
   - View list of appointments with tests

2. **Select Appointment**
   - Click Upload button (green icon) on appointment row
   - Upload modal opens

3. **Upload File**
   - Select test from dropdown
   - Click upload area or drag file
   - File is validated (type & size)
   - Preview appears (for images)
   - Click "رفع النتيجة"

4. **Processing**
   - Progress bar shows upload progress
   - File is uploaded to storage
   - Backend is notified with file URL
   - Modal closes on success

5. **Verification**
   - Table refreshes automatically
   - Appointment status may change to "Completed"

### Workflow 2: View Test Results

1. **Navigate to Results Page**

2. **View Appointment Details**
   - Click View button (blue eye icon)
   - Details modal opens

3. **Access Results**
   - Scroll to "النتائج المرفوعة" section
   - Click "عرض النتيجة" on any result

4. **View/Download Result**
   - Result viewer modal opens
   - PDF shown in iframe OR image displayed
   - Click download icon to save
   - Click print icon to print

### Workflow 3: Edit Appointment

1. **Open Appointment Details**
   - Click View or Edit button

2. **Enable Edit Mode**
   - Click "تعديل" button
   - Fields become editable

3. **Modify Fields**
   - Update cost, status, payment method, notes

4. **Save Changes**
   - Click "حفظ التغييرات"
   - Changes sent to backend
   - Table refreshes

---

## File Upload

### Supported File Types
- PDF (.pdf)
- PNG (.png)
- JPEG/JPG (.jpg, .jpeg)

### File Size Limits
- Maximum: 10MB
- Recommended: Under 5MB for faster uploads

### Upload Methods

The `fileUpload.js` service supports multiple upload methods:

#### 1. Backend Upload (Default)
Uploads to your own backend server.

```javascript
import { uploadFile } from '../services/fileUpload';

const fileUrl = await uploadFile(file, {
  method: 'backend',
  onProgress: (percent) => console.log(`${percent}%`)
});
```

#### 2. Cloudinary Upload
Uploads to Cloudinary CDN.

**Setup**:
1. Create Cloudinary account
2. Create upload preset
3. Update `fileUpload.js` with your cloud name

```javascript
const fileUrl = await uploadFile(file, {
  method: 'cloudinary',
  onProgress: (percent) => console.log(`${percent}%`)
});
```

#### 3. AWS S3 Upload
Uploads to AWS S3 bucket (requires implementation).

```javascript
const fileUrl = await uploadFile(file, {
  method: 's3',
  onProgress: (percent) => console.log(`${percent}%`)
});
```

### File Validation

```javascript
import { validateFile } from '../services/fileUpload';

const validation = validateFile(file, {
  maxSize: 10 * 1024 * 1024,  // 10MB
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg']
});

if (!validation.valid) {
  alert(validation.error);
}
```

---

## Customization

### 1. Change Color Scheme

Edit Tailwind classes in components:

```jsx
// Change from teal to blue
className="bg-teal-600"  →  className="bg-blue-600"
className="text-teal-600"  →  className="text-blue-600"
className="border-teal-600"  →  className="border-blue-600"
```

### 2. Add Additional File Types

In `ResultUploadModal.jsx`:

```javascript
const validTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',  // Add DOC support
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  // DOCX
];
```

### 3. Customize Table Columns

In `Next.jsx`, modify the table headers and cells:

```jsx
<thead>
  <tr>
    <th>رقم التعريفي</th>
    <th>Your Custom Column</th>  {/* Add custom column */}
    <!-- other columns -->
  </tr>
</thead>
<tbody>
  {appointments.map(apt => (
    <tr>
      <td>{apt.appointment_ref_id}</td>
      <td>{apt.customField}</td>  {/* Add custom data */}
      <!-- other cells -->
    </tr>
  ))}
</tbody>
```

### 4. Add Status Filters

In `Results.jsx`:

```jsx
const [statusFilter, setStatusFilter] = useState('all');

<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
  <option value="all">الكل</option>
  <option value="Completed">مكتمل</option>
  <option value="In Progress">قيد التنفيذ</option>
</select>
```

---

## Troubleshooting

### Issue 1: Upload Modal Not Opening

**Symptoms**: Upload button click doesn't open modal

**Solutions**:
1. Check `showUploadModal` state
2. Verify `ResultUploadModal` import
3. Check console for errors

```javascript
// Add debug logging
const handleUpload = (appointment) => {
  console.log('Opening upload modal for:', appointment);
  setSelectedAppointment(appointment);
  setShowUploadModal(true);
};
```

### Issue 2: File Upload Fails

**Symptoms**: Progress bar reaches 90% but fails

**Solutions**:
1. Check backend endpoint is working
2. Verify file size is under limit
3. Check network tab in DevTools
4. Verify authentication token

```javascript
// In ResultUploadModal.jsx, add error logging
try {
  const fileUrl = await uploadFile(file);
} catch (error) {
  console.error('Upload error:', error);
  alert(`خطأ: ${error.message}`);
}
```

### Issue 3: Results Not Displaying

**Symptoms**: Table shows "لا توجد نتائج"

**Solutions**:
1. Check API endpoint returns data
2. Verify `data.success` is true
3. Check data structure matches expected format

```javascript
// Add logging in fetchAppointments
const fetchAppointments = async () => {
  const data = await apiCall('/admin/tests');
  console.log('API Response:', data);  // Debug log

  if (data.success) {
    console.log('Appointments:', data.data);  // Debug log
    setAppointments(data.data);
  }
};
```

### Issue 4: Modals Not Closing

**Symptoms**: Modal remains open after action

**Solutions**:
1. Check `onClose` prop is passed correctly
2. Verify state updates are working
3. Check for JavaScript errors

```javascript
// Ensure onClose is called
<ResultUploadModal
  isOpen={showUploadModal}
  onClose={() => {
    console.log('Closing upload modal');
    setShowUploadModal(false);
  }}
  // other props
/>
```

### Issue 5: Arabic Text Not Displaying Correctly

**Symptoms**: Text appears left-to-right or garbled

**Solutions**:
1. Ensure `dir="rtl"` is set on containers
2. Check font supports Arabic characters
3. Verify text-align is set to "right"

```jsx
<div dir="rtl" className="text-right">
  النص العربي هنا
</div>
```

---

## Best Practices

### 1. Error Handling
Always wrap API calls in try-catch blocks:

```javascript
try {
  const data = await apiCall('/admin/tests');
  // Handle success
} catch (error) {
  console.error('[API ERROR]', error);
  setError('خطأ في الاتصال بالخادم');
}
```

### 2. Loading States
Show loading indicators during async operations:

```javascript
setLoading(true);
try {
  await fetchData();
} finally {
  setLoading(false);
}
```

### 3. Data Refresh
Refresh data after mutations:

```javascript
await uploadTestResults(id, testId, fileUrl);
await fetchAppointments();  // Refresh list
```

### 4. User Feedback
Provide clear feedback for all actions:

```javascript
// Success
alert('تم رفع النتيجة بنجاح');

// Error
alert('فشل في رفع النتيجة. يرجى المحاولة مرة أخرى');
```

---

## Future Enhancements

### Planned Features
1. **Bulk Upload**: Upload multiple results at once
2. **Advanced Filters**: Filter by date range, status, test type
3. **Export to Excel**: Export results table to Excel
4. **Email Notifications**: Auto-email results to patients
5. **OCR Integration**: Extract data from uploaded PDFs
6. **Mobile App**: Native mobile application
7. **Real-time Updates**: WebSocket-based live updates

### Contributing
To contribute to this feature:
1. Follow the existing code style
2. Add proper error handling
3. Include Arabic translations
4. Test on multiple browsers
5. Update this documentation

---

## Support

For questions or issues:
- Check this documentation first
- Review the [API Documentation](./ADMIN_API_DOCUMENTATION.md)
- Contact the development team
- Submit issues on GitHub

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
**Maintained By**: Shifa Development Team
