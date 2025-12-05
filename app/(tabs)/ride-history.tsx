import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { riderApi } from "@/api/endpoints/rider";
import CustomText from "@/components/common/CustomText";
import DrawerButton from "@/components/common/DrawerButton";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { numberWithCommas } from "@/utility";

interface Driver {
  id: string;
  name: string;
  phone: string;
  profilePicture: string;
}

interface MyRating {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
}

interface Ride {
  id: string;
  pickupLocation: {
    coords: { latitude: string; longitude: string };
    address: string;
  };
  dropoffLocation: {
    coords: { latitude: string; longitude: string };
    address: string;
  };
  status: string;
  estimatedFare: number;
  actualFare: number;
  paymentMethod: string;
  cancellationReason: string;
  cancelledBy: string;
  createdAt: string;
  updatedAt: string;
  driver: Driver;
  myRating: MyRating | null;
  messagesCount: number;
}

dayjs.extend(relativeTime);

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchRideHistory = async (
    pageNum: number = 1,
    append: boolean = false
  ) => {
    try {
      setError(null);
      const params: any = { page: pageNum };
      const response = await riderApi.getRideHistory(params);
      const newRides = response.data?.data.rides || [];
      if (append) {
        setRides((prev) => [...prev, ...newRides]);
      } else {
        setRides(newRides);
      }
      setHasMore(pageNum < (response.data?.data.pagination?.totalPages || 1));
    } catch (err) {
      setError("Failed to fetch ride history. Please try again.");
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchRideHistory(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRideHistory(nextPage, true);
    }
  };

  useEffect(() => {
    fetchRideHistory(1, false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#4CAF50"; // Green
      case "cancelled":
        return "#F44336"; // Red
      case "in_progress":
        return "#2196F3"; // Blue
      default:
        return COLORS.secondaryText;
    }
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffDays = now.diff(date, "day");

    if (diffDays === 0) {
      return `Today, ${date.format("h:mm A")}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.format("h:mm A")}`;
    } else if (diffDays < 7) {
      return `${date.fromNow()}, ${date.format("h:mm A")}`;
    } else {
      return date.format("MM/DD/YYYY, h:mm A");
    }
  };

  const renderRideItem = ({ item, index }: { item: Ride; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: scale(12),
        padding: scale(16),
        marginHorizontal: scale(16),
        marginVertical: scale(8),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header with driver info and date */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: scale(12),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons
            name="person-circle-sharp"
            size={scale(40)}
            color={COLORS.primary}
          />
          <View style={{ marginLeft: scale(12), flex: 1 }}>
            <CustomText
              fontWeight="SemiBold"
              style={{ fontSize: scaleText(16), color: COLORS.text }}
            >
              {item.driver?.name}
            </CustomText>
            <CustomText
              style={{ fontSize: scaleText(14), color: COLORS.secondaryText }}
            >
              {item.driver?.phone}
            </CustomText>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <CustomText
            style={{
              fontSize: scaleText(12),
              color: getStatusColor(item.status),
              marginBottom: scale(4),
            }}
          >
            {item.status}
          </CustomText>
          <CustomText
            style={{ fontSize: scaleText(12), color: COLORS.secondaryText }}
          >
            {formatDate(item.createdAt)}
          </CustomText>
        </View>
      </View>

      {/* Locations */}
      <View style={{ marginBottom: scale(12) }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: scale(4),
          }}
        >
          <Ionicons
            name="radio-button-on"
            size={scale(16)}
            color={COLORS.primary}
          />
          <CustomText
            style={{
              fontSize: scaleText(14),
              color: COLORS.text,
              marginLeft: scale(8),
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.pickupLocation.address}
          </CustomText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="location"
            size={scale(16)}
            color={getStatusColor(item.status)}
          />
          <CustomText
            style={{
              fontSize: scaleText(14),
              color: COLORS.text,
              marginLeft: scale(8),
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.dropoffLocation.address}
          </CustomText>
        </View>
      </View>

      {/* Fare and rating */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            style={{ fontSize: scaleText(14), color: COLORS.secondaryText }}
          >
            Fare: ₦{numberWithCommas(item.actualFare || item.estimatedFare)}
          </CustomText>
        </View>
        {item.myRating && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="star" size={scale(16)} color="#FFD700" />
            <CustomText
              style={{
                fontSize: scaleText(14),
                color: COLORS.text,
                marginLeft: 4,
              }}
            >
              {item.myRating.rating}
            </CustomText>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderEmpty = () => (
    <Animated.View
      entering={FadeIn}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: scale(100),
      }}
    >
      <Ionicons
        name="car-outline"
        size={scale(80)}
        color={COLORS.secondaryText}
      />
      <CustomText
        fontWeight="Medium"
        style={{
          fontSize: scaleText(18),
          color: COLORS.secondaryText,
          marginTop: scale(20),
          textAlign: "center",
        }}
      >
        No rides found
      </CustomText>
      <CustomText
        style={{
          fontSize: scaleText(14),
          color: COLORS.secondaryText,
          marginTop: scale(8),
          textAlign: "center",
        }}
      >
        Your completed rides will appear here
      </CustomText>
    </Animated.View>
  );

  const renderLoader = () => (
    <ActivityIndicator size="large" color={COLORS.primary} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: scale(16),
          paddingTop: scale(10),
        }}
      >
        <DrawerButton />
        <CustomText
          fontWeight="Bold"
          style={{
            fontSize: scaleText(20),
            color: COLORS.text,
            textAlign: "center",
            flex: 1,
          }}
        >
          Ride History
        </CustomText>
        <View style={{ width: scale(50) }} />
      </View>

      {/* Ride List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <CustomText
            style={{
              fontSize: scaleText(16),
              color: COLORS.secondaryText,
              marginTop: scale(16),
            }}
          >
            Loading rides...
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            rides.length === 0 ? { flex: 1 } : { paddingBottom: scale(20) }
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? renderLoader : null}
        />
      )}
    </View>
  );
}
