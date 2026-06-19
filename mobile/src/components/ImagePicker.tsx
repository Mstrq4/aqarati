// Aqarati Mobile — Image Picker Component
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';

interface ImagePickerProps {
  images: string[];
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
}

export default function ImagePicker({
  images,
  maxImages = 6,
  onImagesChange,
}: ImagePickerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        t('common.error'),
        `الحد الأقصى ${maxImages} صور`
      );
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit: maxImages - images.length,
      });

      if (result.assets) {
        const uris = result.assets
          .map((a) => a.uri)
          .filter((u): u is string => !!u);
        onImagesChange([...images, ...uris]);
      }
    } catch (err) {
      // Image picker cancelled or error
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {t('property.images')} ({images.length}/{maxImages})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={index} style={[styles.imageWrap, { borderColor: theme.border }]}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < maxImages && (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: theme.border, backgroundColor: theme.muted }]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Text style={[styles.addIcon, { color: theme.textMuted }]}>+</Text>
              <Text style={[styles.addLabel, { color: theme.textMuted }]}>
                {t('property.add_images')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const IMG_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Tajawal',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageWrap: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 2,
  },
  addLabel: {
    fontSize: 10,
    fontFamily: 'Tajawal',
  },
});
