import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RewardsScreenProps {
  navigation: any;
}

export default function RewardsScreen({ navigation }: RewardsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userPoints] = useState(2450);

  const rewards = [
    {
      id: '1',
      title: 'Cash Discount',
      description: 'Get ₹1000 discount on your next cement order',
      image: 'https://images.pexels.com/photos/259249/pexels-photo-259249.jpeg',
      pointsRequired: 1000,
      category: 'discount',
      expiryDate: '2025-12-31',
    },
    {
      id: '2',
      title: 'Goa Tour Package',
      description: 'Enjoy a 3-day tour of Goa with family (2 adults)',
      image: 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg',
      pointsRequired: 5000,
      category: 'travel',
      expiryDate: '2025-06-30',
    },
    {
      id: '3',
      title: 'Office Chair',
      description: 'Premium ergonomic office chair for your workspace',
      image: 'https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg',
      pointsRequired: 1500,
      category: 'merchandise',
      expiryDate: '2025-12-31',
    },
    {
      id: '4',
      title: 'Premium Toolbox',
      description: 'Professional-grade toolbox with essential construction tools',
      image: 'https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg',
      pointsRequired: 800,
      category: 'merchandise',
      expiryDate: '2025-08-15',
    },
  ];

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'discount', label: 'Discounts' },
    { value: 'travel', label: 'Travel' },
    { value: 'merchandise', label: 'Merchandise' },
  ];

  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRedeemReward = (reward: any) => {
    if (userPoints < reward.pointsRequired) {
      Alert.alert('Insufficient Points', 'You don\'t have enough points to redeem this reward.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${reward.title}" for ${reward.pointsRequired} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            Alert.alert('Success', 'Reward redemption request submitted successfully!');
          },
        },
      ]
    );
  };

  const RewardCard = ({ reward }: { reward: any }) => {
    const canRedeem = userPoints >= reward.pointsRequired;

    return (
      <View style={styles.rewardCard}>
        <Image source={{ uri: reward.image }} style={styles.rewardImage} />
        {!canRedeem && <View style={styles.insufficientOverlay} />}
        <View style={styles.rewardContent}>
          <View style={styles.rewardHeader}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.pointsText}>{reward.pointsRequired}</Text>
            </View>
          </View>
          <Text style={styles.rewardDescription}>{reward.description}</Text>
          <View style={styles.rewardFooter}>
            <Text style={styles.expiryText}>
              Expires: {new Date(reward.expiryDate).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={[
                styles.redeemButton,
                !canRedeem && styles.redeemButtonDisabled,
              ]}
              onPress={() => handleRedeemReward(reward)}
              disabled={!canRedeem}
            >
              <Text style={styles.redeemButtonText}>
                {canRedeem ? 'Redeem' : 'Not Enough Points'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Redeem Rewards</Text>
        <View style={styles.pointsDisplay}>
          <Ionicons name="star" size={16} color="#2979f2" />
          <Text style={styles.pointsDisplayText}>{userPoints.toLocaleString()} points</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rewards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryButton,
              selectedCategory === category.value && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.value && styles.selectedCategoryButtonText,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rewards List */}
      <ScrollView style={styles.rewardsList} showsVerticalScrollIndicator={false}>
        {filteredRewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
        {filteredRewards.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No rewards found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? `No rewards match "${searchQuery}"`
                : 'No rewards available in this category'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsDisplayText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#2979f2',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#2979f2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  rewardsList: {
    flex: 1,
    padding: 20,
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardImage: {
    width: '100%',
    height: 160,
  },
  insufficientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  rewardContent: {
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2979f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: '#999',
  },
  redeemButton: {
    backgroundColor: '#2979f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
});