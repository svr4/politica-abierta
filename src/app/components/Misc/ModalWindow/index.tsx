import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface ModalWindowProps {
    open: boolean;
    title?: string;
    children: React.ReactNode;
    onClose: () => void;
}

export default function ModalWindow({ open, title, children, onClose }: ModalWindowProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby={title ? 'modal-dialog-title' : undefined}>
            {title && (
                <DialogTitle id="modal-dialog-title" sx={{ pr: 6 }}>
                    {title}
                </DialogTitle>
            )}
            <IconButton
                aria-label="Cerrar"
                onClick={onClose}
                sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent sx={{ pt: title ? 2 : 4 }}>
                {children}
            </DialogContent>
        </Dialog>
    );
}
