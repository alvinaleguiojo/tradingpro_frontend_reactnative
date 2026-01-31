// Type declarations for Expo packages

declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { TextStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export const Ionicons: ComponentType<IconProps> & {
    glyphMap: Record<string, number>;
  };
  
  export const MaterialCommunityIcons: ComponentType<IconProps> & {
    glyphMap: Record<string, number>;
  };
  
  export const FontAwesome: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
  export const AntDesign: ComponentType<IconProps>;
  export const Entypo: ComponentType<IconProps>;
}

declare module 'expo-linear-gradient' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}

declare module 'react-native-safe-area-context' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewProps } from 'react-native';

  interface SafeAreaViewProps extends ViewProps {
    children?: ReactNode;
  }

  export const SafeAreaProvider: ComponentType<{ children?: ReactNode }>;
  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
  export function useSafeAreaInsets(): { top: number; right: number; bottom: number; left: number };
}
