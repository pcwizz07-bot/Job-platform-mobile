import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { startJobReminders, setupNotificationChannel } from '../services/notifications';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = {
  outstanding: '#ef4444',
  ongoing: '#22c55e',
  upcoming: '#3b82f6',
  completed: '#6b7280',
};

export default function DashboardScreen({ user, navigation }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
      // Start 2-hour reminders for techs
      if (user.role === 'tech' || user.role === 'admin') {
        const jobs = [...(d.columns?.outstanding || []), ...(d.columns?.ongoing || []), ...(d.columns?.upcoming || [])];
        await startJobReminders(jobs);
      }
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setupNotificationChannel(); load(); }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => { setRefreshing(true); load(); };

  const stats = data?.stats || {};
  const columns = data?.columns || { outstanding: [], ongoing: [], upcoming: [] };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  const renderJob = ({ item: job }) => (
    <TouchableOpacity
      style={[styles.jobCard, { borderLeftColor: COLORS[job.status] || '#6b7280' }]}
      onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: COLORS[job.status] + '22' }]}>
          <Text style={[styles.statusText, { color: COLORS[job.status] }]}>{job.status}</Text>
        </View>
      </View>
      <View style={styles.jobMeta}>
        {job.company_name && <Text style={styles.metaText}>🏢 {job.company_name}</Text>}
        {job.technician_name && <Text style={styles.metaText}>🔧 {job.technician_name}</Text>}
        {job.scheduled_date && <Text style={styles.metaText}>📅 {new Date(job.scheduled_date).toLocaleDateString()}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.pageTitle}>Dashboard</Text>
      {user.role === 'client' && (
        <TouchableOpacity style={styles.faultBtn} onPress={() => navigation.navigate('ReportFault')}>
          <Text style={styles.faultBtnText}>📢 Report a Fault</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={[styles.statNum, { color: '#ef4444' }]}>{stats.outstanding || 0}</Text><Text style={styles.statLabel}>Outstanding</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum, { color: '#22c55e' }]}>{stats.ongoing || 0}</Text><Text style={styles.statLabel}>Ongoing</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum, { color: '#3b82f6' }]}>{stats.upcoming || 0}</Text><Text style={styles.statLabel}>Upcoming</Text></View>
        <View style={styles.statCard}><Text style={[styles.statNum, { color: '#6b7280' }]}>{stats.completed || 0}</Text><Text style={styles.statLabel}>Completed</Text></View>
      </View>

      {/* Columns */}
      {['outstanding', 'ongoing', 'upcoming'].map(col => (
        <View key={col} style={styles.column}>
          <View style={[styles.columnHeader, { borderBottomColor: COLORS[col] }]}>
            <Text style={[styles.columnTitle, { color: COLORS[col] }]}>{col.toUpperCase()} ({columns[col]?.length || 0})</Text>
          </View>
          {columns[col]?.length === 0 ? (
            <Text style={styles.emptyText}>No jobs</Text>
          ) : (
            <FlatList data={columns[col]} renderItem={renderJob} keyExtractor={item => item.id.toString()}
              scrollEnabled={false} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', padding: 16 },
  center: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#e4e6f0', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#1a1d27', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2d3140' },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: '#8b8fa3', marginTop: 2, textTransform: 'uppercase' },
  column: { marginBottom: 16 },
  columnHeader: { borderBottomWidth: 2, paddingBottom: 8, marginBottom: 8 },
  columnTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { color: '#8b8fa3', fontSize: 13, paddingVertical: 12, textAlign: 'center' },
  jobCard: { backgroundColor: '#1a1d27', borderRadius: 8, padding: 12, marginBottom: 6, borderLeftWidth: 3 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#e4e6f0', flex: 1 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  jobMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#8b8fa3' },
  faultBtn: { backgroundColor: '#450a0a', borderRadius: 8, padding: 12, marginBottom: 16, alignItems: 'center' },
  faultBtnText: { color: '#fca5a5', fontSize: 14, fontWeight: '600' },
});