import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users2,
  Search,
  Filter,
  UserPlus,
  Check,
  Clock,
  MessageSquare,
  Github,
  Linkedin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { profileService, StudentFilters } from '../services/profileService';
import { connectionService } from '../services/connectionService';
import { messageService } from '../services/messageService';
import { Profile, Skill } from '../types/database.types';
import {
  SCHOOL_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
  AVAILABILITY_OPTIONS,
  GENDER_OPTIONS,
  COMMON_PROJECT_INTERESTS,
} from '../lib/constants';

export const FormTeamsPage: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<(Profile & { skills?: Skill[] })[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Connection states keyed by student profile ID
  const [connectionStates, setConnectionStates] = useState<
    Record<string, { status: 'none' | 'pending_sent' | 'pending_received' | 'connected'; requestId?: string }>
  >({});

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Load skills list for filtering
  useEffect(() => {
    profileService.getAllSkills().then(setAllSkills).catch(console.error);
  }, []);

  // Fetch students based on active filters
  const fetchStudents = async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const filters: StudentFilters = {
        search,
        school: selectedSchool !== 'all' ? selectedSchool : undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined,
        skillId: selectedSkill !== 'all' ? selectedSkill : undefined,
        gender: selectedGender !== 'all' ? selectedGender : undefined,
        availability: selectedAvailability !== 'all' ? selectedAvailability : undefined,
        currentUserId: user?.id,
        page: currentPage,
        pageSize,
      };

      const result = await profileService.getStudents(filters);
      setStudents(result.students);
      setTotalCount(result.total);

      // Fetch connection status for returned students
      if (user) {
        const statuses: Record<string, any> = {};
        await Promise.all(
          result.students.map(async (st) => {
            statuses[st.id] = await connectionService.getConnectionStatus(user.id, st.id);
          })
        );
        setConnectionStates(statuses);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [
    user,
    isConfigured,
    search,
    selectedSchool,
    selectedYear,
    selectedSkill,
    selectedGender,
    selectedAvailability,
    currentPage,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSchool('all');
    setSelectedYear('all');
    setSelectedSkill('all');
    setSelectedGender('all');
    setSelectedAvailability('all');
    setSelectedInterest('all');
    setCurrentPage(1);
  };

  const handleSendConnection = async (targetUserId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const req = await connectionService.sendConnectionRequest(user.id, targetUserId);
      setConnectionStates((prev) => ({
        ...prev,
        [targetUserId]: { status: 'pending_sent', requestId: req.id },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to send request.');
    }
  };

  const handleCancelConnection = async (targetUserId: string, requestId?: string) => {
    if (!requestId) return;
    try {
      await connectionService.cancelConnectionRequest(requestId);
      setConnectionStates((prev) => ({
        ...prev,
        [targetUserId]: { status: 'none' },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request.');
    }
  };

  const handleAcceptConnection = async (targetUserId: string, requestId?: string) => {
    if (!requestId) return;
    try {
      await connectionService.acceptConnectionRequest(requestId);
      setConnectionStates((prev) => ({
        ...prev,
        [targetUserId]: { status: 'connected' },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleStartMessage = async (targetUserId: string) => {
    if (!user) return;
    try {
      const convId = await messageService.getOrCreateConversation(user.id, targetUserId);
      navigate(`/messages?conversation=${convId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-campus-primary" />
            <span>Find Teammates &bull; Meet Fellow Builders</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover passionate classmates with complementary skills, explore their past projects, and connect for your next build.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-campus-card px-3 py-1.5 rounded-xl border border-campus-border self-start">
          {totalCount} {totalCount === 1 ? 'classmate discovered' : 'classmates discovered'}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by student name, role, interests, or passions..."
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

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-campus-border">
          {/* School filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              School
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Schools</option>
              {SCHOOL_OPTIONS.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {/* Year filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Year of Study
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Years</option>
              {YEAR_OF_STUDY_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Skill filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => {
                setSelectedSkill(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Skills</option>
              {allSkills.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">Any Availability</option>
              {AVAILABILITY_OPTIONS.map((av) => (
                <option key={av} value={av}>
                  {av}
                </option>
              ))}
            </select>
          </div>

          {/* Gender (Optional filter) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pronouns / Gender (Optional)
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl bg-slate-900 border border-campus-border py-2 px-2.5 text-slate-200 focus:outline-none"
            >
              <option value="all">All Preferences</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grid of Student Cards */}
      {isLoading ? (
        <LoadingSpinner message="Looking for classmates across campus..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No Classmates Found Yet"
          description="We couldn't find anyone matching those specific filters. Try loosening your search criteria or clearing filters to see more peers!"
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((st) => {
            const conn = connectionStates[st.id] || { status: 'none' };

            return (
              <Card key={st.id} hoverEffect className="p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center font-bold text-base text-white shadow-glow-sm overflow-hidden shrink-0">
                        {st.avatar_url ? (
                          <img
                            src={st.avatar_url}
                            alt={st.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          st.full_name?.[0] || 'S'
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/students/${st.id}`}
                          className="font-bold text-sm text-white hover:text-campus-primary transition-colors line-clamp-1"
                        >
                          {st.full_name}
                        </Link>
                        <p className="text-xs font-semibold text-campus-primary line-clamp-1">
                          {st.title || 'Student'}
                        </p>
                      </div>
                    </div>

                    <Badge size="sm" variant="slate">
                      {st.year_of_study}
                    </Badge>
                  </div>

                  {/* School & Degree */}
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p className="line-clamp-1 font-medium text-slate-300">{st.school}</p>
                    {st.degree && <p className="line-clamp-1">{st.degree}</p>}
                  </div>

                  {/* Bio */}
                  {st.bio && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {st.bio}
                    </p>
                  )}

                  {/* Skills tags */}
                  {st.skills && st.skills.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1.5">
                        {st.skills.slice(0, 4).map((sk) => (
                          <Badge
                            key={sk.id}
                            size="sm"
                            variant={sk.category === 'technical' ? 'indigo' : 'violet'}
                          >
                            {sk.name}
                          </Badge>
                        ))}
                        {st.skills.length > 4 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{st.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social / Portfolio links */}
                  <div className="flex items-center gap-2 pt-1">
                    {st.github_url && (
                      <a
                        href={st.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="GitHub Profile"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {st.linkedin_url && (
                      <a
                        href={st.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {st.portfolio_url && (
                      <a
                        href={st.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Portfolio"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 pt-4 border-t border-campus-border flex items-center justify-between gap-2">
                  <Link to={`/students/${st.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Profile
                    </Button>
                  </Link>

                  {/* Connect / Pending / Connected actions */}
                  {conn.status === 'connected' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartMessage(st.id)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                      className="text-xs"
                    >
                      Message
                    </Button>
                  ) : conn.status === 'pending_sent' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelConnection(st.id, conn.requestId)}
                      leftIcon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
                      className="text-xs text-amber-400 hover:text-rose-400"
                      title="Click to cancel pending request"
                    >
                      Pending
                    </Button>
                  ) : conn.status === 'pending_received' ? (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptConnection(st.id, conn.requestId)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Accept
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendConnection(st.id)}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400 px-3">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
