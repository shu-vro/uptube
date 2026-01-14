import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Video, { ReactVideoProps, VideoRef, OnProgressData, OnLoadData } from 'react-native-video';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  TextInput,
} from 'react-native';
import { Text } from './text';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  PictureInPicture2,
  Settings,
  Settings2,
  ChevronRight,
  Gauge,
  Captions,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VolumeManager } from 'react-native-volume-manager';

import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Button } from './button';
import Sheet from './sheet';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { Switch } from './switch';

export type VideoPlayerHandle = {
  seek: (time: number) => void;
};

type Props = {
  src: string;
  poster?: string;
  style?: any;
  onFullScreenChange?: (isFullscreen: boolean) => void;
  onPipChange?: (isActive: boolean) => void;
  onCurrentTimeChange?: (currentTime: number) => void;
  setOpenQualitySheet?: React.Dispatch<React.SetStateAction<boolean>>;
  onTranscriptToggle?: () => void;
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

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  (
    {
      src,
      poster,
      style,
      onFullScreenChange,
      onPipChange,
      onCurrentTimeChange,
      setOpenQualitySheet,
      onTranscriptToggle,
      ...rest
    },
    ref
  ) => {
    const videoRef = useRef<VideoRef>(null);

    useImperativeHandle(ref, () => ({
      seek: (time: number) => {
        videoRef.current?.seek(time);
      },
    }));
    const [paused, setPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [rate, setRate] = useState(1.0);
    const [systemVolume, setSystemVolume] = useState(1.0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);
    const [openSettings2, setOpenSettings2] = useState(false);
    const [openSpeedSheet, setOpenSpeedSheet] = useState(false);
    const [muted, setMuted] = useState(false);
    const [loop, setLoop] = useState(false);
    const [ended, setEnded] = useState(false);
    const [speedInput, setSpeedInput] = useState('1.0');
    const [isScrubbing, setIsScrubbing] = useState(false);
    const rateInitialized = useRef(false);
    const longPressActive = useRef(false);
    useEffect(() => {
      setSpeedInput(rate.toFixed(2));
    }, [rate]);

    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const { colorScheme } = useColorScheme();

    // ... existing animation values ...
    const controlsOpacity = useSharedValue(1);
    const volumeOpacity = useSharedValue(0);
    const forwardOpacity = useSharedValue(0);
    const rewindOpacity = useSharedValue(0);
    const speedMessageOpacity = useSharedValue(0);

    useEffect(() => {
      if (!rateInitialized.current) {
        rateInitialized.current = true;
        return;
      }
      speedMessageOpacity.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 400 })
      );
    }, [rate, speedMessageOpacity]);

    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleFullscreen = useCallback(async () => {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
        onFullScreenChange?.(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullscreen(true);
        onFullScreenChange?.(true);
      }
    }, [isFullscreen, onFullScreenChange]);

    useEffect(() => {
      const onBackPress = () => {
        if (isFullscreen) {
          toggleFullscreen();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [isFullscreen, toggleFullscreen]);

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
      if (isScrubbing) return;
      setCurrentTime(data.currentTime);
      onCurrentTimeChange?.(data.currentTime);
    };

    const handleLoad = (data: OnLoadData) => {
      setDuration(data.duration);
      setVideoSize(data.naturalSize);
      setEnded(false);
      showControls();
    };

    const handleSeek = (value: number) => {
      videoRef.current?.seek(value);
      setCurrentTime(value);
      showControls();
    };

    const handleSliderChange = (value: number) => {
      setCurrentTime(value);
      showControls();
    };

    const handleSlidingStart = () => {
      setIsScrubbing(true);
      showControls();
    };

    const handleSlidingComplete = (value: number) => {
      setIsScrubbing(false);
      handleSeek(value);
    };

    const togglePlayPause = () => {
      if (ended) {
        videoRef.current?.seek(0);
        setEnded(false);
        setPaused(false);
        showControls();
        return;
      }
      const willBePaused = !paused;
      setPaused(willBePaused);
      hideControls();
    };

    const enterPip = useCallback(() => {
      videoRef.current?.enterPictureInPicture();
    }, []);

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
        longPressActive.current = true;
        runOnJS(setRate)(2.0);
      })
      .onFinalize(() => {
        if (!longPressActive.current) return;
        longPressActive.current = false;
        runOnJS(setRate)(1.0);
      });

    const volumeBase = useSharedValue(1.0);

    useEffect(() => {
      VolumeManager.getVolume()
        .then(({ volume }) => {
          setSystemVolume(volume);
          volumeBase.value = volume;
        })
        .catch(() => {
          /* noop */
        });

      const subscription = VolumeManager.addVolumeListener(({ volume }) => {
        setSystemVolume(volume);
        volumeBase.value = volume;
      });

      return () => subscription.remove();
    }, [volumeBase]);

    const applySystemVolume = useCallback(
      (value: number) => {
        const next = Math.max(0, Math.min(1, value));
        VolumeManager.setVolume(next, { showUI: false, type: 'music' }).catch(() => {
          /* noop */
        });
        setSystemVolume(next);
        volumeBase.value = next;
      },
      [volumeBase]
    );

    const panVolume = Gesture.Pan()
      .onStart((e) => {
        if (e.x > SCREEN_WIDTH * 0.7) {
          volumeOpacity.value = withTiming(1, { duration: 100 });
        }
      })
      .onUpdate((e) => {
        if (e.x > SCREEN_WIDTH * 0.7) {
          const newVolume =
            volumeBase.value - e.translationY / (((videoSize?.height || 300) / 3) * 2);
          const clampedVolume = Math.max(0, Math.min(1, newVolume));
          runOnJS(applySystemVolume)(clampedVolume);
        }
      })
      .onFinalize((e) => {
        const newVolume =
          volumeBase.value - e.translationY / (((videoSize?.height || 300) / 3) * 2);
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        volumeOpacity.value = withTiming(0, { duration: 500 });
        runOnJS(applySystemVolume)(clampedVolume);
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
                    uri: src,
                  }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  paused={paused}
                  rate={rate}
                  volume={1}
                  muted={muted}
                  repeat={loop}
                  onProgress={handleProgress}
                  onLoad={handleLoad}
                  onEnd={() => {
                    setEnded(true);
                    setPaused(true);
                    showControls();
                  }}
                  onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
                  onPictureInPictureStatusChanged={(e) => {
                    onPipChange?.(e.isActive);
                  }}
                  showNotificationControls
                  poster={poster}
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
                  {rate.toFixed(2)}x Speed
                </Text>
              </Animated.View>

              <Animated.View style={[styles.volumeIndicator, volumeStyle]}>
                {systemVolume === 0 ? (
                  <VolumeX size={24} color="white" />
                ) : (
                  <Volume2 size={24} color="white" />
                )}
                <View className="ml-2 h-20 w-1 justify-end overflow-hidden rounded-full bg-gray-600">
                  <View style={{ height: `${systemVolume * 100}%` }} className="w-full bg-white" />
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
            ) : ended ? (
              <TouchableOpacity
                className="rounded-full bg-white/20 px-4 py-3"
                onPress={() => {
                  videoRef.current?.seek(0);
                  setEnded(false);
                  setPaused(false);
                  showControls();
                }}>
                <View className="flex-row items-center gap-2">
                  <RotateCcw size={28} color="white" />
                  <Text className="text-white">Replay</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="rounded-full bg-black/40 p-4" onPress={togglePlayPause}>
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
          className="absolute bottom-0 w-full bg-black/60 py-2 pb-0"
          style={[controlsStyle]}>
          <View className="flex flex-col items-center justify-between">
            <Slider
              style={{ flex: 1, width: '100%' }}
              minimumValue={0}
              maximumValue={duration}
              value={currentTime}
              onSlidingStart={handleSlidingStart}
              onSlidingComplete={handleSlidingComplete}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#FFFFFF50"
              thumbTintColor="#FFFFFF"
            />
            <View className="mt-2 w-full flex-row items-center justify-between px-4 pb-2">
              <TouchableOpacity onPress={(e) => {}}>
                <Text className="font-medium text-white">
                  {formatTime(currentTime)}/{formatTime(duration)}
                </Text>
              </TouchableOpacity>
              <View className="flex-1 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => {
                    setOpenSettings(true);
                  }}
                  className="ml-4">
                  <Settings size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={enterPip} className="ml-4">
                  <PictureInPicture2 size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFullscreen} className="ml-4">
                  {isFullscreen ? (
                    <Minimize size={20} color="white" />
                  ) : (
                    <Maximize size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
        <Sheet open={openSettings} onClose={() => setOpenSettings(false)}>
          <Text variant="h3">Settings</Text>
          <SettingsButton
            Icon={Settings2}
            label="Quality"
            type="option"
            selectedText={'1080p'}
            onPress={() => setOpenQualitySheet?.(true)}
          />
          <SettingsButton
            Icon={Gauge}
            label="Playback Speed"
            type="option"
            selectedText={`${rate.toFixed(2)}x`}
            onPress={() => setOpenSpeedSheet(true)}
          />
          <SettingsButton
            Icon={Captions}
            label="Transcripts"
            type="option"
            onPress={() => {
              setOpenSettings(false);
              onTranscriptToggle?.();
            }}
          />
          <SettingsButton
            Icon={Settings}
            label="Additional Settings"
            type="option"
            selectedText={'\u00A0'}
            onPress={() => setOpenSettings2(true)}
          />
        </Sheet>
        <Sheet open={openSettings2} onClose={() => setOpenSettings2(false)}>
          <Text variant="h3">Settings</Text>
          <SettingsButton
            Icon={Volume2}
            label="Mute"
            type="switch"
            defaultToggle={muted}
            onToggle={(val) => setMuted(val)}
          />
          <SettingsButton
            Icon={Gauge}
            label="Loop Video"
            type="switch"
            defaultToggle={loop}
            onToggle={(val) => setLoop(val)}
          />
        </Sheet>
        <Sheet open={openSpeedSheet} onClose={() => setOpenSpeedSheet(false)}>
          <Text variant="h3">Playback Speed</Text>
          <View className="mt-4">
            <Text className="text-foreground">Speed (0.25x - 4x)</Text>
            <Slider
              style={{ width: '100%' }}
              minimumValue={0.25}
              maximumValue={4}
              step={0.05}
              value={rate}
              onValueChange={(v) => {
                const clamped = Math.min(4, Math.max(0.25, v));
                const next = Number(clamped.toFixed(2));
                setRate(next);
                setSpeedInput(next.toFixed(2));
              }}
              minimumTrackTintColor={THEME[colorScheme!].foreground}
              maximumTrackTintColor={THEME[colorScheme!].foreground + '50'}
              thumbTintColor={THEME[colorScheme!].foreground}
            />
            <View className="mt-3 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setRate(1);
                  setSpeedInput('1.00');
                }}>
                <Text>Reset 1.0x</Text>
              </TouchableOpacity>
              <View className="flex-row items-center gap-2">
                <Text>Manual</Text>
                <TextInput
                  value={speedInput}
                  onChangeText={(txt) => {
                    setSpeedInput(txt);
                  }}
                  onEndEditing={() => {
                    const parsed = parseFloat(speedInput);
                    if (!isNaN(parsed)) {
                      const clamped = Math.min(4, Math.max(0.25, parsed));
                      setRate(clamped);
                      setSpeedInput(clamped.toFixed(2));
                    } else {
                      setSpeedInput(rate.toFixed(2));
                    }
                  }}
                  keyboardType="decimal-pad"
                  className="w-20 rounded bg-white/10 px-2 py-1 text-white"
                />
              </View>
            </View>
          </View>
        </Sheet>
      </View>
    );
  }
);

