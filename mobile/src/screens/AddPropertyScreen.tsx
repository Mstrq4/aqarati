// Aqarati Mobile — Add Property Screen (إضافة عقار)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing, radius } from '../theme';
import FilterChips from '../components/FilterChips';
import ImagePicker from '../components/ImagePicker';
import { PROPERTY_TYPES, PURPOSES } from '../utils';

export default function AddPropertyScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const lang = i18n.language as 'ar' | 'en';

  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [streetWidth, setStreetWidth] = useState('');
  const [age, setAge] = useState('');
  const [floor, setFloor] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [visibility, setVisibility] = useState<string[]>(['private']);
  const [images, setImages] = useState<string[]>([]);

  const typeChips = PROPERTY_TYPES.map((t) => ({
    key: t.key,
    label: lang === 'ar' ? t.ar : t.en,
    color: theme.accent,
  }));

  const purposeChips = PURPOSES.map((p) => ({
    key: p.key,
    label: lang === 'ar' ? p.ar : p.en,
    color: p.color,
  }));

  const visibilityChips = [
    { key: 'private', label: t('property.private') },
    { key: 'organization', label: t('property.organization') },
    { key: 'public', label: t('property.public') },
  ];

  const handleSubmit = () => {
    const errors: string[] = [];
    if (!title.trim()) errors.push(t('property.property_title'));
    if (propertyType.length === 0) errors.push(t('property.property_type'));
    if (purpose.length === 0) errors.push(t('property.purpose'));
    if (!ownerPhone.trim()) errors.push(t('property.owner_phone'));

    if (errors.length > 0) {
      Alert.alert(
        t('common.error'),
        `${errors.map((e) => `• ${e}`).join('\n')}\n\n${t('errors.required_field')}`
      );
      return;
    }

    Alert.alert(t('common.done'), lang === 'ar' ? 'تم حفظ العقار بنجاح' : 'Property saved successfully', [
      { text: t('common.done'), onPress: () => navigation.goBack() },
    ]);
  };

  const renderField = (label: string, value: string, setValue: (v: string) => void, opts?: { keyboardType?: TextInput['props']['keyboardType']; placeholder?: string; multiline?: boolean }) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
          opts?.multiline && styles.multiline,
        ]}
        value={value}
        onChangeText={setValue}
        placeholder={opts?.placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={opts?.keyboardType || 'default'}
        multiline={opts?.multiline}
        textAlign={lang === 'ar' ? 'right' : 'left'}
      />
    </View>
  );

  const renderSwitch = (label: string, value: boolean, setValue: (v: boolean) => void) => (
    <View style={styles.switchRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor={value ? '#ffffff' : theme.textMuted}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('property.add_property')}
        </Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={[styles.saveText, { color: theme.accent }]}>
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </Text>

          {renderField(t('property.property_title'), title, setTitle, { placeholder: lang === 'ar' ? 'مثال: فيلا فاخرة بحي النرجس' : 'e.g. Luxury villa in Al Narjis' })}

          <FilterChips
            chips={purposeChips}
            selected={purpose}
            onToggle={(k) => setPurpose((p) => p.includes(k) ? p.filter((x) => x !== k) : [k])}
            multiSelect={false}
            horizontal={false}
            label={t('property.purpose')}
          />

          <FilterChips
            chips={typeChips}
            selected={propertyType}
            onToggle={(k) => setPropertyType((p) => p.includes(k) ? p.filter((x) => x !== k) : [k])}
            multiSelect={false}
            horizontal={false}
            label={t('property.property_type')}
          />

          {/* Price */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {renderField(t('property.price'), price, setPrice, { keyboardType: 'numeric', placeholder: '0' })}
            </View>
          </View>
          {renderSwitch(t('property.negotiable'), negotiable, setNegotiable)}

          {/* Details */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {lang === 'ar' ? 'تفاصيل العقار' : 'Property Details'}
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>{renderField(t('property.area'), area, setArea, { keyboardType: 'numeric' })}</View>
            <View style={{ flex: 1 }}>{renderField(t('property.bedrooms'), bedrooms, setBedrooms, { keyboardType: 'numeric' })}</View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>{renderField(t('property.bathrooms'), bathrooms, setBathrooms, { keyboardType: 'numeric' })}</View>
            <View style={{ flex: 1 }}>{renderField(t('property.street_width'), streetWidth, setStreetWidth, { keyboardType: 'numeric' })}</View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>{renderField(t('property.age'), age, setAge, { keyboardType: 'numeric' })}</View>
            <View style={{ flex: 1 }}>{renderField(t('property.floor'), floor, setFloor, { keyboardType: 'numeric' })}</View>
          </View>

          {renderSwitch(t('property.furnished'), furnished, setFurnished)}

          {renderField(t('property.description'), description, setDescription, {
            multiline: true,
            placeholder: lang === 'ar' ? 'اكتب وصفاً للعقار...' : 'Write a description...',
          })}

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t('property.location')}
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>{renderField(t('property.city'), city, setCity)}</View>
            <View style={{ flex: 1 }}>{renderField(t('property.district'), district, setDistrict)}</View>
          </View>
          {renderField(t('property.address'), address, setAddress)}

          {/* Owner */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {lang === 'ar' ? 'معلومات المالك' : 'Owner Info'}
          </Text>
          {renderField(`${t('property.owner_phone')} *`, ownerPhone, setOwnerPhone, { keyboardType: 'phone-pad' })}
          {renderField(t('property.owner_name'), ownerName, setOwnerName)}

          {/* Images */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t('property.images')}
          </Text>
          <ImagePicker images={images} onImagesChange={setImages} maxImages={6} />

          {/* Visibility */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {t('property.visibility')}
          </Text>
          <FilterChips
            chips={visibilityChips}
            selected={visibility}
            onToggle={(k) => setVisibility([k])}
            multiSelect={false}
            horizontal={false}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>{t('common.save')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Tajawal',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Tajawal',
    marginBottom: spacing.xs + 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 15,
    fontFamily: 'Tajawal',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
});
