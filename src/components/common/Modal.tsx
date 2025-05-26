import React from 'react';
import { Modal, View, TouchableOpacity, ModalProps } from 'react-native';
import { useTheme } from '@/theme';

interface CustomModalProps extends ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  children,
  onClose,
  visible,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
      }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          maxWidth: '90%',
          maxHeight: '80%',
        }}>
          {children}
        </View>
      </View>
    </Modal>
  );
};
