// components/WorkflowInlineForm.tsx
// Sesuai UI: Workflow Name, Related To (row 1), Key Approval Stage (row 2), Stages accordion, Save button
'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

const COLORS = {
    primary: '#3A7AC3', secondary: '#38C0A8',
    error: '#F93232', warning: '#FFC973', success: '#38C0A8', info: '#3A7AC3',
};

const HIGHLIGHT_COLORS = [
    { name: 'Soft Pink', value: '#F48FB1' },
    { name: 'Peach Orange', value: '#FFAB76' },
    { name: 'Sky Blue', value: '#64B5F6' },
    { name: 'Mint Green', value: '#80CBC4' },
    { name: 'Lavender', value: '#CE93D8' },
    { name: 'Lemon Yellow', value: '#FFF176' },
    { name: 'Coral', value: '#EF9A9A' },
];

const ROLES = ['Super Admin', 'Editor', 'Author', 'SEO Manager', 'Viewer'];

interface Stage {
    id?: string;
    name: string;
    rolesAllowed: string[];
    highlightColor: string;
    order: number;
    description?: string;
    collapsed?: boolean;
}

export interface WorkflowFormData {
    name: string;
    relatedTo: string;
    keyApprovalStage: string;
    stages: Stage[];
}

interface Props {
    darkMode: boolean;
    initialData?: Partial<WorkflowFormData>;
    onSubmit: (data: WorkflowFormData) => Promise<void>;
    isLoading: boolean;
    isEdit?: boolean;
}

