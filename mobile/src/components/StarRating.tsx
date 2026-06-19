// Aqarati Mobile — Star Rating Component
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 28,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(0);

  const displayRating = interactive && hovered > 0 ? hovered : rating;

  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayRating;
        const halfFilled = !filled && starValue - 0.5 <= displayRating;
        return (
          <TouchableOpacity
            key={i}
            disabled={!interactive}
            onPress={() => onRate?.(starValue)}
            onPressIn={() => interactive && setHovered(starValue)}
            onPressOut={() => interactive && setHovered(0)}
            activeOpacity={0.7}
          >
            <Text style={[styles.star, { fontSize: size, color: filled ? '#f59e0b' : halfFilled ? '#f59e0b' : theme.border }]}>
              {filled ? '★' : halfFilled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    lineHeight: undefined,
  },
});
