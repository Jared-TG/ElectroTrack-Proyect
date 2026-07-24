import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ConfirmDeleteModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deviceName: string;
}

export default function ConfirmDeleteModal({ visible, onClose, onConfirm, deviceName }: ConfirmDeleteModalProps) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>¿Eliminar dispositivo?</Text>
                    <Text style={styles.message}>
                        ¿Estás seguro de que deseas eliminar "{deviceName}"? Esta acción no se puede deshacer y perderás el historial de este dispositivo.
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelText}>CANCELAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={() => {
                            onClose();
                            onConfirm();
                        }}>
                            <Text style={styles.confirmText}>ELIMINAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#000',
        borderColor: '#FF4444',
        borderWidth: 2,
        borderRadius: 12,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    title: {
        color: '#FF4444',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#2A2A2A',
    },
    confirmButton: {
        backgroundColor: '#FF4444',
    },
    cancelText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    confirmText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
