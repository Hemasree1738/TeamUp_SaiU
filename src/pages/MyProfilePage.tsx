import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  Code2,
  GraduationCap,
  Link2,
  Plus,
  Github,
  Linkedin,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { Skill, SkillCategory } from '../types/database.types';
import {
  SCHOOL_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
  AVAILABILITY_OPTIONS,
  GENDER_OPTIONS,
  COMMON_PROJECT_INTERESTS,
} from '../lib/constants';

export const MyProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [school, setSchool] = useState<string>(SCHOOL_OPTIONS[0]);
  const [customSchool, setCustomSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<string>(YEAR_OF_STUDY_OPTIONS[0]);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<string>(AVAILABILITY_OPTIONS[0]);
  const [gender, setGender] = useState<string>('Prefer not to say');
  const [projectInterests, setProjectInterests] = useState<string[]>([]);

  // Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [kaggleUrl, setKaggleUrl] = useState('');
  const [hackerrankUrl, setHackerrankUrl] = useState('');

  // Skills
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState<SkillCategory>('technical');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setFullName(profile.full_name || '');
    setTitle(profile.title || '');
    if ((SCHOOL_OPTIONS as readonly string[]).includes(profile.school)) {
      setSchool(profile.school);
    } else {
      setSchool('Other');
      setCustomSchool(profile.school || '');
    }
    setDegree(profile.degree || '');
    setYearOfStudy(profile.year_of_study || YEAR_OF_STUDY_OPTIONS[0]);
    setBio(profile.bio || '');
    setAvailability(profile.availability || AVAILABILITY_OPTIONS[0]);
    setGender(profile.gender || 'Prefer not to say');
    setProjectInterests(profile.project_interests || []);

    setGithubUrl(profile.github_url || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setPortfolioUrl(profile.portfolio_url || '');
    setLeetcodeUrl(profile.leetcode_url || '');
    setKaggleUrl(profile.kaggle_url || '');
    setHackerrankUrl(profile.hackerrank_url || '');

    // Fetch skills
    Promise.all([profileService.getAllSkills(), profileService.getProfileSkills(profile.id)])
      .then(([all, userSkills]) => {
        setAllSkills(all);
        setSelectedSkills(userSkills);
      })
      .finally(() => setIsLoading(false));
  }, [profile]);

  const handleToggleSkill = (skill: Skill) => {
    if (selectedSkills.some((s) => s.id === skill.id)) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = async () => {
    const trimmed = skillSearch.trim();
    if (!trimmed) return;
    try {
      const created = await profileService.createSkill(trimmed, customSkillCategory);
      if (!allSkills.some((s) => s.id === created.id)) {
        setAllSkills([...allSkills, created]);
      }
      if (!selectedSkills.some((s) => s.id === created.id)) {
        setSelectedSkills([...selectedSkills, created]);
      }
      setSkillSearch('');
    } catch (err: any) {
      console.error('Error adding skill:', err);
    }
  };

  const handleToggleInterest = (interest: string) => {
    if (projectInterests.includes(interest)) {
      setProjectInterests(projectInterests.filter((i) => i !== interest));
    } else {
      setProjectInterests([...projectInterests, interest]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) return;

    if (!githubUrl.trim() || !linkedinUrl.trim()) {
      setErrorMessage('GitHub and LinkedIn URLs are required.');
      return;
    }

    setIsSaving(true);
    try {
      const finalSchool = school === 'Other' ? customSchool.trim() : school;
      const skillIds = selectedSkills.map((s) => s.id);

      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        title: title.trim(),
        school: finalSchool,
        degree: degree.trim(),
        year_of_study: yearOfStudy,
        bio: bio.trim(),
        availability,
        gender,
        project_interests: projectInterests,
        github_url: githubUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        portfolio_url: portfolioUrl.trim() || null,
        leetcode_url: leetcodeUrl.trim() || null,
        kaggle_url: kaggleUrl.trim() || null,
        hackerrank_url: hackerrankUrl.trim() || null,
      });

      await profileService.setProfileSkills(user.id, skillIds);
      await refreshProfile();

      setSuccessMessage('Profile changes saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your profile data..." />;

  const filteredSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-campus-primary" />
          <span>My Campus Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Share your passions, skills, and links so the right collaborators can find you.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core details */}
        <Card className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
            About You
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Role / Title"
              placeholder="e.g. Full Stack Developer, ML Enthusiast, Product Designer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              About Me &amp; What Drives Me
            </label>
            <textarea
              rows={3}
              placeholder="Tell future teammates what you love building and the kinds of projects you're excited about..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl bg-campus-card border border-campus-border p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
            />
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            <span>Skills &amp; Strengths ({selectedSkills.length})</span>
          </h2>

          {/* Selected pills */}
          <div className="p-3 rounded-xl bg-slate-900 border border-campus-border min-h-[48px] flex flex-wrap gap-2 items-center">
            {selectedSkills.map((sk) => (
              <Badge
                key={sk.id}
                variant={sk.category === 'technical' ? 'indigo' : 'violet'}
                onRemove={() => handleToggleSkill(sk)}
              >
                {sk.name}
              </Badge>
            ))}
          </div>

          {/* Search / Add */}
          <div className="flex gap-2">
            <Input
              placeholder="Search or add skill..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
            />
            {skillSearch.trim() && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSkill}>
                Add &ldquo;{skillSearch.trim()}&rdquo;
              </Button>
            )}
          </div>

          {/* Quick catalogue toggle */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {filteredSkills.slice(0, 16).map((sk) => {
              const isSelected = selectedSkills.some((s) => s.id === sk.id);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => handleToggleSkill(sk)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-campus-primary text-white border-campus-primary font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {sk.name}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Academic & Commitment */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Academic & Availability</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                School
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-xs text-slate-100 focus:outline-none"
              >
                {SCHOOL_OPTIONS.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>

            {school === 'Other' && (
              <Input
                label="Custom School Name"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                required
              />
            )}

            <Input
              label="Degree / Major"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-xs text-slate-100 focus:outline-none"
              >
                {YEAR_OF_STUDY_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-xs text-slate-100 focus:outline-none"
              >
                {AVAILABILITY_OPTIONS.map((av) => (
                  <option key={av} value={av}>
                    {av}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pronouns / Gender (Optional)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-xs text-slate-100 focus:outline-none"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Links */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span>Showcase &amp; Portfolio Links</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Profile URL (Required)"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              leftIcon={<Github className="w-4 h-4" />}
              required
            />
            <Input
              label="LinkedIn Profile URL (Required)"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              leftIcon={<Linkedin className="w-4 h-4" />}
              required
            />
            <Input
              label="Personal Portfolio / Website"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              leftIcon={<Globe className="w-4 h-4" />}
            />
            <Input
              label="LeetCode Profile"
              value={leetcodeUrl}
              onChange={(e) => setLeetcodeUrl(e.target.value)}
            />
          </div>
        </Card>

        {/* Save button bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
