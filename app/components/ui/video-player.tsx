import React, { useState, useRef, useEffect, useCallback } from 'react';
import Video, { ReactVideoProps, VideoRef, OnProgressData, OnLoadData } from 'react-native-video';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react-native';
import { Video as VideoType } from '@/types/prisma';
import Slider from '@react-native-community/slider';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, runOnJS, FadeIn, FadeOut } from 'react-native-reanimated';

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

    // ... existing showControls ...
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

    useEffect(() => {
        showControls();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [showControls]);

    const handleProgress = (data: OnProgressData) => {
        setCurrentTime(data.currentTime);
    };

    const handleLoad = (data: OnLoadData) => {
        setDuration(data.duration);
        setVideoSize(data.naturalSize);
        showControls();
    };

    // ... existing handleSeek, togglePlayPause ...
    const handleSeek = (value: number) => {
        videoRef.current?.seek(value);
        setCurrentTime(value);
        showControls();
    };

    const togglePlayPause = () => {
        setPaused(!paused);
        showControls();
    };

    // --- Gestures ---

    // 7. Pinch to Zoom
    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            const videoAspect = videoSize.width / videoSize.height;
            const screenAspect = SCREEN_WIDTH / (SCREEN_WIDTH * (9/16)); // Approximation if we don't have screen height, but we can use Dimensions
            // Better: use actual screen dimensions
            const { width: sw, height: sh } = Dimensions.get('window');
            const actualScreenAspect = sw / sh;
            
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

    // ... existing gestures ...
    const singleTap = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(showControls)();
        });

    const doubleTapCenter = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(DOUBLE_TAP_DELAY)
        .onEnd(() => {
            runOnJS(togglePlayPause)();
        });

    const doubleTapLeft = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(DOUBLE_TAP_DELAY)
        .onEnd((e) => {
            if (e.x < SCREEN_WIDTH * 0.35) {
                runOnJS(handleSeek)(Math.max(0, currentTime - 10));
                rewindOpacity.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 500 }));
            }
        });

    const doubleTapRight = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(DOUBLE_TAP_DELAY)
        .onEnd((e) => {
            if (e.x > SCREEN_WIDTH * 0.65) {
                runOnJS(handleSeek)(Math.min(duration, currentTime + 10));
                forwardOpacity.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 500 }));
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

    const panVolume = Gesture.Pan()
        .onUpdate((e) => {
            if (e.x > SCREEN_WIDTH * 0.7) {
                const delta = -e.velocityY / 5000;
                let newVolume = volume + delta;
                newVolume = Math.max(0, Math.min(1, newVolume));
                runOnJS(setVolume)(newVolume);
                volumeOpacity.value = withTiming(1, { duration: 100 });
            }
        })
        .onFinalize(() => {
            volumeOpacity.value = withTiming(0, { duration: 500 });
        });

    const taps = Gesture.Exclusive(doubleTapLeft, doubleTapRight, doubleTapCenter, singleTap);
    // Combine pinch with others. Pinch should probably be simultaneous or race?
    // Usually pinch can happen anytime.
    const gestures = Gesture.Simultaneous(taps, longPress, panVolume, pinch);

    // ... existing styles ...
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
        transform: [{ scale: scale.value }]
    }));

    return (
        <GestureHandlerRootView style={[{ flex: 1, backgroundColor: 'black' }, style]}>
            <GestureDetector gesture={gestures}>
                <View className="flex-1 justify-center items-center overflow-hidden">
                    <Animated.View style={[StyleSheet.absoluteFill, videoAnimatedStyle]}>
                        <Video
                            ref={videoRef}
                            source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }}
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

                    {/* Overlay Feedback Icons */}
                    <Animated.View style={[styles.feedbackIcon, styles.leftFeedback, rewindStyle]}>
                        <RotateCcw size={40} color="white" />
                        <Text className="text-white font-bold">-10s</Text>
                    </Animated.View>

                    <Animated.View style={[styles.feedbackIcon, styles.rightFeedback, forwardStyle]}>
                        <RotateCw size={40} color="white" />
                        <Text className="text-white font-bold">+10s</Text>
                    </Animated.View>

                    <Animated.View style={[styles.centerFeedback, speedMessageStyle]}>
                        <Text className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-full">2x Speed</Text>
                    </Animated.View>

                     <Animated.View style={[styles.volumeIndicator, volumeStyle]}>
                        {volume === 0 ? <VolumeX size={24} color="white" /> : <Volume2 size={24} color="white" />}
                        <View className="w-1 h-20 bg-gray-600 ml-2 rounded-full overflow-hidden justify-end">
                            <View style={{ height: `${volume * 100}%` }} className="w-full bg-white" />
                        </View>
                    </Animated.View>

                    {/* Controls Overlay */}
                    <Animated.View style={[StyleSheet.absoluteFill, styles.controlsContainer, controlsStyle]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
                        {/* Center Play/Pause */}
                        <View className="flex-1 justify-center items-center">
                            {isBuffering ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <View className="bg-black/40 rounded-full p-4">
                                    {paused ? (
                                        <Play size={48} color="white" fill="white" onPress={togglePlayPause} />
                                    ) : (
                                        <Pause size={48} color="white" fill="white" onPress={togglePlayPause} />
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Bottom Bar */}
                        <View className="bg-black/60 px-4 py-2 pb-6">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-white font-medium">{formatTime(currentTime)}</Text>
                                <Text className="text-white font-medium">{formatTime(duration)}</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={duration}
                                value={currentTime}
                                onSlidingComplete={handleSeek}
                                minimumTrackTintColor="#FFFFFF"
                                maximumTrackTintColor="#FFFFFF50"
                                thumbTintColor="#FFFFFF"
                            />
                        </View>
                    </Animated.View>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
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
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
});
