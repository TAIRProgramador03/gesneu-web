import React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Box,
} from '@mui/material';
import { asignarNeumatico } from "@/api/Neumaticos";
import Image from 'next/image';
import { Button as ButtonCustom } from '@/components/ui/button';


interface ModalAvertAsigNeuProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

const ModalAvertAsigNeu: React.FC<ModalAvertAsigNeuProps> = ({ open, onClose, onConfirm, message }) => {
    const confirmRef = React.useRef<HTMLButtonElement | null>(null);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus();
        }, 0);
    };

    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                confirmRef.current?.focus();
            }, 0);
        }
    }, [open]);
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title" sx={{ textAlign: 'center' }}>
                {/* Imagen personalizada */}
                <Image
                    src="/assets/quitarNeumatico.png"
                    alt="Quitar Neumático"
                    width={100}
                    height={100}
                    style={{
                        margin: '0 auto'
                    }}
                />

                <Box sx={{ mt: 1, fontWeight: 'bold', fontSize: '1.2rem' }}>Confirmación</Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    id="alert-dialog-description"
                    sx={{ textAlign: 'center', color: 'black', fontSize: '1rem' }}
                >
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>

                <ButtonCustom
                    onClick={onClose}
                >
                    Cancelar
                </ButtonCustom>

                <ButtonCustom
                    onClick={onConfirm}
                    variant={'teal'}
                    ref={confirmRef}
                >
                    Confirmar
                </ButtonCustom>
            </DialogActions>
        </Dialog>
    );
};

export default ModalAvertAsigNeu;