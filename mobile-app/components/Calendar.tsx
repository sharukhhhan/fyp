import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  minDate?: Date;
  maxDate?: Date;
}

export default function Calendar({
  onSelectDate,
  selectedDate,
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<Array<Date | null>>([]);

  useEffect(() => {
    generateDaysForMonth(currentMonth);
  }, [currentMonth]);

  const generateDaysForMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Generate array with nulls for padding and date objects for days
    const daysArray: Array<Date | null> = [];
    
    // Add nulls for padding at start
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }
    
    setDays(daysArray);
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
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
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        
        <Text style={styles.monthYearText}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdaysContainer}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysContainer}>
        {days.map((date, index) => {
          if (date === null) {
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }
          
          const disabled = isDisabled(date);
          
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.day,
                isToday(date) && styles.today,
                isSelected(date) && styles.selectedDay,
                disabled && styles.disabledDay,
              ]}
              onPress={() => !disabled && onSelectDate(date)}
              disabled={disabled}
            >
              <Text style={[
                styles.dayText,
                isToday(date) && styles.todayText,
                isSelected(date) && styles.selectedDayText,
                disabled && styles.disabledDayText,
              ]}>
                {date.getDate()}
              </Text>
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: Colors.dark.text,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#F7F9FC',
  },
  weekdayText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: Colors.dark.textDim,
    width: 40,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  day: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  emptyDay: {
    width: 40,
    height: 40,
    margin: 2,
  },
  dayText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: Colors.dark.text,
  },
  today: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: Colors.dark.teal,
  },
  todayText: {
    fontFamily: 'Roboto-Medium',
    color: Colors.dark.teal,
  },
  selectedDay: {
    backgroundColor: Colors.dark.primaryBlue,
  },
  selectedDayText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
  },
  disabledDay: {
    opacity: 0.5,
  },
  disabledDayText: {
    color: Colors.dark.textDim,
  },
});