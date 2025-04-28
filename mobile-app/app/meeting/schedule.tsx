import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Calendar as CalendarIcon, Clock, ChevronDown, Check } from 'lucide-react-native';
import Button from '@/components/Button';
import DocumentPicker from '@/components/DocumentPicker';
import Calendar from '@/components/Calendar';
import Colors from '@/constants/Colors';
import Modal from '@/components/Modal';
import { getDocuments } from '@/services/documentService';
import { scheduleMeeting } from '@/services/meetingService';
import { Document } from '@/types';
import { useEffect } from 'react';

// Time slots (30 minute increments from 9AM to 5PM)
const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

export default function ScheduleMeetingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch documents that are ready for notarization
    const fetchDocuments = async () => {
      try {
        const docs = await getDocuments({ status: 'ready' });
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowTimePicker(false);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a meeting title');
      return false;
    }
    
    if (selectedDocuments.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one document');
      return false;
    }
    
    if (!selectedDate) {
      Alert.alert('Missing Information', 'Please select a date');
      return false;
    }
    
    if (!selectedTime) {
      Alert.alert('Missing Information', 'Please select a time');
      return false;
    }
    
    return true;
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Combine date and time
      const dateTimeStr = `${selectedDate?.toISOString().split('T')[0]}T${convertTo24Hour(selectedTime!)}`;
      const scheduledTime = new Date(dateTimeStr);
      
      await scheduleMeeting({
        title,
        description,
        documentIds: selectedDocuments,
        scheduledTime: scheduledTime.toISOString(),
      });
      
      router.replace('/(tabs)/meetings');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      Alert.alert('Error', 'Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours}:${minutes}:00`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Meeting</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Meeting Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter meeting title"
              placeholderTextColor={Colors.dark.textDim}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter meeting description"
              placeholderTextColor={Colors.dark.textDim}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <Text style={styles.sectionSubtitle}>Select documents to notarize during this meeting</Text>
          
          <DocumentPicker 
            documents={documents}
            selectedIds={selectedDocuments}
            onSelectDocument={(id) => {
              if (selectedDocuments.includes(id)) {
                setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
              } else {
                setSelectedDocuments([...selectedDocuments, id]);
              }
            }}
          />
          
          {documents.length === 0 && (
            <View style={styles.noDocumentsContainer}>
              <Text style={styles.noDocumentsText}>
                No documents ready for notarization. Please prepare and submit a document first.
              </Text>
              <Button
                label="Create Document"
                onPress={() => router.push('/document/new')}
                variant="secondary"
                style={styles.createDocButton}
              />
            </View>
          )}
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <Text style={styles.sectionSubtitle}>Select when you want to have your notary session</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowCalendar(true)}
            >
              <CalendarIcon size={20} color={Colors.dark.primaryBlue} />
              <Text style={styles.datePickerText}>
                {formatDate(selectedDate)}
              </Text>
              <ChevronDown size={20} color={Colors.dark.textDim} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowTimePicker(true)}
              disabled={!selectedDate}
            >
              <Clock size={20} color={Colors.dark.primaryBlue} />
              <Text style={styles.datePickerText}>
                {selectedTime || 'Select Time'}
              </Text>
              <ChevronDown size={20} color={Colors.dark.textDim} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          label="Schedule Meeting" 
          onPress={handleSchedule}
          variant="primary"
          loading={loading}
        />
      </View>
      
      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        title="Select Date"
      >
        <Calendar 
          onSelectDate={handleDateSelect}
          selectedDate={selectedDate}
          minDate={new Date()} // Cannot select dates in the past
        />
      </Modal>
      
      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        title="Select Time"
      >
        <ScrollView style={styles.timePickerContainer}>
          {TIME_SLOTS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot
              ]}
              onPress={() => handleTimeSelect(time)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTime === time && styles.selectedTimeSlotText
              ]}>
                {time}
              </Text>
              {selectedTime === time && (
                <Check size={16} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: Colors.dark.text,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerText: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  timePickerContainer: {
    maxHeight: 300,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedTimeSlot: {
    backgroundColor: Colors.dark.primaryBlue,
  },
  timeSlotText: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: Colors.dark.text,
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
  },
  noDocumentsContainer: {
    padding: 16,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    alignItems: 'center',
  },
  noDocumentsText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.textDim,
    textAlign: 'center',
    marginBottom: 16,
  },
  createDocButton: {
    alignSelf: 'center',
  },
});