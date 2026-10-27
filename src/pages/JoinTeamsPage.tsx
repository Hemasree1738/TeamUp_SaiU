import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  PlusCircle,
  Users,
  Calendar,
  Briefcase,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { teamService, TeamFilters } from '../services/teamService';
import { Team, ProjectType, RecruitingStatus, Profile } from '../types/database.types';
import { PROJECT_TYPE_OPTIONS } from '../lib/constants';

export const JoinTeamsPage: React.FC = () => {
  const { isConfigured } = useAuth();

  const [teams, setTeams] = useState<(Team & { leader: Profile; membersCount: number })[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [projectType, setProjectType] = useState<ProjectType | 'all'>('all');
  const [recruitingStatus, setRecruitingStatus] = useState<RecruitingStatus | 'all'>('open');
  const [skillFilter, setSkillFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const fetchTeams = async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const filters: TeamFilters = {
        search,
        projectType,
        recruitingStatus,
        skill: skillFilter,
        role: roleFilter,
        page: currentPage,
        pageSize,
      };

      const res = await teamService.getTeams(filters);
      setTeams(res.teams);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [isConfigured, search, projectType, recruitingStatus, skillFilter, roleFilter, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setProjectType('all');
    setRecruitingStatus('open');
    setSkillFilter('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-campus-secondary" />
            <span>Explore Projects &bull; Open Teams</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse hackathons, competitions, research labs, and startup ideas looking for student teammates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teams/create">
            <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
              Start a Project Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search projects by vision, technology stack, or goals..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Dropdown filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-campus-border">
          {/* Project Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Project Types</option>
              {PROJECT_TYPE_OPTIONS.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recruiting status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Recruitment Status
            </label>
            <select
              value={recruitingStatus}
              onChange={(e) => {
                setRecruitingStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Welcoming Teammates</option>
              <option value="closed">Roster Full / Closed</option>
            </select>
          </div>

          {/* Required skill search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Skills Needed
            </label>
            <input
              type="text"
              placeholder="e.g. React, PyTorch, Figma"
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Open role filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Role Looking For
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend, Designer, Lead"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Teams Grid */}
      {isLoading ? (
        <LoadingSpinner message="Discovering active campus projects..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Matching Projects Found"
          description="We couldn't find any teams matching those filters. Why not take the initiative and assemble your own dream team?"
          actionLabel="Start a Project Team"
          onAction={() => (window.location.href = '/teams/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => {
            const isRecruiting = t.recruiting_status === 'open';

            return (
              <Card key={t.id} hoverEffect className="p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          size="sm"
                          variant={
                            t.project_type === 'hackathon'
                              ? 'indigo'
                              : t.project_type === 'research'
                              ? 'emerald'
                              : t.project_type === 'competition'
                              ? 'amber'
                              : 'cyan'
                          }
                        >
                          {t.project_type.replace('_', ' ')}
                        </Badge>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isRecruiting
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isRecruiting ? 'Recruiting' : 'Closed'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-1 hover:text-campus-primary transition-colors">
                        <Link to={`/teams/${t.id}`}>{t.name}</Link>
                      </h3>
                    </div>
                  </div>

                  {/* Objective & Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  {/* Open roles pills */}
                  {t.open_roles && t.open_roles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Open Roles:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.open_roles.slice(0, 3).map((role) => (
                          <span
                            key={role}
                            className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium"
                          >
                            {role}
                          </span>
                        ))}
                        {t.open_roles.length > 3 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{t.open_roles.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills required */}
                  {t.required_skills && t.required_skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Skills Needed:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {t.required_skills.slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta stats */}
                  <div className="pt-2 border-t border-campus-border flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {t.membersCount || 1} / {t.max_capacity} members
                      </span>
                    </div>

                    {t.deadline && (
                      <div className="flex items-center gap-1.5 text-amber-400/90">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {new Date(t.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-5 pt-4 border-t border-campus-border flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Leader: <span className="font-medium text-slate-200">{t.leader?.full_name || 'Student'}</span>
                  </div>

                  <Link to={`/teams/${t.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Team Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
