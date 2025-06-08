import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GetPointsScreenProps {
  navigation: any;
}

export default function GetPointsScreen({ navigation }: GetPointsScreenProps) {
  const [bagsCount, setBagsCount] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [loading, setLoading] = useState(false);

  const dealers = [
    { id: '1', name: 'ABC Distributors', gst: 'GST123456789', city: 'Ahmedabad' },
    { id: '2', name: 'XYZ Cement Store', gst: 'GST987654321', city: 'Ahmedabad' },
  ];

  const pointsPreview = bagsCount ? parseInt(bagsCount) * 10 : 0;

  const handleSubmit = async () => {
    if (!bagsCount || !selectedDealer) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual submission logic
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Success',
          'Points request submitted successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to submit request');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How It Works</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="cube-outline" size={20} color="#2979f2" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>1. Enter Bag Count</Text>
              <Text style={styles.instructionSubtitle}>
                Enter the number of Tapee Cement bags purchased
              </Text>
            </View>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="business-outline" size={20} color="#2979f2" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>2. Select Dealer</Text>
              <Text style={styles.instructionSubtitle}>
                Choose the dealer you purchased from
              </Text>
            </View>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#2979f2" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>3. Submit Request</Text>
              <Text style={styles.instructionSubtitle}>
                Dealer will verify and approve your points
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Submit Points Request</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Cement Bags</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of bags"
              value={bagsCount}
              onChangeText={setBagsCount}
              keyboardType="numeric"
              editable={!loading}
            />
            {pointsPreview > 0 && (
              <Text style={styles.pointsPreview}>
                You will earn {pointsPreview} points
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Dealer</Text>
            {dealers.map((dealer) => (
              <TouchableOpacity
                key={dealer.id}
                style={[
                  styles.dealerOption,
                  selectedDealer === dealer.id && styles.selectedDealer,
                ]}
                onPress={() => setSelectedDealer(dealer.id)}
                disabled={loading}
              >
                <View style={styles.radioButton}>
                  {selectedDealer === dealer.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.dealerInfo}>
                  <Text style={styles.dealerName}>{dealer.name}</Text>
                  <Text style={styles.dealerDetails}>
                    GST: {dealer.gst} • {dealer.city}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !bagsCount || !selectedDealer}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Points Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2979f2" />
          <Text style={styles.infoText}>
            Each cement bag is worth 10 points. Your request will be sent to the dealer for verification.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pointsPreview: {
    marginTop: 8,
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  dealerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedDealer: {
    borderColor: '#2979f2',
    backgroundColor: '#f0f7ff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2979f2',
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dealerDetails: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2979f2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f0f7ff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#2979f2',
    lineHeight: 20,
  },
});