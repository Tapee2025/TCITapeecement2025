import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [userData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    points: 2450,
    role: 'contractor',
  });

  const [stats] = useState({
    bagsPurchased: 245,
    rewardsRedeemed: 3,
    pendingApprovals: 2,
  });

  const [marketingSlides] = useState([
    {
      id: 1,
      title: 'Special Offer',
      image: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg',
    },
    {
      id: 2,
      title: 'New Rewards',
      image: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg',
    },
  ]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % marketingSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.statGradient}
      >
        <View style={styles.statContent}>
          <Ionicons name={icon} size={24} color="#fff" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userData.firstName}!</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2979f2" />
        </TouchableOpacity>
      </View>

      {/* Marketing Slideshow */}
      <View style={styles.slideshow}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentSlide(slideIndex);
          }}
        >
          {marketingSlides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={{ uri: slide.image }} style={styles.slideImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.slideOverlay}
              >
                <Text style={styles.slideTitle}>{slide.title}</Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
        <View style={styles.slideIndicators}>
          {marketingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.slideIndicator,
                index === currentSlide && styles.activeSlideIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <LinearGradient
          colors={['#2979f2', '#1565c0']}
          style={styles.pointsGradient}
        >
          <View style={styles.pointsContent}>
            <Text style={styles.pointsLabel}>Available Points</Text>
            <Text style={styles.pointsValue}>{userData.points.toLocaleString()}</Text>
            <Text style={styles.pointsSubtext}>Keep earning to unlock more rewards!</Text>
          </View>
          <Ionicons name="star" size={40} color="#fff" style={styles.pointsIcon} />
        </LinearGradient>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Bags Purchased"
          value={stats.bagsPurchased}
          icon="cube-outline"
          color="#22c55e"
          onPress={() => navigation.navigate('Transactions')}
        />
        <StatCard
          title="Rewards Redeemed"
          value={stats.rewardsRedeemed}
          icon="gift-outline"
          color="#f59e0b"
          onPress={() => navigation.navigate('Rewards')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickAction
          title="Get Points"
          subtitle="Submit a new points request"
          icon="add-circle-outline"
          color="#2979f2"
          onPress={() => navigation.navigate('GetPoints')}
        />
        <QuickAction
          title="Redeem Rewards"
          subtitle="Browse available rewards"
          icon="gift-outline"
          color="#f59e0b"
          onPress={() => navigation.navigate('Rewards')}
        />
        <QuickAction
          title="Transaction History"
          subtitle="View your points history"
          icon="list-outline"
          color="#8b5cf6"
          onPress={() => navigation.navigate('Transactions')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideshow: {
    height: 200,
    marginBottom: 20,
  },
  slide: {
    width,
    height: 200,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 20,
  },
  slideTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  slideIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  slideIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeSlideIndicator: {
    backgroundColor: '#fff',
  },
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pointsGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  pointsSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  pointsIcon: {
    opacity: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});