export default function WorkflowInlineForm({ darkMode, initialData, onSubmit, isLoading, isEdit }: Props) {
    const [name, setName] = useState(initialData?.name || '');
    const [relatedTo, setRelatedTo] = useState(initialData?.relatedTo || '');
    const [keyApproval, setKeyApproval] = useState(initialData?.keyApprovalStage || '');
    const [stages, setStages] = useState<Stage[]>(
        initialData?.stages?.map((s, i) => ({ ...s, collapsed: false, order: s.order ?? i + 1 })) || []
    );

    // Styles
    const hdr: React.CSSProperties = {
        backgroundColor: COLORS.info, color: '#FFFFFF',
        padding: '8px 14px', borderRadius: '8px 8px 0 0',
        fontSize: '13px', fontWeight: 600,
    };
    const inp: React.CSSProperties = {
        width: '100%', padding: '10px 14px',
        border: `1px solid ${darkMode ? '#3F3F52' : '#D1D5DB'}`,
        borderRadius: '0 0 8px 8px',
        backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF',
        color: darkMode ? '#E0E0E0' : '#1E293B',
        fontSize: '14px', outline: 'none',
    };
    const focus = (e: React.FocusEvent<HTMLElement>) => { (e.target as any).style.borderColor = COLORS.primary; };
    const blur = (e: React.FocusEvent<HTMLElement>) => { (e.target as any).style.borderColor = darkMode ? '#3F3F52' : '#D1D5DB'; };

    // Stage helpers
    const addStage = () => setStages(prev => [...prev, {
        name: '', rolesAllowed: [], highlightColor: HIGHLIGHT_COLORS[0].value,
        order: prev.length + 1, description: '', collapsed: false,
    }]);

    const removeStage = (idx: number) => setStages(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));

    const updateStage = (idx: number, patch: Partial<Stage>) => setStages(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

    const toggleRole = (idx: number, role: string) => {
        const roles = stages[idx].rolesAllowed;
        updateStage(idx, { rolesAllowed: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role] });
    };

    const handleSubmit = async () => {
        if (!name.trim()) { alert('Workflow name is required'); return; }
        if (stages.length === 0) { alert('At least one stage is required'); return; }
        if (stages.some(s => !s.name.trim())) { alert('All stages must have a name'); return; }
        await onSubmit({ name, relatedTo, keyApprovalStage: keyApproval, stages });
    };

    const stageOptions = stages.map(s => s.name).filter(Boolean);

    return (
        <div style={{ maxWidth: '900px' }}>
            <div className="space-y-5">

                {/* Row 1 — Workflow Name & Related To */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <div style={hdr}>Workflow Name*</div>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Publishing Article" style={inp} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                        <div style={hdr}>Related To</div>
                        <select value={relatedTo} onChange={e => setRelatedTo(e.target.value)}
                            style={inp} onFocus={focus} onBlur={blur}>
                            <option value="">— Select —</option>
                            <option value="Content Management">Content Management</option>
                            <option value="Media Assets">Media Assets</option>
                            <option value="API Integration">API Integration</option>
                        </select>
                    </div>
                </div>

                {/* Row 2 — Key Approval Stage (half width) */}
                <div style={{ maxWidth: '440px' }}>
                    <div style={hdr}>Key Approval Stage*</div>
                    <select value={keyApproval} onChange={e => setKeyApproval(e.target.value)}
                        style={inp} onFocus={focus} onBlur={blur}>
                        <option value="">Any Stage</option>
                        {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <p className="text-xs mt-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                        Publication of entries is restricted until they are at the correct stage.
                    </p>
                </div>

                {/* Stages accordion */}
                <div className="space-y-3">
                    {stages.map((stage, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border" style={{ borderColor: darkMode ? '#3F3F52' : '#D1D5DB' }}>

                            {/* Stage header */}
                            <div className="flex items-center justify-between px-5 py-3 cursor-pointer"
                                style={{ backgroundColor: darkMode ? '#1E1E2E' : '#F1F5F9' }}
                                onClick={() => updateStage(idx, { collapsed: !stage.collapsed })}>
                                <span className="font-semibold text-sm" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
                                    {stage.name || `Stage ${idx + 1}`}
                                </span>
                                {stage.collapsed
                                    ? <ChevronDown size={18} style={{ color: darkMode ? '#94A3B8' : '#64748B' }} />
                                    : <ChevronUp size={18} style={{ color: darkMode ? '#94A3B8' : '#64748B' }} />
                                }
                            </div>

                            {!stage.collapsed && (
                                <div className="p-5" style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF' }}>
                                    <div className="grid grid-cols-3 gap-5">

                                        {/* Stage Name */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Stage Name*</label>
                                            <input type="text" value={stage.name}
                                                onChange={e => updateStage(idx, { name: e.target.value })}
                                                placeholder="To Do"
                                                style={{ ...inp, borderRadius: '8px' }}
                                                onFocus={focus} onBlur={blur} />
                                        </div>

                                        {/* Roles */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                Roles allowed to edit this stage*
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ROLES.map(role => {
                                                    const active = stage.rolesAllowed.includes(role);
                                                    return (
                                                        <button key={role} type="button" onClick={() => toggleRole(idx, role)}
                                                            className="px-2 py-1 rounded text-xs font-medium transition"
                                                            style={{
                                                                backgroundColor: active ? COLORS.primary : darkMode ? '#3F3F52' : '#F1F5F9',
                                                                color: active ? '#FFFFFF' : darkMode ? '#94A3B8' : '#64748B',
                                                                border: `1px solid ${active ? COLORS.primary : darkMode ? '#3F3F52' : '#D1D5DB'}`,
                                                            }}>
                                                            {role}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {stage.rolesAllowed.length > 0 && (
                                                <p className="text-xs mt-1.5" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
                                                    {stage.rolesAllowed.join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Highlight Color */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                                Highlight Color*
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {HIGHLIGHT_COLORS.map(c => (
                                                    <button key={c.value} type="button" onClick={() => updateStage(idx, { highlightColor: c.value })}
                                                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition"
                                                        style={{
                                                            border: `2px solid ${stage.highlightColor === c.value ? '#1E293B' : 'transparent'}`,
                                                            backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                                                            color: darkMode ? '#94A3B8' : '#64748B',
                                                        }}>
                                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.value }} />
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remove stage */}
                                    <div className="flex justify-end mt-4">
                                        <button type="button" onClick={() => removeStage(idx)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
                                            style={{ color: COLORS.error, backgroundColor: darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2' }}>
                                            <Trash2 size={13} /> Remove Stage
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add Stage */}
                    <button type="button" onClick={addStage}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg text-white transition"
                        style={{ backgroundColor: COLORS.secondary }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                        + Add New Stage
                    </button>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSubmit} disabled={isLoading}
                        className="px-8 py-3 text-white font-bold rounded-lg transition disabled:opacity-50"
                        style={{ backgroundColor: COLORS.secondary }}
                        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                        {isLoading ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}