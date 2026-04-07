# Results Feature - Integration Examples

## 🎯 Quick Integration Examples

### Example 1: Basic Integration in App

```jsx
// src/App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ResultsPage } from './features/results';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
          {/* Other routes */}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
```

### Example 2: Using with Custom Layout

```jsx
// src/pages/Dashboard.jsx
import { ResultsPage } from '@/features/results';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ResultsPage />
      </div>
    </DashboardLayout>
  );
}
```

### Example 3: Standalone Component Usage

```jsx
// Using individual components
import { useState } from 'react';
import {
  useResults,
  ResultsTable,
  ResultFormModal,
  useCreateResult,
} from '@/features/results';

export function MyCustomResultsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useResults({ page, limit: 10 });
  const createMutation = useCreateResult();

  const handleCreate = (formData) => {
    createMutation.mutate(formData);
    setIsModalOpen(false);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (item) => item.name },
    { key: 'status', label: 'Status', render: (item) => item.status },
  ];

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Add New</button>

      <ResultsTable
        data={data?.data || []}
        columns={columns}
        onEdit={console.log}
        onDelete={console.log}
      />

      <ResultFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isLoading}
      />
    </div>
  );
}
```

### Example 4: With Authentication

```jsx
// src/features/results/lib/api.js - Modified
import axios from 'axios';
import { getAuthToken } from '@/lib/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken(); // Your auth logic
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ... rest of API functions
```

### Example 5: Custom Columns & Renderers

```jsx
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatCurrency } from '@/lib/utils';

const columns = [
  {
    key: 'id',
    label: 'ID',
    width: '80px',
    render: (item) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{String(item.id).padStart(4, '0')}
      </span>
    ),
  },
  {
    key: 'user',
    label: 'User',
    render: (item) => (
      <div className="flex items-center gap-2">
        <Avatar src={item.userAvatar} alt={item.userName} />
        <div>
          <div className="font-medium">{item.userName}</div>
          <div className="text-sm text-muted-foreground">{item.userEmail}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => {
      const variants = {
        active: 'default',
        pending: 'secondary',
        inactive: 'outline',
      };
      return <Badge variant={variants[item.status]}>{item.status}</Badge>;
    },
  },
  {
    key: 'amount',
    label: 'Amount',
    className: 'text-right',
    render: (item) => (
      <span className="font-semibold">{formatCurrency(item.amount)}</span>
    ),
  },
  {
    key: 'date',
    label: 'Created',
    render: (item) => (
      <time className="text-sm text-muted-foreground">
        {formatDate(item.createdAt)}
      </time>
    ),
  },
];
```

### Example 6: Advanced Filtering

```jsx
// Custom filter implementation
import { useState, useEffect } from 'react';
import { useResults } from '@/features/results';

export function ResultsWithAdvancedFilters() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const queryParams = {
    page: 1,
    limit: 10,
    search: debouncedSearch,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data, isLoading } = useResults(queryParams);

  return (
    <div>
      {/* Your custom filter UI */}
      <input
        type="search"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search..."
      />

      {/* Results display */}
      {isLoading ? <div>Loading...</div> : <div>{/* Display results */}</div>}
    </div>
  );
}
```

### Example 7: Bulk Actions

```jsx
import { useState } from 'react';
import { useDeleteResult } from '@/features/results';
import { Button } from '@/components/ui/button';

export function ResultsWithBulkActions() {
  const [selectedIds, setSelectedIds] = useState([]);
  const deleteMutation = useDeleteResult();

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds([]);
  };

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted">
          <span>{selectedIds.length} items selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleteMutation.isLoading}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <ResultsTable
        data={data}
        columns={columns}
        selectable
        selectedItems={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
```

### Example 8: Export Functionality

```jsx
import { useResults } from '@/features/results';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ResultsWithExport() {
  const { data } = useResults({ page: 1, limit: 1000 });

  const exportToCSV = () => {
    if (!data?.data) return;

    const headers = ['ID', 'Field 1', 'Field 2', 'Status', 'Created'];
    const rows = data.data.map((item) => [
      item.id,
      item.field1,
      item.field2,
      item.status,
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Button onClick={exportToCSV} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Export to CSV
      </Button>
    </div>
  );
}
```

### Example 9: Real-time Updates with WebSocket

```jsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useResults, RESULTS_KEYS } from '@/features/results';

export function ResultsWithRealtime() {
  const queryClient = useQueryClient();
  const { data } = useResults();

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'RESULT_CREATED') {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });
      }

      if (message.type === 'RESULT_UPDATED') {
        // Update specific item in cache
        queryClient.setQueryData(RESULTS_KEYS.detail(message.data.id), message.data);
        queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });
      }

      if (message.type === 'RESULT_DELETED') {
        // Remove from cache
        queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });
      }
    };

    return () => ws.close();
  }, [queryClient]);

  return <ResultsTable data={data?.data || []} />;
}
```

### Example 10: With Route Params

```jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { ResultsPage } from '@/features/results';
import { ResultDetailPage } from '@/features/results/pages/ResultDetailPage';

<Routes>
  <Route path="/results" element={<ResultsPage />} />
  <Route path="/results/:id" element={<ResultDetailPage />} />
</Routes>;

// src/features/results/pages/ResultDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useResult, useUpdateResult, useDeleteResult } from '../hooks/useResults';
import { Button } from '@/components/ui/button';

export function ResultDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: result, isLoading } = useResult(id);
  const updateMutation = useUpdateResult();
  const deleteMutation = useDeleteResult({
    onSuccess: () => navigate('/results'),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{result.field1}</h1>
      <p>{result.field2}</p>

      <div className="flex gap-2">
        <Button onClick={() => navigate(`/results/${id}/edit`)}>Edit</Button>
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate(id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
```

---

## 🎨 Styling Customization

### Dark Mode Support

The components are built with Tailwind and support dark mode out of the box:

```jsx
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ... rest of config
};
```

### Custom Theme

```jsx
// Modify colors in your tailwind config
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... customize colors
      },
    },
  },
};
```

---

## 🚀 Performance Tips

1. **Use pagination** - Don't load all data at once
2. **Enable caching** - React Query handles this automatically
3. **Debounce search** - Wait for user to stop typing
4. **Lazy load modals** - Use React.lazy() for code splitting
5. **Memoize callbacks** - Use useCallback for handlers
6. **Optimize renders** - Use React.memo for expensive components

---

## 📱 Mobile Responsive Examples

The components are responsive by default, but you can customize:

```jsx
// Mobile-first responsive table
<div className="overflow-x-auto">
  <ResultsTable
    data={data}
    columns={columns.filter((col) =>
      // Hide some columns on mobile
      window.innerWidth < 768 ? col.key !== 'field4' : true
    )}
  />
</div>
```

---

**Need more examples? Check the README.md file for detailed documentation!**
