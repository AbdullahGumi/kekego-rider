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
import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import DrawerButton from "@/components/common/DrawerButton";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { numberWithCommas } from "@/utility";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

dayjs.extend(relativeTime);

interface WalletBalance {
  balance: number;
  currency: string;
  transactionCount: number;
  lastTopUpAt: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function WalletScreen() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBalance = async () => {
    try {
      const response = await riderApi.getWalletBalance();
      setBalance(response.data.data.balance);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to load balance",
      });
    }
  };

  const fetchTransactions = async (
    pageNum: number = 1,
    append: boolean = false
  ) => {
    try {
      const params: any = { page: pageNum, limit: 10 };
      const response = await riderApi.getWalletTransactions(params);
      const newTransactions = response.data?.data.transactions || [];
      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }
      setHasMore(pageNum < (response.data?.data.pagination?.totalPages || 1));
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to load transactions",
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
    setPage(1);
    fetchTransactions(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, true);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1, false);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#4CAF50"; // Green
      case "pending":
        return "#FF9800"; // Orange
      case "failed":
        return "#F44336"; // Red
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

  const renderBalanceCard = () => (
    <Animated.View
      entering={FadeInDown}
      style={{
        backgroundColor: COLORS.primary,
        borderRadius: scale(12),
        padding: scale(20),
        marginHorizontal: scale(16),
        marginTop: scale(16),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <CustomText
        fontWeight="SemiBold"
        style={{
          fontSize: scaleText(18),
          color: COLORS.white,
          marginBottom: scale(8),
        }}
      >
        Wallet Balance
      </CustomText>
      <CustomText
        fontWeight="Bold"
        style={{
          fontSize: scaleText(32),
          color: COLORS.white,
          marginBottom: scale(4),
        }}
      >
        {balance ? `₦${numberWithCommas(Number(balance))}` : "₦0.00"}
      </CustomText>

      {balance?.lastTopUpAt && (
        <CustomText
          style={{
            fontSize: scaleText(12),
            color: COLORS.white,
            opacity: 0.6,
            marginTop: scale(4),
          }}
        >
          Last topped up: {dayjs(balance.lastTopUpAt).format("MMM DD, YYYY")}
        </CustomText>
      )}
    </Animated.View>
  );

  const renderTransactionItem = ({
    item,
    index,
  }: {
    item: Transaction;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: scale(12),
        padding: scale(16),
        marginHorizontal: scale(16),
        marginVertical: scale(4),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            fontWeight="SemiBold"
            style={{ fontSize: scaleText(16), color: COLORS.text }}
          >
            {item.description}
          </CustomText>
          <CustomText
            style={{ fontSize: scaleText(12), color: COLORS.secondaryText }}
          >
            {formatDate(item.createdAt)}
          </CustomText>
          <CustomText
            style={{
              fontSize: scaleText(12),
              color: getStatusColor(item.status),
              marginTop: scale(2),
            }}
          >
            {item.status.toUpperCase()}
          </CustomText>
        </View>
        <CustomText
          fontWeight="Bold"
          style={{
            fontSize: scaleText(18),
            color: item.type === "rider_deposit" ? "#4CAF50" : "#F44336",
          }}
        >
          {item.type === "rider_deposit" ? "+" : ""}₦
          {numberWithCommas(item.amount)}
        </CustomText>
      </View>
    </Animated.View>
  );

  const renderEmptyTransactions = () => (
    <Animated.View
      entering={FadeIn}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: scale(50),
      }}
    >
      <Ionicons name="cash-outline" size={80} color={COLORS.secondaryText} />
      <CustomText
        fontWeight="Medium"
        style={{
          fontSize: scaleText(18),
          color: COLORS.secondaryText,
          marginTop: scale(20),
        }}
      >
        No transactions yet
      </CustomText>
      <CustomText
        style={{
          fontSize: scaleText(14),
          color: COLORS.secondaryText,
          marginTop: scale(8),
          textAlign: "center",
          marginHorizontal: scale(20),
        }}
      >
        Your wallet transactions will appear here
      </CustomText>
    </Animated.View>
  );

  const renderLoader = () => (
    <ActivityIndicator size="large" color={COLORS.primary} />
  );

  const renderActionButtons = () => (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: scale(16),
        marginVertical: scale(16),
        justifyContent: "space-between",
      }}
    >
      <CustomButton
        onPress={() => {
          router.push("/topup");
        }}
        title="Top Up"
        style={{ flex: 1 }}
      />
    </View>
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
          Wallet
        </CustomText>
        <View style={{ width: scale(50) }} />
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {renderBalanceCard()}
          {renderActionButtons()}

          {/* Transactions */}
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyTransactions}
            contentContainerStyle={
              transactions.length === 0
                ? { flex: 1 }
                : { paddingBottom: scale(20) }
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? renderLoader : null}
          />
        </>
      )}
    </View>
  );
}
