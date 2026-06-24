import { View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useState } from 'react';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password });
    } catch (e: any) {
      setError(e.message || 'Failed to register');
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
            <Text className="text-center text-3xl font-bold">Create Account</Text>
            <Text className="text-center text-muted-foreground">
              Enter your information to create an account
            </Text>
          </View>

          <View className="space-y-4">
            <View className="space-y-2">
              <Text className="text-sm font-medium">Name</Text>
              <Input placeholder="John Doe" value={name} onChangeText={setName} />
            </View>
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
              <Text className="text-sm font-medium">Password</Text>
              <Input
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

            <Button onPress={handleRegister} disabled={loading} className="w-full">
              <Text>{loading ? 'Creating account...' : 'Sign Up'}</Text>
            </Button>
          </View>

          <View className="flex-row justify-center space-x-1">
            <Text className="text-muted-foreground">Already have an account?</Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text className="font-medium text-primary">Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
