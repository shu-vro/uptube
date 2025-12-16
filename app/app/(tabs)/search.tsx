import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Lucide } from '@react-native-vector-icons/lucide';
import useDebounce from '@/hooks/useDebounce';
import { LoadingVideo, SearchResultVideo } from '@/components/specific/Search';
import { get } from '@/lib/utils/fetch';
import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, Grid2x2, Underline } from 'lucide-react-native';
import { useAsyncItem } from '@/lib/utils/async-storage';

// const dummySearchResults = [
//   {
//     id: '1',
//     title: 'React Native Performance Optimization',
//     channel: 'Tech Channel',
//     views: '1.2M views',
//     duration: '15:30',
//     thumbnail: 'https://via.placeholder.com/320x180',
//   },
//   {
//     id: '2',
//     title: 'Advanced TypeScript Patterns',
//     channel: 'Code Academy',
//     views: '800K views',
//     duration: '22:15',
//     thumbnail: 'https://via.placeholder.com/320x180',
//   },
//   {
//     id: '3',
//     title: 'Modern UI Design Trends 2024',
//     channel: 'Design Hub',
//     views: '2.1M views',
//     duration: '18:45',
//     thumbnail: 'https://via.placeholder.com/320x180',
//   },
//   {
//     id: '4',
//     title: 'Building Scalable APIs',
//     channel: 'Backend Masters',
//     views: '650K views',
//     duration: '28:20',
//     thumbnail: 'https://via.placeholder.com/320x180',
//   },
// ];

// TODO: FROM SERVER
const getSuggestions = async (query: string) => {
  try {
    if (query.length < 3) return [];
    const data = await get({ endpoint: '/public/yt/show-suggestions', params: { q: query } });
    return data || [];
  } catch (e) {
    console.error('Error fetching suggestions:', e);
    return [];
  }
};

// Dummy API call simulation
const searchAPI = async (query: string) => {
  try {
    if (query.length < 3) return [];
    const data = await get({ endpoint: '/public/yt/search', params: { q: query } });
    return data || [];
  } catch (e) {
    console.error('Error fetching Videos', e);
    return [];
  }
};

