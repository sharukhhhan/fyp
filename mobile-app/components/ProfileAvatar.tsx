import { View, Image, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface ProfileAvatarProps {
  uri?: string | null;
  size?: number;
}

export default function ProfileAvatar({ uri, size = 48 }: ProfileAvatarProps) {
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2 
        }
      ]}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={styles.image} 
        />
      ) : (
        <User size={size * 0.5} color="#fff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});