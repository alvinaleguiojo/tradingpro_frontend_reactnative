import { useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

interface UpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  downloadProgress: number;
}

export function useAppUpdate() {
  const [updateState, setUpdateState] = useState<UpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    downloadProgress: 0,
  });

  // Check for updates on app load
  const checkForUpdate = useCallback(async () => {
    // Skip in development or if updates aren't enabled
    if (__DEV__ || !Updates.isEnabled) {
      console.log('Updates disabled in development mode');
      return false;
    }

    try {
      setUpdateState(prev => ({ ...prev, isChecking: true }));
      
      const update = await Updates.checkForUpdateAsync();
      
      setUpdateState(prev => ({ 
        ...prev, 
        isChecking: false,
        isUpdateAvailable: update.isAvailable 
      }));

      if (update.isAvailable) {
        console.log('Update available!');
        return true;
      }
      
      console.log('App is up to date');
      return false;
    } catch (error) {
      console.error('Error checking for update:', error);
      setUpdateState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, []);

  // Download and apply the update
  const downloadAndApplyUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    try {
      setUpdateState(prev => ({ ...prev, isDownloading: true }));
      
      // Download the update
      const result = await Updates.fetchUpdateAsync();
      
      if (result.isNew) {
        setUpdateState(prev => ({ ...prev, isDownloading: false }));
        
        // Prompt user to restart
        Alert.alert(
          '🎉 Update Ready',
          'A new version has been downloaded. Restart now to apply the update.',
          [
            {
              text: 'Later',
              style: 'cancel',
            },
            {
              text: 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateState(prev => ({ ...prev, isDownloading: false }));
      Alert.alert(
        'Update Failed',
        'Failed to download the update. Please try again later.'
      );
    }
  }, []);

  // Prompt user when update is available
  const promptForUpdate = useCallback(() => {
    Alert.alert(
      '🚀 Update Available',
      'A new version of Trading Pro is available. Would you like to update now?',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: downloadAndApplyUpdate,
        },
      ],
      { cancelable: true }
    );
  }, [downloadAndApplyUpdate]);

  // Auto-check for updates when the hook is used
  useEffect(() => {
    const checkAndPrompt = async () => {
      const hasUpdate = await checkForUpdate();
      if (hasUpdate) {
        promptForUpdate();
      }
    };

    // Delay the check slightly to not block app startup
    const timer = setTimeout(checkAndPrompt, 3000);
    
    return () => clearTimeout(timer);
  }, [checkForUpdate, promptForUpdate]);

  return {
    ...updateState,
    checkForUpdate,
    downloadAndApplyUpdate,
    promptForUpdate,
  };
}
