import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ConfirmRelayModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deviceName: string;
    isTurningOn: boolean;
}

export default function ConfirmRelayModal({ visible, onClose, onConfirm, deviceName, isTurningOn }: ConfirmRelayModalProps) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>
                        {isTurningOn ? '¿Encender dispositivo?' : '¿Apagar dispositivo?'}
                    </Text>
                    <Text style={styles.message}>
                        {isTurningOn 
                            ? `¿Estás seguro de que deseas encender "${deviceName}"?`
                            : `¿Estás seguro de que deseas apagar "${deviceName}"? Se cortará la energía del equipo conectado.`}
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelText}>CANCELAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={() => {
                            onClose();
                            onConfirm();
                        }}>
                            <Text style={styles.confirmText}>{isTurningOn ? 'ENCENDER' : 'APAGAR'}</Text>
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
        borderColor: '#B8960A',
        borderWidth: 2,
        borderRadius: 12,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    title: {
        color: '#FFF',
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
        backgroundColor: '#FFD700',
    },
    cancelText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    confirmText: {
        color: '#000',
        fontWeight: 'bold',
    },
});
