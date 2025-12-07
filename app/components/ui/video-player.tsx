import React, { useState, useRef, useEffect, useCallback } from 'react';
import Video, { ReactVideoProps, VideoRef, OnProgressData, OnLoadData } from 'react-native-video';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Video as VideoType } from '@/types/prisma';
import Slider from '@react-native-community/slider';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MaterialIcons } from '@react-native-vector-icons/material-icons';

type Props = {
  video: VideoType;
  style?: any;
} & ReactVideoProps;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOUBLE_TAP_DELAY = 300;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ video, style, ...rest }: Props) {
  const videoRef = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // ... existing animation values ...
  const controlsOpacity = useSharedValue(1);
  const volumeOpacity = useSharedValue(0);
  const forwardOpacity = useSharedValue(0);
  const rewindOpacity = useSharedValue(0);
  const speedMessageOpacity = useSharedValue(0);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        controlsOpacity.value = withTiming(0, { duration: 200 });
      }, 3000);
    }
  }, [paused]);

  const hideControls = useCallback(() => {
    setControlsVisible(false);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      controlsOpacity.value = withTiming(0, { duration: 200 });
    }, 3000);
  }, []);

  const hardToggleControls = useCallback(() => {
    setControlsVisible((e) => !e);
    controlsOpacity.value = withTiming(controlsVisible ? 0 : 1, { duration: 200 });
  }, [controlsVisible]);

  // useEffect(() => {
  //   showControls();
  //   return () => {
  //     if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  //   };
  // }, [showControls]);

  const handleProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setVideoSize(data.naturalSize);
    showControls();
  };

  const handleSeek = (value: number) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
    showControls();
  };

  const togglePlayPause = () => {
    const willBePaused = !paused;
    setPaused(willBePaused);

    hideControls();
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      const videoAspect = videoSize.width / videoSize.height;
      const screenAspect = SCREEN_WIDTH / (SCREEN_WIDTH * (9 / 16)); // Approximation if we don't have screen height, but we can use Dimensions
      const actualScreenAspect = screenAspect;

      // Calculate cover scale
      // If video is wider than screen (e.g. 16:9 on 9:16), we need to scale up to match height.
      // Scale = (Screen Height / Video Height at fit width)
      // Video Height at fit width = Screen Width / Video Aspect
      // Scale = Screen Height / (Screen Width / Video Aspect) = (Screen Height * Video Aspect) / Screen Width = Video Aspect / Screen Aspect

      let coverScale = 1;
      if (videoSize.width > 0 && videoSize.height > 0) {
        if (videoAspect > actualScreenAspect) {
          coverScale = videoAspect / actualScreenAspect;
        } else {
          coverScale = actualScreenAspect / videoAspect;
        }
      }

      // Snap points
      if (scale.value < 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      } else if (Math.abs(scale.value - coverScale) < 0.5 || scale.value > coverScale) {
        // Snap to cover if close or larger
        scale.value = withTiming(coverScale);
        savedScale.value = coverScale;
      } else {
        // Stay at current or snap to 1? Let's snap to nearest.
        const distTo1 = Math.abs(scale.value - 1);
        const distToCover = Math.abs(scale.value - coverScale);
        if (distTo1 < distToCover) {
          scale.value = withTiming(1);
          savedScale.value = 1;
        } else {
          scale.value = withTiming(coverScale);
          savedScale.value = coverScale;
        }
      }
    });

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(hardToggleControls)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(DOUBLE_TAP_DELAY)
    .onEnd((e) => {
      if (e.x < SCREEN_WIDTH * 0.35) {
        runOnJS(handleSeek)(Math.max(0, currentTime - 10));
        rewindOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 500 })
        );
      } else if (e.x > SCREEN_WIDTH * 0.65) {
        runOnJS(handleSeek)(Math.min(duration, currentTime + 10));
        forwardOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 500 })
        );
      } else {
        runOnJS(togglePlayPause)();
      }
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(setRate)(2.0);
      speedMessageOpacity.value = withTiming(1, { duration: 200 });
    })
    .onFinalize(() => {
      runOnJS(setRate)(1.0);
      speedMessageOpacity.value = withTiming(0, { duration: 200 });
    });

  const [previousStableVolume, setPreviousStableVolume] = useState(1.0);

  const panVolume = Gesture.Pan()
    .onStart((e) => {
      if (e.x > SCREEN_WIDTH * 0.7) {
        volumeOpacity.value = withTiming(1, { duration: 100 });
      }
    })
    .onUpdate((e) => {
      if (e.x > SCREEN_WIDTH * 0.7) {
        const newVolume =
          previousStableVolume - e.translationY / (((videoSize?.height || 300) / 3) * 2);
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        runOnJS(setVolume)(clampedVolume);
      }
    })
    .onFinalize((e) => {
      const newVolume =
        previousStableVolume - e.translationY / (((videoSize?.height || 300) / 3) * 2);
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      volumeOpacity.value = withTiming(0, { duration: 500 });
      runOnJS(setVolume)(clampedVolume);
      runOnJS(setPreviousStableVolume)(clampedVolume);
    });

  const taps = Gesture.Exclusive(doubleTap, singleTap);
  // Combine pinch with others. Pinch should probably be simultaneous or race?
  // Usually pinch can happen anytime.
  const gestures = Gesture.Simultaneous(taps, longPress, panVolume, pinch);

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const volumeStyle = useAnimatedStyle(() => ({
    opacity: volumeOpacity.value,
  }));

  const forwardStyle = useAnimatedStyle(() => ({
    opacity: forwardOpacity.value,
  }));

  const rewindStyle = useAnimatedStyle(() => ({
    opacity: rewindOpacity.value,
  }));

  const speedMessageStyle = useAnimatedStyle(() => ({
    opacity: speedMessageOpacity.value,
  }));

  const videoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[{ width: '100%', backgroundColor: 'black' }, style]} className="relative">
      <GestureHandlerRootView style={[{ flex: 1, backgroundColor: 'black' }]}>
        <GestureDetector gesture={gestures}>
          <View className="w-full flex-1 items-center justify-center overflow-hidden">
            <Animated.View style={[StyleSheet.absoluteFill, videoAnimatedStyle]}>
              <Video
                ref={videoRef}
                source={{
                  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
                paused={paused}
                rate={rate}
                volume={volume}
                onProgress={handleProgress}
                onLoad={handleLoad}
                onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
                poster={video.thumbnails?.[0]?.id}
                posterResizeMode="cover"
                {...rest}
              />
            </Animated.View>

            <Animated.View style={[styles.feedbackIcon, styles.leftFeedback, rewindStyle]}>
              <MaterialIcons name="replay-10" size={40} color="white" />
            </Animated.View>

            <Animated.View style={[styles.feedbackIcon, styles.rightFeedback, forwardStyle]}>
              <MaterialIcons name="forward-10" size={40} color="white" />
              {/* <Text className="font-bold text-white">+10s</Text> */}
            </Animated.View>

            <Animated.View style={[styles.centerFeedback, speedMessageStyle]}>
              <Text className="rounded-full bg-black/50 px-4 py-2 text-lg font-bold text-white">
                2x Speed
              </Text>
            </Animated.View>

            <Animated.View style={[styles.volumeIndicator, volumeStyle]}>
              {volume === 0 ? (
                <VolumeX size={24} color="white" />
              ) : (
                <Volume2 size={24} color="white" />
              )}
              <View className="ml-2 h-20 w-1 justify-end overflow-hidden rounded-full bg-gray-600">
                <View style={{ height: `${volume * 100}%` }} className="w-full bg-white" />
              </View>
            </Animated.View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.controlsContainer, controlsStyle]}
        pointerEvents={controlsVisible ? 'box-none' : 'none'}>
        <View
          className="flex-1 items-center justify-center"
          pointerEvents={controlsVisible ? 'box-none' : 'none'}>
          {isBuffering ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <TouchableOpacity
              className="rounded-full bg-black/40 p-4"
              onPress={togglePlayPause}
              pointerEvents="auto">
              {paused ? (
                <Play size={48} color="white" fill="white" />
              ) : (
                <Pause size={48} color="white" fill="white" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      <Animated.View
        className="absolute bottom-0 w-full bg-black/60 px-4 py-2 pb-0"
        style={[controlsStyle]}>
        <View className="flex flex-row items-center justify-between">
          <Text className="w-12 font-medium text-white">{formatTime(currentTime)}</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={handleSeek}
            onValueChange={handleSeek}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#FFFFFF50"
            thumbTintColor="#FFFFFF"
          />
          <Text className="w-12 font-medium text-white">{formatTime(duration)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    justifyContent: 'space-between',
    zIndex: 10,
  },
  feedbackIcon: {
    position: 'absolute',
    top: '40%',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftFeedback: {
    left: '20%',
  },
  rightFeedback: {
    right: '20%',
  },
  centerFeedback: {
    position: 'absolute',
    top: '10%',
    alignSelf: 'center',
  },
  volumeIndicator: {
    position: 'absolute',
    right: 20,
    top: '30%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
});