export default VideoPlayer;

type SettingButtonType = {
  Icon?: React.ComponentType<any>;
  label: string;
  selectedText?: string;
  onPress?: () => void;
} & (
  | {
      type?: 'option';
      selectedText?: string;
    }
  | {
      type: 'switch';
      defaultToggle?: boolean;
      onToggle?: (checked: boolean) => void;
    }
);

export function SettingsButton({
  Icon,
  label,
  selectedText,
  type = 'option',
  onPress = () => {},
  ...rest
}: SettingButtonType) {
  const { colorScheme } = useColorScheme();
  const defaultToggle = (rest as { defaultToggle?: boolean }).defaultToggle ?? false;
  const onToggle = (rest as { onToggle?: (checked: boolean) => void }).onToggle;
  return (
    <TouchableOpacity
      className="flex-1 flex-row justify-between py-3"
      onPress={type !== 'switch' ? onPress : undefined}>
      <View className="flex-row items-center">
        {Icon && <Icon color={THEME[colorScheme!].foreground} />}
        <Text className="ml-4 text-lg font-medium text-foreground">{label}</Text>
      </View>
      {type === 'option' && selectedText && (
        <View className="flex-row items-center">
          <Text>{selectedText}</Text>
          <ChevronRight size={16} color={THEME[colorScheme!].foreground} />
        </View>
      )}
      {type === 'switch' && (
        <View className="flex-row items-center">
          <Switch
            checked={defaultToggle}
            onCheckedChange={(value) => {
              if (onToggle) {
                onToggle(value);
              } else {
                onPress();
              }
            }}
          />
        </View>
      )}
    </TouchableOpacity>
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
