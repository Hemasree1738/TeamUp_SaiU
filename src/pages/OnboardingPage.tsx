import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Briefcase,
  GraduationCap,
  Link2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Sparkles,
  Github,
  Linkedin,
  Globe,
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
  suggestTitleFromSkills,
} from '../lib/constants';

export const OnboardingPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Skill state
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState<SkillCategory>('technical');
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  // Step B: Title
  const [title, setTitle] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');

  // Step C: Academic Details
  const [school, setSchool] = useState<string>(SCHOOL_OPTIONS[0]);
  const [customSchool, setCustomSchool] = useState('');
  const [degree, setDegree] = useState('B.S. Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState<string>(YEAR_OF_STUDY_OPTIONS[0]);
  const [bio, setBio] = useState('');
  const [projectInterests, setProjectInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>(AVAILABILITY_OPTIONS[0]);
  const [gender, setGender] = useState<string>('Prefer not to say');

  // Step D: Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [kaggleUrl, setKaggleUrl] = useState('');
  const [hackerrankUrl, setHackerrankUrl] = useState('');

  // Load existing skills catalogue
  useEffect(() => {
    profileService
      .getAllSkills()
      .then((skills) => {
        setAllSkills(skills);
        setIsLoadingSkills(false);
      })
      .catch((err) => {
        console.error('Error fetching skills:', err);
        setIsLoadingSkills(false);
      });
  }, []);

  // Initialize from existing profile data if available
  useEffect(() => {
    if (profile) {
      if (profile.title) setTitle(profile.title);
      if (profile.school) {
        if ((SCHOOL_OPTIONS as readonly string[]).includes(profile.school)) {
          setSchool(profile.school);
        } else {
          setSchool('Other');
          setCustomSchool(profile.school);
        }
      }
      if (profile.degree) setDegree(profile.degree);
      if (profile.year_of_study) setYearOfStudy(profile.year_of_study);
      if (profile.bio) setBio(profile.bio);
      if (profile.project_interests) setProjectInterests(profile.project_interests);
      if (profile.availability) setAvailability(profile.availability);
      if (profile.gender) setGender(profile.gender);
      if (profile.github_url) setGithubUrl(profile.github_url);
      if (profile.linkedin_url) setLinkedinUrl(profile.linkedin_url);
      if (profile.portfolio_url) setPortfolioUrl(profile.portfolio_url);
      if (profile.leetcode_url) setLeetcodeUrl(profile.leetcode_url);
      if (profile.kaggle_url) setKaggleUrl(profile.kaggle_url);
      if (profile.hackerrank_url) setHackerrankUrl(profile.hackerrank_url);
    }
  }, [profile]);

  // Suggest title whenever selected skills change
  useEffect(() => {
    const skillNames = selectedSkills.map((s) => s.name);
    const suggestion = suggestTitleFromSkills(skillNames);
    setSuggestedTitle(suggestion);
    if (!title || title === suggestedTitle) {
      setTitle(suggestion);
    }
  }, [selectedSkills]);

  // Skill toggle
  const handleToggleSkill = (skill: Skill) => {
    if (selectedSkills.some((s) => s.id === skill.id)) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Add custom skill
  const handleAddCustomSkill = async () => {
    const trimmed = skillSearch.trim();
    if (!trimmed) return;

    try {
      const newSkill = await profileService.createSkill(trimmed, customSkillCategory);
      if (!allSkills.some((s) => s.id === newSkill.id)) {
        setAllSkills([...allSkills, newSkill]);
      }
      if (!selectedSkills.some((s) => s.id === newSkill.id)) {
        setSelectedSkills([...selectedSkills, newSkill]);
      }
      setSkillSearch('');
    } catch (err: any) {
      console.error('Failed to add custom skill:', err);
    }
  };

  // Project interest toggle
  const handleToggleInterest = (interest: string) => {
    if (projectInterests.includes(interest)) {
      setProjectInterests(projectInterests.filter((i) => i !== interest));
    } else {
      setProjectInterests([...projectInterests, interest]);
    }
  };

  // Validations per step
  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (selectedSkills.length === 0) {
        setErrorMessage('Please select at least 1 technical or soft skill to continue.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!title.trim()) {
        setErrorMessage('Please accept the suggested title or enter your custom title.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (school === 'Other' && !customSchool.trim()) {
        setErrorMessage('Please specify your school/department name.');
        return;
      }
      if (!degree.trim()) {
        setErrorMessage('Please enter your degree or program name.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleFinish = async () => {
    setErrorMessage(null);

    // URL validations for required GitHub and LinkedIn
    if (!githubUrl.trim()) {
      setErrorMessage('GitHub profile URL is required.');
      return;
    }
    if (!linkedinUrl.trim()) {
      setErrorMessage('LinkedIn profile URL is required.');
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(githubUrl.trim())) {
      setErrorMessage('Please provide a valid GitHub URL (including https://).');
      return;
    }
    if (!urlPattern.test(linkedinUrl.trim())) {
      setErrorMessage('Please provide a valid LinkedIn URL (including https://).');
      return;
    }

    if (!user) {
      setErrorMessage('You must be signed in to save your profile.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalSchool = school === 'Other' ? customSchool.trim() : school;
      const skillIds = selectedSkills.map((s) => s.id);

      await profileService.completeOnboarding(
        user.id,
        {
          title: title.trim(),
          school: finalSchool,
          degree: degree.trim(),
          year_of_study: yearOfStudy,
          bio: bio.trim(),
          project_interests: projectInterests,
          availability,
          gender,
          github_url: githubUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
          portfolio_url: portfolioUrl.trim() || null,
          leetcode_url: leetcodeUrl.trim() || null,
          kaggle_url: kaggleUrl.trim() || null,
          hackerrank_url: hackerrankUrl.trim() || null,
        },
        skillIds
      );

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-campus-dark text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Let's set up your profile ✨</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tell us a bit about yourself
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This helps others know what you're about — your skills, your vibe, and what kind of projects you're into.
          </p>
        </div>

        {/* Multi-step progress indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, label: 'Your Skills', icon: Code2 },
            { step: 2, label: 'Your Role', icon: Briefcase },
            { step: 3, label: 'Your Story', icon: GraduationCap },
            { step: 4, label: 'Your Work', icon: Link2 },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                className={`p-3 rounded-xl border flex flex-col items-center sm:flex-row sm:items-center gap-2.5 transition-all ${
                  isCurrent
                    ? 'bg-campus-primary/15 border-campus-primary/40 text-campus-primary shadow-glow-sm'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-campus-card border-campus-border text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-campus-primary text-white'
                      : isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                    Step {item.step}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Cards */}
        <Card className="p-6 sm:p-8">
          {/* STEP 1: SKILLS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">What are you good at? 💡</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pick the skills you use and love — this is how teammates will know you're the right fit.
                </p>
              </div>

              {/* Selected skills pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Selected Skills ({selectedSkills.length})
                </label>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-campus-border min-h-[48px] flex flex-wrap gap-2 items-center">
                  {selectedSkills.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Nothing selected yet — click any skill below to add it!
                    </span>
                  ) : (
                    selectedSkills.map((s) => (
                      <Badge
                        key={s.id}
                        variant={s.category === 'technical' ? 'indigo' : 'violet'}
                        onRemove={() => handleToggleSkill(s)}
                      >
                        {s.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Search and add custom skill */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search skills (e.g. Python, React, Leadership)..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                {skillSearch.trim() && !allSkills.some((s) => s.name.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                  <div className="flex items-center gap-2">
                    <select
                      value={customSkillCategory}
                      onChange={(e) => setCustomSkillCategory(e.target.value as SkillCategory)}
                      className="rounded-xl bg-campus-card border border-campus-border py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="technical">Technical</option>
                      <option value="soft">Soft Skill</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomSkill}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add &ldquo;{skillSearch.trim()}&rdquo;
                    </Button>
                  </div>
                )}
              </div>

              {/* Available skill catalogue */}
              {isLoadingSkills ? (
                <LoadingSpinner message="Loading skills catalogue..." />
              ) : (
                <div className="space-y-4">
                  {/* Technical */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                      Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills
                        .filter((s) => s.category === 'technical')
                        .map((s) => {
                          const isSelected = selectedSkills.some((sel) => sel.id === s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleToggleSkill(s)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-campus-primary text-white border-campus-primary shadow-glow-sm font-semibold'
                                  : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Soft skills */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                      Soft & Collaboration Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills
                        .filter((s) => s.category === 'soft')
                        .map((s) => {
                          const isSelected = selectedSkills.some((sel) => sel.id === s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleToggleSkill(s)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-500 shadow-glow-violet font-semibold'
                                  : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROFESSIONAL TITLE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">What should people call you? 👤</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pick a title that captures what you do or what you're becoming.
                </p>
              </div>

              {/* Suggestion Card */}
              {suggestedTitle && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Smart Role Match
                    </span>
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{suggestedTitle}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                        Fits your selected skills
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Suggested based on your chosen skills — feel free to customize or choose whatever fits you best!
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTitle(suggestedTitle)}
                  >
                    Use This Title
                  </Button>
                </div>
              )}

              <Input
                label="How would you describe yourself?"
                placeholder="e.g. Full-Stack Developer, ML Enthusiast, UI/UX Designer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helperText="You can always change this later in your profile."
                required
              />

              {/* Quick suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Popular Titles
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Frontend Developer',
                    'Backend Developer',
                    'Full-Stack Developer',
                    'Data Analyst',
                    'Machine Learning Enthusiast',
                    'UI/UX Designer',
                    'Cloud/DevOps Enthusiast',
                    'Cybersecurity Researcher',
                  ].map((popTitle) => (
                    <button
                      key={popTitle}
                      type="button"
                      onClick={() => setTitle(popTitle)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        title === popTitle
                          ? 'bg-campus-primary text-white border-campus-primary font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {popTitle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Academic & Availability Details</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Connect with peers from your school and align on project commitment levels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* School */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    School / Department
                  </label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                  >
                    {SCHOOL_OPTIONS.map((sch) => (
                      <option key={sch} value={sch}>
                        {sch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year of study */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Year of Study
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                  >
                    {YEAR_OF_STUDY_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom school if 'Other' selected */}
              {school === 'Other' && (
                <Input
                  label="Specify Your School / Department"
                  placeholder="e.g. School of Environmental Science"
                  value={customSchool}
                  onChange={(e) => setCustomSchool(e.target.value)}
                  required
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Degree / Major"
                  placeholder="e.g. B.S. Computer Science, BBA Finance"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Availability & Commitment
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                  >
                    {AVAILABILITY_OPTIONS.map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Gender (Self-reported, never inferred) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Gender (Optional & Self-Reported)
                  </label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Used purely for personal preference filters. Never inferred from names or photos.
                </p>
              </div>

              {/* Short Bio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Short Bio (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what you love building, hackathons you enjoy, or what kind of project team you seek..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl bg-campus-card border border-campus-border p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
                />
              </div>

              {/* Project interests */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project Interests & Domains
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_PROJECT_INTERESTS.map((interest) => {
                    const isSelected = projectInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleToggleInterest(interest)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-campus-primary text-white border-campus-primary font-semibold'
                            : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PROFESSIONAL LINKS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Show off what you've built 👀</h2>
                <p className="text-xs text-slate-400 mt-1">
                  GitHub and LinkedIn help teammates see your work upfront — no résumé needed.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="GitHub Profile URL (Required)"
                  placeholder="https://github.com/yourusername"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  leftIcon={<Github className="w-4 h-4" />}
                  required
                />

                <Input
                  label="LinkedIn Profile URL (Required)"
                  placeholder="https://linkedin.com/in/yourusername"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  leftIcon={<Linkedin className="w-4 h-4" />}
                  required
                />

                <div className="pt-2 border-t border-campus-border">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Optional Portfolio & Coding Handles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Personal Portfolio / Website"
                      placeholder="https://yourportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      leftIcon={<Globe className="w-4 h-4" />}
                    />
                    <Input
                      label="LeetCode Profile"
                      placeholder="https://leetcode.com/username"
                      value={leetcodeUrl}
                      onChange={(e) => setLeetcodeUrl(e.target.value)}
                    />
                    <Input
                      label="Kaggle Profile"
                      placeholder="https://kaggle.com/username"
                      value={kaggleUrl}
                      onChange={(e) => setKaggleUrl(e.target.value)}
                    />
                    <Input
                      label="HackerRank Profile"
                      placeholder="https://hackerrank.com/username"
                      value={hackerrankUrl}
                      onChange={(e) => setHackerrankUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-campus-border flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {currentStep + 1}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Finish & Go to Dashboard 🎉
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