export default function Search() {
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];
  const { height: screenHeight } = Dimensions.get('window');

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [viewMode, setViewMode] = useAsyncItem('viewMode', 'grid');
  // const [viewMode, setViewMode] = useState<'list' | 'grid'>(viewModeAsync || 'grid'); // 'list' or 'grid'

  const debouncedSuggestionQuery = useDebounce(searchQuery, 200);

  const searchInputRef = useRef<TextInput>(null);
  const searchBarPosition = useSharedValue(screenHeight / 3);
  const contentOpacity = useSharedValue(0);

  // Animated styles
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: searchBarPosition.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  // When focused, searchbarPosition will be top. and suggestions will show (opacity).
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);

    searchBarPosition.value = withSpring(20, {
      damping: 100,
      stiffness: 1500,
    });
    contentOpacity.value = withTiming(1, {
      duration: 300,
    });
  }, [searchBarPosition, contentOpacity]);

  // opposite of handleFocus
  const handleBlur = useCallback(() => {
    if (searchQuery.length === 0) {
      setIsFocused(false);
      setShowSuggestions(false);
      setSearchResults([]);
      setHasSearched(false);

      searchBarPosition.value = withSpring(screenHeight / 3, {
        damping: 100,
        stiffness: 1500,
      });
      contentOpacity.value = withTiming(0, {
        duration: 300,
      });
    }
  }, [searchQuery, searchBarPosition, contentOpacity, screenHeight, setHasSearched]);

  useEffect(() => {
    const event = Keyboard.addListener('keyboardDidHide', (k) => {
      if (!filteredSuggestions.length && searchQuery.length === 0) {
        searchInputRef.current?.blur();
      }

      return () => {
        event.remove();
      };
    });

    return () => {};
  }, []);

  // Handle suggestions fetching with debounce
  useEffect(() => {
    if (debouncedSuggestionQuery.length > 0 && isFocused && !hasSearched) {
      setIsLoadingSuggestions(true);

      getSuggestions(debouncedSuggestionQuery).then((suggestions: any) => {
        setFilteredSuggestions(suggestions);
        setIsLoadingSuggestions(false);
      });
    } else if (debouncedSuggestionQuery.length === 0) {
      setFilteredSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  }, [debouncedSuggestionQuery, isFocused, hasSearched]);

  // Show/hide suggestions based on searchQuery
  useEffect(() => {
    if (searchQuery.length > 0 && isFocused && !hasSearched) {
      setShowSuggestions(true);
      setSearchResults([]);
      setIsLoading(false);
    } else if (searchQuery.length === 0) {
      setShowSuggestions(false);
      setSearchResults([]);
      setIsLoading(false);
      setHasSearched(false);
      setFilteredSuggestions([]);
    }
  }, [searchQuery, isFocused, hasSearched]);

  // actual search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      const results = await searchAPI(query.trim());
      setSearchResults(results as any);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle suggestion selection
  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      performSearch(suggestion);
      searchInputRef.current?.blur();
      getSuggestions(suggestion).then((suggestions: any) => {
        setFilteredSuggestions(suggestions);
        setIsLoadingSuggestions(false);
      });
    },
    [performSearch]
  );

  // Handle search submit (Enter key)
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
      searchInputRef.current?.blur();
    }
  }, [searchQuery, performSearch]);

  // Render search suggestion item with highlighted text
  const renderSuggestionItem = ({ item }: { item: string }) => {
    // Highlight matching text
    const query = searchQuery.toLowerCase();
    const itemLower = item.toLowerCase();
    const matchIndex = itemLower.indexOf(query);

    let suggestionContent;
    if (matchIndex >= 0 && query.length > 0) {
      const beforeMatch = item.substring(0, matchIndex);
      const match = item.substring(matchIndex, matchIndex + query.length);
      const afterMatch = item.substring(matchIndex + query.length);

      suggestionContent = (
        <View className="flex-1 flex-row">
          <Text className="text-foreground">{beforeMatch}</Text>
          <Text className="rounded bg-accent px-1 font-semibold text-foreground">{match}</Text>
          <Text className="text-foreground">{afterMatch}</Text>
        </View>
      );
    } else {
      suggestionContent = <Text className="flex-1 text-foreground">{item}</Text>;
    }

    return (
      <TouchableOpacity
        onPress={() => handleSuggestionPress(item)}
        className="flex-row items-center border-b border-border px-4 py-3 last:border-b-0">
        <Lucide name="search" size={16} color={theme.mutedForeground} style={{ marginRight: 8 }} />
        {suggestionContent}
        <Lucide name="arrow-up-left" size={14} color={theme.mutedForeground} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Animated.View className="absolute left-4 right-4 z-10" style={searchBarAnimatedStyle}>
          <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <Lucide
              name="search"
              size={20}
              color={theme.mutedForeground}
              style={{ marginRight: 8 }}
            />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleFocus}
              onEndEditing={handleBlur}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search videos, channels, or playlists..."
              placeholderTextColor={theme.mutedForeground}
              className="flex-1 text-base text-foreground"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowSuggestions(isFocused);
                  setSearchResults([]);
                  setHasSearched(false);
                  setFilteredSuggestions([]);
                }}
                className="ml-2">
                <Lucide name="x" size={18} color={theme.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Content Area */}
        <Animated.View
          className="mt-24 flex"
          style={[
            contentAnimatedStyle,
            {
              flex: 1,
              marginTop: 100, // this hardcoded mf from top.
            },
          ]}>
          {showSuggestions && (
            <Card className="mx-4 mt-2">
              {isLoadingSuggestions ? (
                <View className="px-4 py-6">
                  <View className="flex-row items-center justify-center">
                    <Lucide
                      name="search"
                      size={16}
                      color={theme.mutedForeground}
                      style={{ marginRight: 8 }}
                    />
                    <Text variant="muted">Searching suggestions...</Text>
                  </View>
                </View>
              ) : filteredSuggestions.length > 0 ? (
                <FlatList
                  data={filteredSuggestions}
                  keyExtractor={(item, index) => `suggestion-${index}`}
                  renderItem={renderSuggestionItem}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              ) : searchQuery.length > 0 ? (
                <View className="px-4 py-6">
                  <View className="flex-row items-center justify-center">
                    <Lucide
                      name="search"
                      size={16}
                      color={theme.mutedForeground}
                      style={{ marginRight: 8 }}
                    />
                    <Text variant="muted">No suggestions found for "{searchQuery}"</Text>
                  </View>
                </View>
              ) : (
                <View className="px-4 py-6">
                  <Text variant="muted" className="text-center">
                    Start typing to see suggestions...
                  </Text>
                </View>
              )}
            </Card>
          )}

          {isLoading && (
            <FlatList
              data={Array.from({ length: 4 })}
              keyExtractor={(_, index) => `loading-${index}`}
              renderItem={LoadingVideo}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 8 }}
            />
          )}

          {searchResults.length > 0 && !isLoading && (
            <>
              {/* list or column */}
              <View className="mx-4 flex-row">
                <View className="grow"></View>
                <ToggleGroup
                  value={viewMode}
                  onValueChange={(val) => {
                    if (val) {
                      setViewMode(val as 'list' | 'grid');
                    }
                  }}
                  variant="outline"
                  type="single">
                  <ToggleGroupItem isFirst value="list" aria-label="Toggle list">
                    <ToggleGroupIcon as={List} />
                  </ToggleGroupItem>
                  <ToggleGroupItem isLast value="grid" aria-label="Toggle grid">
                    <ToggleGroupIcon as={Grid2x2} />
                  </ToggleGroupItem>
                </ToggleGroup>
              </View>
              {/* the actual list */}
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <>
                    <SearchResultVideo item={item} variant={viewMode!} />
                  </>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16 }}
              />
            </>
          )}

          {searchResults.length === 0 && !isLoading && !showSuggestions && hasSearched && (
            <View className="flex-1 items-center justify-center px-8">
              <Lucide name="search" size={48} color={theme.mutedForeground} />
              <Text variant="large" className="mb-2 mt-4 text-center">
                No results found
              </Text>
              <Text variant="muted" className="text-center leading-5">
                Try adjusting your search terms or browse trending content instead
              </Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
