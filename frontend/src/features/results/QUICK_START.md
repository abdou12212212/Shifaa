# Results Feature - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```bash
# Install core dependencies
npm install @tanstack/react-query axios framer-motion lucide-react sonner

# Install shadcn/ui CLI (if not already installed)
npx shadcn-ui@latest init

# Install all required shadcn components at once
npx shadcn-ui@latest add button table dialog alert-dialog sheet input label select textarea badge card skeleton alert dropdown-menu checkbox
```

### Step 2: Setup Providers (2 minutes)

Update your `src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 3: Configure Environment (30 seconds)

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

### Step 4: Add Route (1 minute)

In your `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ResultsPage } from './features/results';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/results" element={<ResultsPage />} />
        {/* Your other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Step 5: Run Your App (30 seconds)

```bash
npm run dev
```

Navigate to `http://localhost:5173/results` 🎉

---

## ⚡ Instant Testing (No Backend Required)

Want to test without a backend? Use this mock setup:

### Mock API Setup

Create `src/features/results/lib/mockApi.js`:

```javascript
// Mock data generator
const generateMockResults = (count = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    field1: `Result ${i + 1}`,
    field2: `Description for result ${i + 1}`,
    field3: ['option1', 'option2', 'option3'][i % 3],
    field4: Math.floor(Math.random() * 1000),
    field5: `Additional details for result ${i + 1}`,
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString(),
  }));
};

let mockData = generateMockResults(50);

// Simulate API delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
export const fetchResults = async ({ page = 1, limit = 10, ...filters }) => {
  await delay();

  let filtered = [...mockData];

  // Apply filters
  if (filters.searchTerm) {
    filtered = filtered.filter((item) =>
      item.field1.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }

  if (filters.filterOption1 && filters.filterOption1 !== 'all') {
    filtered = filtered.filter((item) => item.field3 === filters.filterOption1);
  }

  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);

  return {
    data: paginated,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(filtered.length / limit),
      totalItems: filtered.length,
      hasNext: end < filtered.length,
      hasPrev: page > 1,
    },
  };
};

export const fetchResultById = async (id) => {
  await delay(300);
  const result = mockData.find((item) => item.id === Number(id));
  if (!result) throw new Error('Result not found');
  return result;
};

export const createResult = async (data) => {
  await delay(500);
  const newResult = {
    id: mockData.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
  };
  mockData = [newResult, ...mockData];
  return newResult;
};

export const updateResult = async (id, data) => {
  await delay(500);
  const index = mockData.findIndex((item) => item.id === Number(id));
  if (index === -1) throw new Error('Result not found');

  mockData[index] = { ...mockData[index], ...data };
  return mockData[index];
};

export const deleteResult = async (id) => {
  await delay(500);
  mockData = mockData.filter((item) => item.id !== Number(id));
  return { success: true };
};
```

### Use Mock API

Replace the import in `src/features/results/hooks/useResults.js`:

```javascript
// Comment out real API
// import { fetchResults, ... } from '../lib/api';

// Use mock API
import {
  fetchResults,
  fetchResultById,
  createResult,
  updateResult,
  deleteResult,
} from '../lib/mockApi';
```

Now you can test the entire feature without any backend! 🎊

---

## 🎯 Common Customizations

### Change Page Title

```jsx
// In ResultsPage.jsx, find:
<h1 className="text-3xl font-bold tracking-tight">Results</h1>

// Change to:
<h1 className="text-3xl font-bold tracking-tight">Your Custom Title</h1>
```

### Modify Items Per Page

```jsx
// In ResultsPage.jsx, find:
const [pageSize] = useState(10);

// Change to:
const [pageSize] = useState(25); // or any number
```

### Customize Colors

All components use Tailwind classes. To change the primary color:

```jsx
// Change teal to blue, for example:
className="bg-teal-600" → className="bg-blue-600"
className="text-teal-600" → className="text-blue-600"
```

Or update your Tailwind config for global changes.

---

## 🐛 Troubleshooting

### "Cannot find module '@/components/ui/button'"

**Fix**: You need to install shadcn/ui components. Run:

```bash
npx shadcn-ui@latest add button
```

### "React Query is not defined"

**Fix**: Make sure you wrapped your app with QueryClientProvider:

```jsx
import { QueryClientProvider } from '@tanstack/react-query';
// ... wrap your app
```

### "Toast not showing"

**Fix**: Add the Toaster component:

```jsx
import { Toaster } from 'sonner';

// In your App or main component:
<Toaster position="top-right" />
```

### "API calls failing"

**Fix**: Check your `.env` file and make sure VITE_API_URL is correct.

For development, try:

```env
VITE_API_URL=http://localhost:3000/api
```

### "Modals not closing"

**Fix**: Ensure you have Framer Motion installed:

```bash
npm install framer-motion
```

---

## 📚 Next Steps

1. ✅ **Customize the form fields** - Edit `ResultFormModal.jsx`
2. ✅ **Add your table columns** - Update columns in `ResultsPage.jsx`
3. ✅ **Connect to real API** - Replace mock with actual endpoints
4. ✅ **Add authentication** - Modify `lib/api.js`
5. ✅ **Customize filters** - Edit `FilterModal.jsx`
6. ✅ **Add more features** - Check `INTEGRATION_EXAMPLE.md`

---

## 🎓 Learn More

- 📖 **Full Documentation**: See `README.md`
- 💡 **Examples**: Check `INTEGRATION_EXAMPLE.md`
- 🧪 **Testing**: Add tests for your customizations
- 🚀 **Deploy**: Build with `npm run build`

---

## ✨ Features You Get Out of the Box

- ✅ Full CRUD operations
- ✅ Pagination (Next/Previous)
- ✅ Advanced filtering
- ✅ Search functionality
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Toast notifications
- ✅ Smooth animations
- ✅ Mobile responsive
- ✅ Dark mode ready
- ✅ Keyboard accessible
- ✅ Optimistic updates
- ✅ Row selection
- ✅ Export functionality

---

## 🎉 You're Ready!

The feature is production-ready and follows all modern React best practices. Start customizing to fit your needs!

**Questions?** Check the README.md or open an issue.

**Happy Coding!** 🚀
