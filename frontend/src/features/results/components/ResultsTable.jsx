/**
 * Results Table Component
 * Displays results in a responsive table with actions
 */

import { useState } from 'react';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export const ResultsTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  isLoading = false,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(data.map((item) => item.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedItems, itemId]);
    } else {
      onSelectionChange?.(selectedItems.filter((id) => id !== itemId));
    }
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={isSomeSelected ? 'data-[state=checked]:bg-muted' : ''}
                />
              </TableHead>
            )}

            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.className}
                style={{ width: column.width }}
              >
                {column.label}
              </TableHead>
            ))}

            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 2 : 1)}
                className="h-24 text-center text-muted-foreground"
              >
                No results found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={item.id || index}
                className="group"
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </TableCell>
                )}

                {columns.map((column) => (
                  <TableCell key={column.key} className={column.cellClassName}>
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(item)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(item)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * Example column configuration:
 *
 * const columns = [
 *   {
 *     key: 'name',
 *     label: 'Name',
 *     width: '200px',
 *     render: (item) => <span className="font-medium">{item.name}</span>
 *   },
 *   {
 *     key: 'status',
 *     label: 'Status',
 *     render: (item) => <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
 *   },
 *   {
 *     key: 'date',
 *     label: 'Created',
 *     render: (item) => new Date(item.createdAt).toLocaleDateString()
 *   }
 * ];
 */
