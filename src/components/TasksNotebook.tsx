import React, { useState } from 'react';
import { TaskItem, NoteCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, StickyNote, Plus, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface TasksNotebookProps {
  tasks: TaskItem[];
  notes: NoteCard[];
  isHighlighted: boolean;
  activeTab: 'tasks' | 'notes';
  onTabChange: (tab: 'tasks' | 'notes') => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: Omit<NoteCard, 'id' | 'createdAt'>) => void;
}

export const TasksNotebook: React.FC<TasksNotebookProps> = ({
  tasks,
  notes,
  isHighlighted,
  activeTab,
  onTabChange,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onDeleteNote,
  onAddNote,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('დღეს');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  // Note form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#FEF08A'); // yellow

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle.trim(),
      due_time: taskDue,
      priority: taskPriority,
    });
    setTaskTitle('');
    setIsAdding(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    onAddNote({
      title: noteTitle.trim() || 'ჩანაწერი',
      content: noteContent.trim(),
      color: noteColor,
    });
    setNoteTitle('');
    setNoteContent('');
    setIsAdding(false);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'მაღალი', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'medium':
        return { label: 'საშუალო', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: 'დაბალი', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <motion.div
      id="tasks-notebook"
      animate={isHighlighted ? {
        scale: [1, 1.03, 1],
        boxShadow: "0 0 35px rgba(245, 158, 11, 0.5)",
        borderColor: "rgba(245, 158, 11, 0.8)",
      } : {}}
      transition={{ duration: 0.6 }}
      className={`relative w-full rounded-2xl bg-slate-900/80 backdrop-blur-xl border transition-all duration-300 shadow-xl overflow-hidden flex flex-col ${
        isHighlighted ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700/60'
      }`}
    >
      {/* Header with Navigation Tabs */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-700/50">
          <button
            onClick={() => onTabChange('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>ამოცანები</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {tasks.filter(t => !t.completed).length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>ჩანაწერები</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {notes.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-colors"
          title="ახლის დამატება"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-slate-800/90 border-b border-slate-700 text-xs"
          >
            {activeTab === 'tasks' ? (
              <form onSubmit={handleCreateTask} className="space-y-2">
                <input
                  type="text"
                  placeholder="ამოცანის შინაარსი..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ვადა (მაგ. დღეს 18:00)"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  />
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="high">მაღალი პრიორიტეტი</option>
                    <option value="medium">საშუალო პრიორიტეტი</option>
                    <option value="low">დაბალი პრიორიტეტი</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium"
                  >
                    დამატება
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateNote} className="space-y-2">
                <input
                  type="text"
                  placeholder="ჩანაწერის სათაური..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
                <textarea
                  placeholder="დაწერე იდეა ან ჩანაწერი..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {['#FEF08A', '#BAE6FD', '#FBCFE8', '#BBF7D0'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          noteColor === color ? 'scale-125 border-white' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      შენახვა
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="p-3 space-y-2 max-h-56 overflow-y-auto custom-scrollbar flex-1">
        {activeTab === 'tasks' ? (
          tasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <CheckSquare className="w-8 h-8 opacity-40" />
              <span>ამოცანების სია ცარიელია</span>
              <span className="text-[11px] text-slate-400">უთხარი ტატოს: „ერთ საათში ვარჯიში შემახსენე“</span>
            </div>
          ) : (
            tasks.map((task) => {
              const priority = getPriorityBadge(task.priority);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                      title={task.completed ? "მონიშვნის მოხსნა" : "შესრულებულად მონიშვნა"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-amber-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{task.due_time}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 transition-all rounded"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })
          )
        ) : (
          /* Notes tab */
          notes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
              <StickyNote className="w-8 h-8 opacity-40" />
              <span>ჩანაწერები არ არის</span>
              <span className="text-[11px] text-slate-400">უთხარი ტატოს: „ჩაიწერე ახალი იდეა“</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{ backgroundColor: `${note.color}15`, borderColor: `${note.color}50` }}
                  className="group relative p-2.5 rounded-xl border backdrop-blur-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-200 truncate">{note.title}</span>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity p-0.5"
                        title="წაშლა"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">{note.content}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-2 block">{note.createdAt}</span>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
};
