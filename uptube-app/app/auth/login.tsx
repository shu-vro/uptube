import { View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useState } from 'react';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e: any) {
      setError(e.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6">
        <View className="mx-auto w-full max-w-sm space-y-6">
          <View className="space-y-2">
            <Text className="text-center text-3xl font-bold">Welcome Back</Text>
            <Text className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </Text>
          </View>

          <View className="space-y-4">
            <View className="space-y-2">
              <Text className="text-sm font-medium">Email</Text>
              <Input
                placeholder="m@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View className="space-y-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium">Password</Text>
                <Pressable>
                  <Text className="text-sm text-primary">Forgot password?</Text>
                </Pressable>
              </View>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

            <Button onPress={handleLogin} disabled={loading} className="w-full">
              <Text>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </Button>
          </View>

          <View className="flex-row justify-center space-x-1">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            <Link href="/auth/register" asChild>
              <Pressable>
                <Text className="font-medium text-primary">Sign Up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
