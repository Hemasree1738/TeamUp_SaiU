import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Github,
  Linkedin,
  ExternalLink,
  Code2,
  GraduationCap,
  Clock,
  ShieldAlert,
  Ban,
  MessageSquare,
  UserPlus,
  Check,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { connectionService } from '../services/connectionService';
import { messageService } from '../services/messageService';
import { Profile, Skill } from '../types/database.types';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
    requestId?: string;
  }>({ status: 'none' });

  // Moderation state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [profileData, profileSkills] = await Promise.all([
          profileService.getProfile(id),
          profileService.getProfileSkills(id),
        ]);

        setStudent(profileData);
        setSkills(profileSkills);

        if (user && id) {
          const status = await connectionService.getConnectionStatus(user.id, id);
          setConnStatus(status);
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  const handleSendConnection = async () => {
    if (!user || !id) return;
    try {
      const req = await connectionService.sendConnectionRequest(user.id, id);
      setConnStatus({ status: 'pending_sent', requestId: req.id });
    } catch (err: any) {
      alert(err.message || 'Failed to send request.');
    }
  };

  const handleAcceptConnection = async () => {
    if (!connStatus.requestId) return;
    try {
      await connectionService.acceptConnectionRequest(connStatus.requestId);
      setConnStatus({ status: 'connected' });
    } catch (err: any) {
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleStartMessage = async () => {
    if (!user || !id) return;
    try {
      const convId = await messageService.getOrCreateConversation(user.id, id);
      navigate(`/messages?conversation=${convId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation.');
    }
  };

  const handleBlockUser = async () => {
    if (!user || !id) return;
    if (window.confirm('Are you sure you want to block this student? You will no longer see each other or exchange messages.')) {
      try {
        await connectionService.blockUser(user.id, id);
        alert('Student has been blocked.');
        navigate('/students');
      } catch (err: any) {
        alert(err.message || 'Failed to block user.');
      }
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      await connectionService.reportEntity(user.id, {
        reported_user_id: id,
        reason: reportReason.trim(),
      });
      alert('Report submitted. Campus moderators will review it.');
      setIsReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading student profile..." />;
  }

  if (!student) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Student Not Found</h2>
        <p className="text-xs text-slate-400">The requested profile does not exist or has been removed.</p>
        <Link to="/students">
          <Button variant="outline" size="sm">
            Back to Discovery
          </Button>
        </Link>
      </div>
    );
  }

  const isSelf = user?.id === student.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-campus-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center font-extrabold text-2xl text-white shadow-glow">
              {student.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                student.full_name?.[0] || 'S'
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {student.full_name}
                </h1>
                <Badge size="sm" variant="slate">
                  {student.year_of_study}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-campus-primary mt-0.5">
                {student.title || 'Campus Member'}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{student.school} &bull; {student.degree}</span>
              </p>
            </div>
          </div>

          {/* Action button */}
          {!isSelf && (
            <div className="flex items-center gap-2 self-stretch sm:self-center">
              {connStatus.status === 'connected' ? (
                <Button
                  onClick={handleStartMessage}
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                >
                  Send Message
                </Button>
              ) : connStatus.status === 'pending_sent' ? (
                <Button
                  variant="outline"
                  disabled
                  leftIcon={<Clock className="w-4 h-4 text-amber-400" />}
                >
                  Request Pending
                </Button>
              ) : connStatus.status === 'pending_received' ? (
                <Button
                  onClick={handleAcceptConnection}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Accept Request
                </Button>
              ) : (
                <Button
                  onClick={handleSendConnection}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Connect
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {student.bio && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {student.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-campus-primary" />
            <span>Skills &amp; Strengths ({skills.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((sk) => (
              <Badge
                key={sk.id}
                variant={sk.category === 'technical' ? 'indigo' : 'violet'}
              >
                {sk.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Project Interests */}
        {student.project_interests && student.project_interests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Passions &amp; Project Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {student.project_interests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Academic & Commitment metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-campus-border text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Availability</span>
            <span className="text-slate-200 font-medium">{student.availability || 'Flexible'}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Department / School</span>
            <span className="text-slate-200 font-medium">{student.school}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Pronouns / Gender</span>
            <span className="text-slate-200 font-medium">{student.gender || 'Not specified'}</span>
          </div>
        </div>

        {/* Verified Links */}
        <div className="pt-4 border-t border-campus-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {student.github_url && (
              <a
                href={student.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            )}
            {student.linkedin_url && (
              <a
                href={student.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-blue-400" />
                <span>LinkedIn</span>
              </a>
            )}
            {student.portfolio_url && (
              <a
                href={student.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Portfolio</span>
              </a>
            )}
          </div>

          {/* Report & Block actions */}
          {!isSelf && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report</span>
              </button>
              <button
                onClick={handleBlockUser}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Block</span>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Student Profile"
        description="Help maintain a safe, professional university collaboration space."
      >
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reason for Report
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the violation (e.g. impersonation, harassment, academic dishonesty, spam)..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-campus-border p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isReporting}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
