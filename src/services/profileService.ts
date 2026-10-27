import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile, Skill, SkillCategory } from '../types/database.types';

export interface StudentFilters {
  search?: string;
  category?: SkillCategory | 'all';
  skillId?: string;
  school?: string;
  year?: string;
  gender?: string;
  availability?: string;
  projectInterest?: string;
  currentUserId?: string;
  page?: number;
  pageSize?: number;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllSkills(): Promise<Skill[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createSkill(name: string, category: SkillCategory): Promise<Skill> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    // Check if exists first
    const { data: existing } = await supabase
      .from('skills')
      .select('*')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
      .from('skills')
      .insert({
        name: name.trim(),
        category,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfileSkills(profileId: string): Promise<Skill[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profile_skills')
      .select('skill:skills(*)')
      .eq('profile_id', profileId);

    if (error) throw error;
    return (data || []).map((row: any) => row.skill).filter(Boolean);
  },

  async setProfileSkills(profileId: string, skillIds: string[]): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Delete existing profile skills
    const { error: deleteError } = await supabase
      .from('profile_skills')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) throw deleteError;

    if (skillIds.length === 0) return;

    // Insert new
    const inserts = skillIds.map((skillId) => ({
      profile_id: profileId,
      skill_id: skillId,
    }));

    const { error: insertError } = await supabase
      .from('profile_skills')
      .insert(inserts);

    if (insertError) throw insertError;
  },

  async completeOnboarding(
    userId: string,
    profileData: Partial<Profile>,
    skillIds: string[]
  ): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    // Update profile
    const updated = await this.updateProfile(userId, {
      ...profileData,
      is_onboarded: true,
    });

    // Save skills
    await this.setProfileSkills(userId, skillIds);

    return updated;
  },

  async getStudents(filters: StudentFilters): Promise<{ students: (Profile & { skills?: Skill[] })[]; total: number }> {
    if (!isSupabaseConfigured) {
      return { students: [], total: 0 };
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_onboarded', true);

    // Exclude current user
    if (filters.currentUserId) {
      query = query.neq('id', filters.currentUserId);
    }

    // School filter
    if (filters.school && filters.school !== 'all') {
      query = query.eq('school', filters.school);
    }

    // Year filter
    if (filters.year && filters.year !== 'all') {
      query = query.eq('year_of_study', filters.year);
    }

    // Gender filter (optional)
    if (filters.gender && filters.gender !== 'all') {
      query = query.eq('gender', filters.gender);
    }

    // Availability filter
    if (filters.availability && filters.availability !== 'all') {
      query = query.eq('availability', filters.availability);
    }

    // Text search in full_name, title, bio
    if (filters.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`full_name.ilike.${term},title.ilike.${term},bio.ilike.${term}`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const studentList: (Profile & { skills?: Skill[] })[] = data || [];

    // Fetch skills for these students
    if (studentList.length > 0) {
      const studentIds = studentList.map((s) => s.id);
      const { data: skillsData } = await supabase
        .from('profile_skills')
        .select('profile_id, skill:skills(*)')
        .in('profile_id', studentIds);

      const skillMap = new Map<string, Skill[]>();
      (skillsData || []).forEach((row: any) => {
        if (row.skill) {
          const arr = skillMap.get(row.profile_id) || [];
          arr.push(row.skill);
          skillMap.set(row.profile_id, arr);
        }
      });

      studentList.forEach((st) => {
        st.skills = skillMap.get(st.id) || [];
      });

      // Filter by skill if requested
      if (filters.skillId && filters.skillId !== 'all') {
        const filtered = studentList.filter((st) =>
          st.skills?.some((sk) => sk.id === filters.skillId)
        );
        return { students: filtered, total: filtered.length };
      }
    }

    return {
      students: studentList,
      total: count || 0,
    };
  },
};
