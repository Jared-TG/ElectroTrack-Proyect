import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurar idioma español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (month: string | null, year: string | null) => void;
}

export default function DatePickerModal({ visible, onClose, onSelect }: DatePickerModalProps) {
    const handleClear = () => {
        onSelect(null, null);
        onClose();
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Filtrar por Fecha</Text>

                    <Calendar
                        // Al presionar un día, extraemos mes y año
                        onDayPress={(day: any) => {
                            const mesString = LocaleConfig.locales['es'].monthNames[day.month - 1];
                            onSelect(mesString, String(day.year));
                            onClose();
                        }}
                        theme={{
                            backgroundColor: '#1E1E1E',
                            calendarBackground: '#1E1E1E',
                            textSectionTitleColor: '#FFD700',
                            selectedDayBackgroundColor: '#FFD700',
                            selectedDayTextColor: '#000',
                            todayTextColor: '#FFD700',
                            dayTextColor: '#FFF',
                            textDisabledColor: '#555',
                            monthTextColor: '#FFD700',
                            arrowColor: '#FFD700',
                            indicatorColor: '#FFD700',
                        }}
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
                            <Text style={styles.clearButtonText}>Limpiar filtro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cerrar</Text>
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
        width: '90%',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButton: {
        backgroundColor: '#333',
        marginRight: 10,
    },
    clearButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#444',
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
