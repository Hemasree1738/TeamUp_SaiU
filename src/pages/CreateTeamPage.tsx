import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Plus,
  X,
  Calendar,
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
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/teamService';
import { ProjectType, RecruitingStatus } from '../types/database.types';
import { PROJECT_TYPE_OPTIONS, AVAILABILITY_OPTIONS } from '../lib/constants';

export const CreateTeamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectObjective, setProjectObjective] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('hackathon');
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [commitment, setCommitment] = useState<string>(AVAILABILITY_OPTIONS[0]);
  const [recruitingStatus, setRecruitingStatus] = useState<RecruitingStatus>('open');

  // Open roles
  const [openRoles, setOpenRoles] = useState<string[]>(['Frontend Developer', 'UI/UX Designer']);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Required skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'TypeScript', 'Tailwind CSS']);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddRole = () => {
    const trimmed = newRoleInput.trim();
    if (trimmed && !openRoles.includes(trimmed)) {
      setOpenRoles([...openRoles, trimmed]);
      setNewRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setOpenRoles(openRoles.filter((r) => r !== role));
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      navigate('/login');
      return;
    }

    if (!name.trim() || !description.trim() || !projectObjective.trim()) {
      setErrorMessage('Please provide a team name, description, and project objective.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await teamService.createTeam(user.id, {
        name: name.trim(),
        description: description.trim(),
        project_objective: projectObjective.trim(),
        project_type: projectType,
        max_capacity: Number(maxCapacity),
        deadline: deadline || null,
        commitment,
        recruiting_status: recruitingStatus,
        open_roles: openRoles,
        required_skills: requiredSkills,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        project_url: projectUrl.trim() || null,
        logo_url: null,
      });

      navigate(`/teams/${created.id}`);
    } catch (err: any) {
      console.error('Create team error:', err);
      setErrorMessage(err.message || 'Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-campus-primary" />
          <span>Start a Project Team</span>
        </h1>
        <p className="text-xs text-slate-400">
          Share your project vision, outline the roles you need, and welcome campus collaborators.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Basic details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              1. Project Vision
            </h2>

            <Input
              label="Project or Team Name"
              placeholder="e.g. HealthAI Assistant, EcoGrid Hackathon Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project Category
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                >
                  {PROJECT_TYPE_OPTIONS.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ideal Team Size (Max Spots)
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 5)}
                  className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Elevator Pitch &amp; Summary
              </label>
              <textarea
                rows={3}
                placeholder="Give a quick, exciting overview of what this project is all about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Goals &amp; What You Plan to Build
              </label>
              <textarea
                rows={4}
                placeholder="Describe the problem you're tackling, the tech approach, deliverables, and the milestone you want to reach together..."
                value={projectObjective}
                onChange={(e) => setProjectObjective(e.target.value)}
                className="w-full rounded-xl bg-campus-card border border-campus-border p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
                required
              />
            </div>
          </div>

          {/* Roles & Skills */}
          <div className="space-y-4 pt-4 border-t border-campus-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">
              2. Teammates Needed
            </h2>

            {/* Open Roles */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Open Roles to Fill
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {openRoles.map((role) => (
                  <Badge key={role} variant="indigo" onRemove={() => handleRemoveRole(role)}>
                    {role}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Backend Lead, Cloud Engineer, UX Designer"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRole();
                    }
                  }}
                  className="flex-1 rounded-xl bg-slate-900 border border-campus-border py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddRole}>
                  Add Role
                </Button>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Required Technical / Soft Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {requiredSkills.map((sk) => (
                  <Badge key={sk} variant="violet" onRemove={() => handleRemoveSkill(sk)}>
                    {sk}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PyTorch, React, SQL, Figma"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 rounded-xl bg-slate-900 border border-campus-border py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>
                  Add Skill
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline & Links */}
          <div className="space-y-4 pt-4 border-t border-campus-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              3. Timeline, Commitment & Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Target Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl bg-campus-card border border-campus-border py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-campus-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Expected Commitment
                </label>
                <select
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="GitHub Repo URL"
                placeholder="https://github.com/org/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                leftIcon={<Github className="w-4 h-4" />}
              />
              <Input
                label="LinkedIn / Showcase URL"
                placeholder="https://linkedin.com/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                leftIcon={<Linkedin className="w-4 h-4" />}
              />
              <Input
                label="Competition / Hackathon URL"
                placeholder="https://devpost.com/..."
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                leftIcon={<Globe className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-campus-border flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Launch Team
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
