import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, fullName }: SignUpParams) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to .env.local.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn({ email, password }: SignInParams) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to .env.local.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPasswordForEmail(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to .env.local.');
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to .env.local.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return data;
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  },
};
