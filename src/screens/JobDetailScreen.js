import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '../services/api';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [completionDesc, setCompletionDesc] = useState('');
  const [hardwareUsed, setHardwareUsed] = useState('');
  const [clientSig, setClientSig] = useState('');
  const [clientFeedback, setClientFeedback] = useState('');
  const [techSig, setTechSig] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [sigFor, setSigFor] = useState('');
  const [busy, setBusy] = useState(false);

  const loadJob = async () => {
    try {
      const j = await api.getJob(jobId);
      setJob(j);
      setTimer(j.timer_seconds || 0);
      setTimerRunning(!!j.timer_start);
      if (j.status === 'completed') { setStep(4); }
      if (j.completion_description) setCompletionDesc(j.completion_description);
      if (j.hardware_used) setHardwareUsed(j.hardware_used);
    } catch (e) { Alert.alert('Error', 'Failed to load job'); navigation.goBack(); }
    setLoading(false);
  };

  useEffect(() => { loadJob(); }, [jobId]);

  useEffect(() => {
    if (!timerRunning) return;
    const i = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [timerRunning]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStartStop = async () => {
    try {
      if (timerRunning) { await api.pauseTimer(jobId); setTimerRunning(false); }
      else { await api.startTimer(jobId); setTimerRunning(true); }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleCompleteWork = async () => {
    if (!completionDesc.trim()) return Alert.alert('Required', 'Description is required');
    setBusy(true);
    try {
      await api.completeWork(jobId, { completion_description: completionDesc, hardware_used: hardwareUsed });
      setTimerRunning(false);
      setStep(1);
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  const handleClientSignoff = async () => {
    setBusy(true);
    try {
      await api.clientSignoff(jobId, { client_signature: clientSig, client_feedback: clientFeedback });
      setStep(3);
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  const handleTechSignoff = async () => {
    setBusy(true);
    try {
      await api.techSignoff(jobId, { tech_signature: techSig });
      setStep(4);
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!job) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.subtitle}>{job.company_name || 'N/A'} • {job.technician_name || 'Unassigned'}</Text>

      {/* Timer */}
      <View style={styles.timerCard}>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        {step === 0 && (
          <TouchableOpacity style={styles.timerBtn} onPress={handleStartStop}>
            <Text style={styles.timerBtnText}>{timerRunning ? '⏸ Pause' : '▶ Start Job'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {['Work', 'Materials', 'Client', 'Sign', 'Done'].map((s, i) => (
          <View key={s} style={[styles.step, i <= step && styles.stepActive]}>
            <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Step 0: Work Description */}
      {step === 0 && timerRunning === false && timer > 0 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>📝 Describe what was done</Text>
          <TextInput style={styles.textArea} placeholder="Full description of work..." placeholderTextColor="#666"
            value={completionDesc} onChangeText={setCompletionDesc} multiline numberOfLines={5} />
          <TouchableOpacity style={styles.btn} onPress={handleCompleteWork} disabled={busy || !completionDesc.trim()}>
            <Text style={styles.btnText}>{busy ? 'Saving...' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Hardware */}
      {step === 1 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>🔩 Hardware Used</Text>
          <TextInput style={styles.textArea} placeholder="List all parts used..." placeholderTextColor="#666"
            value={hardwareUsed} onChangeText={setHardwareUsed} multiline numberOfLines={4} />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(0)}><Text style={styles.btnSecondaryText}>← Back</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}><Text style={styles.btnText}>Next →</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 2: Client Sign */}
      {step === 2 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>✍️ Client Sign-off</Text>
          {!clientSig ? (
            <>
              <Text style={styles.hint}>Ask the client to sign below</Text>
              <TouchableOpacity style={styles.btn} onPress={() => { setSigFor('client'); setShowSigPad(true); }}>
                <Text style={styles.btnText}>Open Signature Pad</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.hint}>✅ Client signed</Text>
              <TextInput style={styles.textArea} placeholder="Client feedback (optional)" placeholderTextColor="#666"
                value={clientFeedback} onChangeText={setClientFeedback} multiline numberOfLines={2} />
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(1)}><Text style={styles.btnSecondaryText}>← Back</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleClientSignoff} disabled={busy}><Text style={styles.btnText}>Next →</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Step 3: Tech Sign */}
      {step === 3 && (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>✍️ Technician Sign-off</Text>
          {!techSig ? (
            <>
              <Text style={styles.hint}>Sign to finalize the job</Text>
              <TouchableOpacity style={styles.btn} onPress={() => { setSigFor('tech'); setShowSigPad(true); }}>
                <Text style={styles.btnText}>Open Signature Pad</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hint}>✅ Signed off — finalizing...</Text>
          )}
        </View>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <View style={[styles.stepCard, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={styles.stepTitle}>Job Complete!</Text>
          <Text style={styles.hint}>Time: {formatTime(timer)}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.btnText}>← Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Signature Modal */}
      <Modal visible={showSigPad} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {sigFor === 'client' ? 'Client Signature' : 'Technician Signature'}
            </Text>
            <Text style={styles.hint}>Sign in the box below</Text>
            <SignaturePadView
              onOK={(sig) => {
                if (sigFor === 'client') setClientSig(sig);
                else setTechSig(sig);
                setShowSigPad(false);
              }}
              onEmpty={() => Alert.alert('Error', 'Please sign first')}
              descriptionText="Sign here"
              clearText="Clear"
              confirmText="Save"
              webStyle={`
                .m-signature-pad { height: 250px; }
                .m-signature-pad--body { height: 200px; }
                canvas { background: white; }
              `}
            />
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowSigPad(false)}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Simple signature pad using WebView
const SignaturePadView = ({ onOK, onEmpty, descriptionText, clearText, confirmText, webStyle }) => {
  const webViewRef = useRef(null);
  const handleMessage = (event) => {
    const data = event.nativeEvent.data;
    if (data === 'clear') return;
    if (data === 'empty') { onEmpty && onEmpty(); return; }
    onOK(data);
  };

  const html = `
    <!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js"></script>
    <style>*{margin:0;padding:0}body{background:#1a1d27;display:flex;flex-direction:column;height:100vh}
    canvas{background:white;width:100%;flex:1;border-radius:8px;touch-action:none}
    .buttons{display:flex;gap:8px;padding:8px}
    button{flex:1;padding:10px;border:none;border-radius:6px;font-size:14px;font-weight:600}
    .clear{background:#333;color:#fff}.save{background:#6366f1;color:#fff}</style>
    </head><body>
    <canvas id="sig-canvas"></canvas>
    <div class="buttons">
      <button class="clear" onclick="clearPad()">${clearText || 'Clear'}</button>
      <button class="save" onclick="save()">${confirmText || 'Save'}</button>
    </div>
    <script>
      const canvas = document.getElementById('sig-canvas');
      const pad = new SignaturePad(canvas);
      function resize() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        pad.clear();
      }
      window.onresize = resize; resize();
      function clearPad() { pad.clear(); window.ReactNativeWebView.postMessage('clear'); }
      function save() {
        if (pad.isEmpty()) { window.ReactNativeWebView.postMessage('empty'); return; }
        window.ReactNativeWebView.postMessage(pad.toDataURL());
      }
    </script></body></html>
  `;

  return <WebView ref={webViewRef} source={{ html }} style={{ height: 280, borderRadius: 8 }}
    onMessage={handleMessage} javaScriptEnabled={true} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', padding: 16 },
  center: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#e4e6f0' },
  subtitle: { fontSize: 13, color: '#8b8fa3', marginBottom: 16 },
  timerCard: { backgroundColor: '#1a1d27', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  timerText: { fontSize: 42, fontWeight: '700', fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace', color: '#e4e6f0', letterSpacing: 2, marginBottom: 8 },
  timerBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  timerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  steps: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  step: { flex: 1, padding: 6, borderRadius: 6, backgroundColor: '#232734', alignItems: 'center' },
  stepActive: { backgroundColor: '#6366f1' },
  stepText: { fontSize: 11, fontWeight: '600', color: '#8b8fa3' },
  stepTextActive: { color: '#fff' },
  stepCard: { backgroundColor: '#1a1d27', borderRadius: 12, padding: 16, marginBottom: 16 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#e4e6f0', marginBottom: 12 },
  hint: { fontSize: 13, color: '#8b8fa3', marginBottom: 12 },
  textArea: { backgroundColor: '#232734', borderWidth: 1, borderColor: '#2d3140', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#e4e6f0', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  btn: { backgroundColor: '#6366f1', borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#232734', borderRadius: 8, padding: 12, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#2d3140' },
  btnSecondaryText: { color: '#e4e6f0', fontSize: 14, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1d27', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#e4e6f0', marginBottom: 8 },
});