import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface MonthCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Date[];
}

export default function MonthCalendar({
  selectedDate,
  onDateSelect,
  markedDates = [],
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [calendarDays, setCalendarDays] = useState<Array<Date | null>>([]);

  useEffect(() => {
    generateCalendarDays(currentMonth);
  }, [currentMonth, markedDates]);

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Generate days array with null for padding
    const days: Array<Date | null> = [];
    
    // Add nulls for padding at the beginning
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isMarked = (date: Date) => {
    return markedDates.some(markedDate => 
      markedDate.getDate() === date.getDate() &&
      markedDate.getMonth() === date.getMonth() &&
      markedDate.getFullYear() === date.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth}>
          <ChevronRight size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdaysRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={index} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }
          
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.day,
                isSelected(day) && styles.selectedDay,
                isToday(day) && styles.today,
              ]}
              onPress={() => onDateSelect(day)}
            >
              <Text style={[
                styles.dayText,
                isSelected(day) && styles.selectedDayText,
                isToday(day) && styles.todayText,
              ]}>
                {day.getDate()}
              </Text>
              {isMarked(day) && <View style={styles.markedIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 12,
    color: Colors.dark.textDim,
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  day: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  dayText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.text,
  },
  selectedDay: {
    backgroundColor: Colors.dark.primaryBlue,
    borderRadius: 16,
  },
  selectedDayText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
  },
  today: {
    borderWidth: 1,
    borderColor: Colors.dark.teal,
    borderRadius: 16,
  },
  todayText: {
    color: Colors.dark.teal,
    fontFamily: 'Roboto-Medium',
  },
  emptyDay: {
    width: 32,
    height: 32,
    marginVertical: 4,
  },
  markedIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.teal,
  },
});