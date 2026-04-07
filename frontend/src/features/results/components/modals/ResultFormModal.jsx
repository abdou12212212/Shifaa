/**
 * Result Form Modal
 * Unified modal for adding and editing results
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export const ResultFormModal = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  mode = 'create', // 'create' | 'edit'
}) => {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        field1: initialData.field1 || '',
        field2: initialData.field2 || '',
        field3: initialData.field3 || '',
        field4: initialData.field4 || '',
        field5: initialData.field5 || '',
      });
    } else {
      resetForm();
    }
  }, [initialData, mode, open]);

  const resetForm = () => {
    setFormData({
      field1: '',
      field2: '',
      field3: '',
      field4: '',
      field5: '',
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.field1.trim()) {
      newErrors.field1 = 'This field is required';
    }

    if (!formData.field2.trim()) {
      newErrors.field2 = 'This field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = mode === 'edit' ? { id: initialData.id, data: formData } : formData;
    onSubmit(submitData);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
          <DialogContent asChild>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="sm:max-w-[600px]"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {mode === 'create' ? 'Add New Result' : 'Edit Result'}
                </DialogTitle>
                <DialogDescription>
                  {mode === 'create'
                    ? 'Fill in the details to create a new result'
                    : 'Update the information below'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                {/* Field 1 - Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="field1">
                    Field 1 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="field1"
                    value={formData.field1}
                    onChange={(e) => handleChange('field1', e.target.value)}
                    placeholder="Enter value for field 1"
                    disabled={isLoading}
                    className={errors.field1 ? 'border-destructive' : ''}
                  />
                  {errors.field1 && (
                    <p className="text-sm text-destructive">{errors.field1}</p>
                  )}
                </div>

                {/* Field 2 - Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="field2">
                    Field 2 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="field2"
                    value={formData.field2}
                    onChange={(e) => handleChange('field2', e.target.value)}
                    placeholder="Enter value for field 2"
                    disabled={isLoading}
                    className={errors.field2 ? 'border-destructive' : ''}
                  />
                  {errors.field2 && (
                    <p className="text-sm text-destructive">{errors.field2}</p>
                  )}
                </div>

                {/* Field 3 - Select Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="field3">Field 3</Label>
                  <Select
                    value={formData.field3}
                    onValueChange={(value) => handleChange('field3', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Field 4 - Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="field4">Field 4</Label>
                  <Input
                    id="field4"
                    type="number"
                    value={formData.field4}
                    onChange={(e) => handleChange('field4', e.target.value)}
                    placeholder="Enter a number"
                    disabled={isLoading}
                  />
                </div>

                {/* Field 5 - Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="field5">Field 5 (Description)</Label>
                  <Textarea
                    id="field5"
                    value={formData.field5}
                    onChange={(e) => handleChange('field5', e.target.value)}
                    placeholder="Enter additional details..."
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'create' ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === 'create' ? 'Create' : 'Update'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};
