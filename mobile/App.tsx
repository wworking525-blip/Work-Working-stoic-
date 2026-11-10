import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AnatomyCanvasNative } from './AnatomyCanvasNative';
import { pickStudyDocumentNative, uploadToTutorNative, NativePickedFile } from './FilePickerNative';
import { BodyPartId } from '../src/utils/human3dBodyTypes';

// Android emulator uses 10.0.2.2, iOS simulator uses localhost
const DEFAULT_BACKEND_URL = 'http://10.0.2.2:3000';

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<BodyPartId | null>(null);
  const [regionInfo, setRegionInfo] = useState<any>(null);
  const [pickedFile, setPickedFile] = useState<NativePickedFile | null>(null);
  const [question, setQuestion] = useState('Explain the clinical anatomy and USMLE pearls of this structure.');
  const [loading, setLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handlePickFile = async () => {
    try {
      const file = await pickStudyDocumentNative();
      if (file) {
        setPickedFile(file);
      }
    } catch (err: any) {
      alert(`Could not pick file: ${err.message}`);
    }
  };

  const handleAskTutor = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAiAnswer(null);

    try {
      const materialContext = regionInfo
        ? `${regionInfo.name}: ${regionInfo.description}\nFacts: ${(regionInfo.facts || []).join('; ')}`
        : 'Human 3D Anatomy Overview';

      const data = await uploadToTutorNative({
        backendBaseUrl: DEFAULT_BACKEND_URL,
        question,
        file: pickedFile || undefined,
        materialText: materialContext,
      });

      setAiAnswer(data.answer);
    } catch (err: any) {
      setAiAnswer(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>STOIC CLINICAL MOBILE</Text>
          <Text style={styles.title}>3D Anatomy & Multimodal AI Tutor</Text>
          <Text style={styles.subtitle}>
            React Native + Expo GL + Gemini Structured Output
          </Text>
        </View>

        {/* 3D Anatomy Hardware Accelerated Canvas */}
        <AnatomyCanvasNative
          selectedRegionId={selectedRegion}
          onSelectRegion={(id, info) => {
            setSelectedRegion(id);
            setRegionInfo(info);
          }}
        />

        {/* Selected Region Card */}
        {regionInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{regionInfo.name}</Text>
            <Text style={styles.cardDesc}>{regionInfo.description}</Text>
          </View>
        )}

        {/* Native File Upload & Question Bar */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFile}>
            <Text style={styles.uploadBtnText}>
              {pickedFile ? `Attached: ${pickedFile.name}` : '📁 Upload Notes / Scans (Native Picker)'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask question about anatomy or uploaded notes..."
            placeholderTextColor="#94a3b8"
            multiline
          />

          <TouchableOpacity style={styles.askBtn} onPress={handleAskTutor} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.askBtnText}>Ask AI Tutor (Gemini)</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Tutor Grounded Response */}
        {aiAnswer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerTitle}>AI Tutor Response</Text>
            <Text style={styles.answerText}>{aiAnswer}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  badge: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  uploadBtn: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#020617',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#334155',
  },
  askBtn: {
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  askBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  answerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  answerTitle: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  answerText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
});
