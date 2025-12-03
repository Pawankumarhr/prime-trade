'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { tasksAPI, analyticsAPI, insightsAPI } from '../../lib/api';

// Floating Orbs Background Component
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="floating-orb w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl absolute -top-48 -left-48 animate-float"></div>
    <div className="floating-orb w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl absolute top-1/3 -right-40 animate-float-delayed"></div>
    <div className="floating-orb w-64 h-64 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl absolute bottom-20 left-1/4 animate-float"></div>
  </div>
);

// Glass Card Component
const GlassCard = ({ children, className = '', hover = true }) => (
  <div className={`glass rounded-2xl p-6 ${hover ? 'card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Stat Card with Gradient Icon
const StatCard = ({ title, value, icon, gradient, trend }) => (
  <GlassCard className="relative overflow-hidden group">
    <div className="glow-line"></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
          </p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  </GlassCard>
);

// Priority Badge
const PriorityBadge = ({ priority }) => {
  const colors = {
    high: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25',
    medium: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
    low: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[priority] || colors.low}`}>
      {priority?.toUpperCase()}
    </span>
  );
};

// Status Badge
const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    'in-progress': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    done: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  };
  const icons = {
    pending: '○',
    'in-progress': '◐',
    done: '●'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colors[status]}`}>
      <span className="animate-pulse">{icons[status]}</span>
      {status?.replace('-', ' ').toUpperCase()}
    </span>
  );
};

// Task Item Component with Animations
const TaskItem = ({ task, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localTask, setLocalTask] = useState(task);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  const statusOrder = ['pending', 'in-progress', 'done'];

  const isFutureTask = () => {
    if (!localTask.due_date) return false;
    const dueDate = new Date(localTask.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate > today;
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'done' && isFutureTask()) {
      setPendingStatus(newStatus);
      setShowConfirm(true);
      return;
    }
    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus) => {
    const previousTask = { ...localTask };
    setLocalTask(prev => ({ ...prev, status: newStatus }));
    setIsUpdating(true);

    try {
      await onUpdate(localTask.id, { status: newStatus });
    } catch (error) {
      setLocalTask(previousTask);
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
      setPendingStatus(null);
    }
  };

  const handleCheckboxToggle = () => {
    const newStatus = localTask.status === 'done' ? 'pending' : 'done';
    handleStatusChange(newStatus);
  };

  const cycleStatus = () => {
    const currentIndex = statusOrder.indexOf(localTask.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    handleStatusChange(statusOrder[nextIndex]);
  };

  return (
    <>
      <div className={`glass rounded-xl p-4 card-hover transition-all duration-300 ${isUpdating ? 'opacity-70' : ''} ${localTask.status === 'done' ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={handleCheckboxToggle}
            disabled={isUpdating}
            className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
              localTask.status === 'done'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white'
                : 'border-gray-500 hover:border-purple-500 hover:bg-purple-500/20'
            }`}
          >
            {localTask.status === 'done' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`font-semibold text-white ${localTask.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                {localTask.title}
              </h3>
              <PriorityBadge priority={localTask.priority} />
              <button onClick={cycleStatus} disabled={isUpdating}>
                <StatusBadge status={localTask.status} />
              </button>
            </div>

            {localTask.description && (
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{localTask.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              {localTask.due_date && (
                <span className="flex items-center gap-1">
                  📅 {new Date(localTask.due_date).toLocaleDateString()}
                </span>
              )}
              {localTask.completed_at && (
                <span className="flex items-center gap-1 text-emerald-400">
                  ✓ Completed {new Date(localTask.completed_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(localTask.id)}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-300">{new Date(localTask.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2 text-gray-300">{new Date(localTask.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="glass rounded-2xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Complete Future Task?</h3>
              <p className="text-gray-400 mb-6">
                This task is due on <strong className="text-white">{new Date(localTask.due_date).toLocaleDateString()}</strong>. 
                Are you sure you want to mark it as complete?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setShowConfirm(false); setPendingStatus(null); }}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeStatusChange(pendingStatus)}
                  className="btn-primary px-6 py-2"
                >
                  Yes, Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Create Task Modal
const CreateTaskModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setFormData({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="glass rounded-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter task title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="Enter task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-3">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, analyticsData, insightsData] = await Promise.all([
        tasksAPI.getAll(filters),
        analyticsAPI.get(),
        insightsAPI.get()
      ]);
      setTasks(tasksData);
      setAnalytics(analyticsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleCreateTask = async (taskData) => {
    const newTask = await tasksAPI.create(taskData);
    setTasks(prev => [newTask, ...prev]);
    fetchData(); // Refresh analytics
  };

  const handleUpdateTask = async (id, updates) => {
    await tasksAPI.update(id, updates);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    fetchData(); // Refresh analytics
  };

  const handleDeleteTask = async (id) => {
    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    fetchData(); // Refresh analytics
  };

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'due_date' || sortBy === 'created_at') {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    }
    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, <span className="text-gradient">{user.name || 'User'}</span> 👋
                </h1>
                <p className="text-gray-400 text-sm mt-1">Here's what's happening with your tasks today</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tasks"
              value={analytics?.total_tasks || 0}
              icon="📋"
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              title="Completed"
              value={analytics?.completed_tasks || 0}
              icon="✅"
              gradient="from-emerald-500 to-teal-500"
              trend={12}
            />
            <StatCard
              title="In Progress"
              value={analytics?.status_breakdown?.['in-progress'] || 0}
              icon="⚡"
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Pending"
              value={analytics?.status_breakdown?.pending || 0}
              icon="⏳"
              gradient="from-amber-500 to-orange-500"
            />
          </div>

          {/* Insights Section */}
          {insights && (
            <GlassCard className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold text-gradient">{insights.completion_rate?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-red-400">{insights.overdue_count || 0}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Due This Week</p>
                  <p className="text-2xl font-bold text-amber-400">{insights.due_this_week || 0}</p>
                </div>
              </div>
              {insights.suggestion && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <p className="text-gray-300">
                    <span className="text-purple-400 font-semibold">AI Suggestion:</span> {insights.suggestion}
                  </p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Filters & Search */}
          <GlassCard className="mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field w-auto"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input-field w-auto"
              >
                <option value="">All Priority</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="input-field w-auto"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="due_date-asc">Due Date ↑</option>
                <option value="due_date-desc">Due Date ↓</option>
                <option value="priority-desc">Priority ↓</option>
              </select>
            </div>
          </GlassCard>

          {/* Tasks List */}
          <div className="space-y-4">
            {sortedTasks.length === 0 ? (
              <GlassCard className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">No tasks found</h3>
                <p className="text-gray-400 mb-6">Create your first task to get started!</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-2">
                  Create Task
                </button>
              </GlassCard>
            ) : (
              sortedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </main>

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      </div>
    </div>
  );
}
