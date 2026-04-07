/**
 * Delete Confirmation Dialog
 * Shows confirmation before deleting a result
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Are you sure?',
  description = 'This action cannot be undone. This will permanently delete the selected item.',
  itemName,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AnimatePresence>
        {open && (
          <AlertDialogContent asChild>
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="pt-3">
                  {description}
                  {itemName && (
                    <span className="block mt-2 font-medium text-foreground">
                      Item: {itemName}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </motion.div>
          </AlertDialogContent>
        )}
      </AnimatePresence>
    </AlertDialog>
  );
};
