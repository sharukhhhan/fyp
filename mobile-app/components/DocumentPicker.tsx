import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { FileText, Check } from 'lucide-react-native';
import { Document } from '@/types';

interface DocumentPickerProps {
  documents: Document[];
  selectedIds: string[];
  onSelectDocument: (id: string) => void;
}

export default function DocumentPicker({
  documents,
  selectedIds,
  onSelectDocument,
}: DocumentPickerProps) {
  return (
    <ScrollView style={styles.container}>
      {documents.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            styles.documentItem,
            selectedIds.includes(doc.id) && styles.selectedDocumentItem
          ]}
          onPress={() => onSelectDocument(doc.id)}
        >
          <View style={styles.documentInfo}>
            <View style={styles.iconContainer}>
              <FileText size={20} color={Colors.dark.primaryBlue} />
            </View>
            
            <View style={styles.documentDetails}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {doc.title}
              </Text>
              <Text style={styles.documentDate}>
                {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.checkBox,
            selectedIds.includes(doc.id) && styles.selectedCheckBox
          ]}>
            {selectedIds.includes(doc.id) && (
              <Check size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedDocumentItem: {
    borderColor: Colors.dark.primaryBlue,
    backgroundColor: '#EBF2FC',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.text,
  },
  documentDate: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: Colors.dark.textDim,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedCheckBox: {
    backgroundColor: Colors.dark.primaryBlue,
    borderColor: Colors.dark.primaryBlue,
  },
});