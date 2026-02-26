import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHistorial } from '@/app/hooks/useHistorial';

const MAX_KWH = 500;

export default function HistorialScreen() {
    const router = useRouter();
    const { months, totalKwh, totalCost, avgKwh, loading, error } = useHistorial();

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={{ color: '#AAA', marginTop: 12 }}>Cargando historial...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
                <Text style={{ color: '#FF4444', marginTop: 12, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: '#FFD700' }}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Historial de consumo</Text>

                {/* Summary Cards Row */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.summaryCardLeft]}>
                        <Text style={styles.summaryLabel}>Consumo total</Text>
                        <Text style={styles.summaryValue}>{totalKwh.toLocaleString()} kWh</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.summaryCardRight]}>
                        <Text style={styles.summaryLabel}>Costo Total</Text>
                        <Text style={styles.summaryValue}>
                            ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Average Card */}
                <View style={styles.averageCard}>
                    <Text style={styles.averageLabel}>Consumo promedio por mes</Text>
                    <Text style={styles.averageValue}>{avgKwh} kWh</Text>
                </View>

                {/* Months Section */}
                <View style={styles.monthsHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#FFF" />
                    <Text style={styles.monthsTitle}>Meses</Text>
                </View>

                {/* Month Cards — ahora usa datos del hook (API) */}
                {months.map((item) => (
                    <View key={item.id} style={styles.monthCard}>
                        <View style={styles.monthCardContent}>
                            <View style={styles.monthLeft}>
                                <Text style={styles.monthName}>{item.mes}</Text>
                                <Text style={styles.monthYear}>{item.anio}</Text>
                            </View>
                            <View style={styles.monthRight}>
                                <Text style={styles.monthCost}>
                                    ${item.costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.monthCurrency}>MXN</Text>
                            </View>
                        </View>
                        <Text style={styles.monthKwh}>{item.kwh} kWh</Text>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.min((item.kwh / MAX_KWH) * 100, 100)}%` },
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 30,
        paddingTop: 50,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    // Section Title
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFD700',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // Summary Cards
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 12,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryCardLeft: {
        backgroundColor: '#1A1A1A',
    },
    summaryCardRight: {
        backgroundColor: '#1A1A1A',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
    },
    // Average Card
    averageCard: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 24,
    },
    averageLabel: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
    },
    averageValue: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFF',
    },
    // Months Section
    monthsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 16,
    },
    monthsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    // Month Card
    monthCard: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    monthCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    monthLeft: {},
    monthName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    monthYear: {
        fontSize: 15,
        color: '#AAA',
        marginTop: 2,
    },
    monthRight: {
        alignItems: 'flex-end',
    },
    monthCost: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFD700',
    },
    monthCurrency: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    monthKwh: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
    },
    // Progress Bar
    progressBarBg: {
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 3,
    },
});
