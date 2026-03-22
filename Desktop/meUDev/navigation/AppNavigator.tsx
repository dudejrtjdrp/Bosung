import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CameraScreen } from '../features/camera/CameraScreen';
import { MemoryHomeScreen } from '../features/memory/screens/MemoryHomeScreen';

export type RootStackParamList = {
  Camera: undefined;
  Memories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Camera"
        screenOptions={{
          headerStyle: { backgroundColor: '#0D1B2A' },
          headerTintColor: '#F4F7FB',
          contentStyle: { backgroundColor: '#F4F7FB' },
        }}
      >
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: 'MU Camera' }}
        />
        <Stack.Screen
          name="Memories"
          component={MemoryHomeScreen}
          options={{ title: 'Memory Pulse' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
