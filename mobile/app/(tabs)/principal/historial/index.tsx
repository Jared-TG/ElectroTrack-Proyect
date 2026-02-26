import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MonthData {
    id: string;
    month: string;
    year: number;
    kwh: number;
    cost: number;
}

const monthlyData: MonthData[] = [
    { id: '1', month: 'Enero', year: 2026, kwh: 450, cost: 675.00 },
    { id: '2', month: 'Diciembre', year: 2025, kwh: 402, cost: 603.00 },
    { id: '3', month: 'Noviembre', year: 2025, kwh: 423, cost: 634.50 },
    { id: '4', month: 'Octubre', year: 2025, kwh: 389, cost: 583.50 },
    { id: '5', month: 'Septiembre', year: 2025, kwh: 410, cost: 615.00 },
    { id: '6', month: 'Agosto', year: 2025, kwh: 395, cost: 592.50 },
    { id: '7', month: 'Julio', year: 2025, kwh: 378, cost: 567.00 },
    { id: '8', month: 'Junio', year: 2025, kwh: 362, cost: 543.00 },
    { id: '9', month: 'Mayo', year: 2025, kwh: 319, cost: 478.50 },
    { id: '10', month: 'Abril', year: 2025, kwh: 300, cost: 450.00 },
];

const MAX_KWH = 500;

export default function HistorialScreen() {
    const router = useRouter();

    const totalKwh = monthlyData.reduce((sum, m) => sum + m.kwh, 0);
    const totalCost = monthlyData.reduce((sum, m) => sum + m.cost, 0);
    const avgKwh = Math.round(totalKwh / monthlyData.length);

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

                {/* Month Cards */}
                {monthlyData.map((item) => (
                    <View key={item.id} style={styles.monthCard}>
                        <View style={styles.monthCardContent}>
                            <View style={styles.monthLeft}>
                                <Text style={styles.monthName}>{item.month}</Text>
                                <Text style={styles.monthYear}>{item.year}</Text>
                            </View>
                            <View style={styles.monthRight}>
                                <Text style={styles.monthCost}>
                                    ${item.cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
