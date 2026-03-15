'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Stage {
    id?: string;
    name: string;
    description: string;
    order: number;
    highlightColor: string;
    rolesAllowed: string[];
}

interface WorkflowFormData {
    name: string;
    relatedTo: string;
    keyApprovalStage: string;
    stages: Stage[];
}

interface CreateWorkflowFormProps {
    organizationId: string;
    projectId: string;
    initialData?: any;
    onSubmit: (data: WorkflowFormData) => Promise<void>;
    isLoading: boolean;
    darkMode?: boolean;
}

const RELATED_TO_OPTIONS = [
    { value: 'Content Management', label: 'Content Management' },
    { value: 'Product Management', label: 'Product Management' },
    { value: 'Document Review', label: 'Document Review' },
    { value: 'Blog Publishing', label: 'Blog Publishing' },
    { value: 'HR Recruitment', label: 'HR Recruitment' },
    { value: 'Marketing Campaign', label: 'Marketing Campaign' },
    { value: 'Project Planning', label: 'Project Planning' },
    { value: 'Quality Assurance', label: 'Quality Assurance' },
];

const ROLE_OPTIONS = [
    { value: 'AUTHOR', label: 'Author' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'REVIEWER', label: 'Reviewer' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'VIEWER', label: 'Viewer' },
];

const HIGHLIGHT_COLORS = [
    '#FFB3BA', // Soft Pink
    '#FFCAB0', // Peach Orange
    '#B3E5FC', // Light Blue
    '#C8E6C9', // Light Green
    '#E1BEE7', // Light Purple
    '#FFECB3', // Light Yellow
    '#B2DFDB', // Teal
    '#FFE0B2', // Light Orange
];

const colors = {
    primary: '#3A7AC3',
    secondary: '#38C0A8',
    accent: '#534581',
    error: '#F93232',
    warning: '#FFC973',
    success: '#38C0A8',
    info: '#3A7AC3',
};

export default function CreateWorkflowForm({
    organizationId,
    projectId,
    initialData,
    onSubmit,
    isLoading,
    darkMode = false
}: CreateWorkflowFormProps) {
    const [formData, setFormData] = useState<WorkflowFormData>({
        name: '',
        relatedTo: '',
        keyApprovalStage: '',
        stages: []
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                relatedTo: initialData.relatedTo || '',
                keyApprovalStage: initialData.keyApprovalStage || '',
                stages: (initialData.stages || []).map((stage: any) => ({
                    id: stage.id,
                    name: stage.name || '',
                    description: stage.description || '',
                    order: stage.order || 0,
                    highlightColor: stage.highlightColor || '#FFB3BA',
                    rolesAllowed: stage.rolesAllowed || []
                }))
            });
        }
    }, [initialData]);

    const handleInputChange = (field: keyof WorkflowFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleAddStage = () => {
        const newStage: Stage = {
            name: '',
            description: '',
            order: formData.stages.length + 1,
            highlightColor: HIGHLIGHT_COLORS[formData.stages.length % HIGHLIGHT_COLORS.length],
            rolesAllowed: []
        };

        setFormData(prev => ({
            ...prev,
            stages: [...prev.stages, newStage]
        }));
    };

    const handleRemoveStage = (index: number) => {
        const deletedStageName = formData.stages[index].name;
        const newStages = formData.stages.filter((_, i) => i !== index);
        const reorderedStages = newStages.map((stage, i) => ({
            ...stage,
            order: i + 1
        }));

        setFormData(prev => ({
            ...prev,
            stages: reorderedStages,
            keyApprovalStage: prev.keyApprovalStage === deletedStageName ? '' : prev.keyApprovalStage
        }));
    };

    const handleStageChange = (index: number, field: keyof Stage, value: any) => {
        const newStages = [...formData.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setFormData(prev => ({ ...prev, stages: newStages }));
    };

    const handleRoleToggle = (stageIndex: number, roleValue: string) => {
        const stage = formData.stages[stageIndex];
        const currentRoles = stage.rolesAllowed || [];

        const newRoles = currentRoles.includes(roleValue)
            ? currentRoles.filter(r => r !== roleValue)
            : [...currentRoles, roleValue];

        handleStageChange(stageIndex, 'rolesAllowed', newRoles);
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Workflow name is required';
        }

        if (!formData.relatedTo) {
            newErrors.relatedTo = 'Please select a module';
        }

        if (!formData.keyApprovalStage.trim()) {
            newErrors.keyApprovalStage = 'Key Approval Stage is required';
        }

        if (formData.stages.length === 0) {
            newErrors.stages = 'Please add at least one stage';
        }

        formData.stages.forEach((stage, index) => {
            if (!stage.name.trim()) {
                newErrors[`stage_${index}_name`] = 'Stage name is required';
            }
            if (stage.rolesAllowed.length === 0) {
                newErrors[`stage_${index}_roles`] = 'Please assign at least one role';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            alert('Please fix all errors before submitting');
            return;
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-2xl shadow-lg p-8 transition-all duration-300"
                style={{
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                }}>
                <h3 className="text-xl font-semibold mb-6"
                    style={{ color: darkMode ? '#F1F5F9' : '#111827' }}>
                    Basic Information
                </h3>

                <div className="space-y-4">
                    {/* Workflow Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                            Workflow Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Publishing Article, Product Launch Review"
                            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{
                                borderColor: errors.name ? '#F93232' : darkMode ? '#475569' : '#D1D5DB',
                                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                                color: darkMode ? '#F1F5F9' : '#111827',
                            }}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Related To */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                            Related To (Module) <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.relatedTo}
                            onChange={(e) => handleInputChange('relatedTo', e.target.value)}
                            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{
                                borderColor: errors.relatedTo ? '#F93232' : darkMode ? '#475569' : '#D1D5DB',
                                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                                color: darkMode ? '#F1F5F9' : '#111827',
                            }}
                        >
                            <option value="">Select a module...</option>
                            {RELATED_TO_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.relatedTo && <p className="text-red-500 text-sm mt-1">{errors.relatedTo}</p>}
                        <p className="text-sm mt-2" style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}>
                            💡 This groups workflows by their business function
                        </p>
                    </div>

                    {/* Key Approval Stage */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                            Key Approval Stage <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.keyApprovalStage}
                            onChange={(e) => handleInputChange('keyApprovalStage', e.target.value)}
                            placeholder="e.g., Final Approval, Published, Ready to Launch"
                            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200"
                            style={{
                                borderColor: errors.keyApprovalStage ? '#F93232' : darkMode ? '#475569' : '#D1D5DB',
                                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                                color: darkMode ? '#F1F5F9' : '#111827',
                            }}
                        />
                        {errors.keyApprovalStage && <p className="text-red-500 text-sm mt-1">{errors.keyApprovalStage}</p>}
                        <p className="text-sm mt-2" style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}>
                            🔑 This is the stage name that triggers automatic publishing
                        </p>
                    </div>
                </div>
            </div>

            {/* Stages Configuration */}
            <div className="rounded-2xl shadow-lg overflow-hidden transition-all duration-300"
                style={{
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                }}>
                <div className="p-6 border-b flex justify-between items-center"
                    style={{
                        borderColor: darkMode ? '#334155' : '#E5E7EB',
                    }}>
                    <div>
                        <h3 className="text-xl font-semibold mb-1"
                            style={{ color: darkMode ? '#F1F5F9' : '#111827' }}>
                            Workflow Stages
                        </h3>
                        <p className="text-sm"
                            style={{ color: darkMode ? '#94A3B8' : '#6B7280' }}>
                            Define the stages for your workflow approval process
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddStage}
                        className="px-4 py-2 text-white rounded-lg transition font-medium flex items-center gap-2"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <Plus size={18} />
                        Add Stage
                    </button>
                </div>

                {formData.keyApprovalStage && formData.stages.length > 0 && !formData.stages.some(s => s.name === formData.keyApprovalStage) && (
                    <div className="m-6 p-4 rounded-lg"
                        style={{
                            backgroundColor: darkMode ? 'rgba(255, 201, 115, 0.1)' : '#FFFACD',
                            border: `1px solid ${darkMode ? 'rgba(255, 201, 115, 0.3)' : '#FFE873'}`
                        }}>
                        <p className="text-sm"
                            style={{ color: darkMode ? '#FFE873' : '#997200' }}>
                            ⚠️ <strong>Warning:</strong> No stage matches your Key Approval Stage "<strong>{formData.keyApprovalStage}</strong>".
                        </p>
                    </div>
                )}

                {errors.stages && <p className="text-red-500 text-sm m-6">{errors.stages}</p>}

                {formData.stages.length === 0 ? (
                    <div className="text-center py-12 m-6 border-2 border-dashed rounded-lg"
                        style={{
                            borderColor: darkMode ? '#475569' : '#D1D5DB',
                            color: darkMode ? '#94A3B8' : '#6B7280'
                        }}>
                        <p className="mb-4">No stages yet. Add your first stage to get started.</p>
                        <button
                            type="button"
                            onClick={handleAddStage}
                            className="px-4 py-2 text-white rounded-lg transition"
                            style={{ backgroundColor: colors.primary }}
                        >
                            Add First Stage
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {formData.stages.map((stage, index) => (
                            <div key={index} className="border-2 rounded-lg p-6"
                                style={{
                                    borderColor: darkMode ? '#475569' : '#D1D5DB',
                                    backgroundColor: darkMode ? '#0F172A' : '#F9FAFB'
                                }}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="shrink-0 mt-2">
                                        <GripVertical size={20} style={{ color: darkMode ? '#64748B' : '#9CA3AF' }} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 rounded-full text-sm font-medium"
                                                style={{
                                                    backgroundColor: darkMode ? '#334155' : '#E5E7EB',
                                                    color: darkMode ? '#CBD5E1' : '#374151'
                                                }}>
                                                Stage {index + 1}
                                            </span>
                                            {formData.keyApprovalStage === stage.name && stage.name && (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: colors.success + '30',
                                                        color: colors.success
                                                    }}>
                                                    🔑 Key Approval Stage
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStage(index)}
                                        className="p-2 rounded-lg transition"
                                        style={{
                                            color: colors.error,
                                            backgroundColor: darkMode ? 'rgba(249, 50, 50, 0.1)' : '#FFE6E6'
                                        }}
                                        title="Remove stage"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2"
                                            style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                                            Stage Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={stage.name}
                                            onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                                            placeholder="e.g., To Do, Ready to Review, Final Approval"
                                            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200"
                                            style={{
                                                borderColor: errors[`stage_${index}_name`] ? colors.error : darkMode ? '#475569' : '#D1D5DB',
                                                backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                                                color: darkMode ? '#F1F5F9' : '#111827',
                                            }}
                                        />
                                        {errors[`stage_${index}_name`] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[`stage_${index}_name`]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2"
                                            style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                                            Highlight Color
                                        </label>
                                        <div className="flex gap-2">
                                            {HIGHLIGHT_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => handleStageChange(index, 'highlightColor', color)}
                                                    className="w-10 h-10 rounded-lg border-2 transition hover:scale-105"
                                                    style={{
                                                        backgroundColor: color,
                                                        borderColor: stage.highlightColor === color
                                                            ? darkMode ? '#F1F5F9' : '#111827'
                                                            : darkMode ? '#475569' : '#D1D5DB',
                                                    }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2"
                                        style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={stage.description}
                                        onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                                        placeholder="Brief description of this stage"
                                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200"
                                        style={{
                                            borderColor: darkMode ? '#475569' : '#D1D5DB',
                                            backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                                            color: darkMode ? '#F1F5F9' : '#111827',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3"
                                        style={{ color: darkMode ? '#CBD5E1' : '#374151' }}>
                                        Roles Allowed <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ROLE_OPTIONS.map(role => {
                                            const isSelected = stage.rolesAllowed?.includes(role.value);
                                            return (
                                                <button
                                                    key={role.value}
                                                    type="button"
                                                    onClick={() => handleRoleToggle(index, role.value)}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium transition"
                                                    style={{
                                                        backgroundColor: isSelected ? colors.primary : darkMode ? '#334155' : '#E5E7EB',
                                                        color: isSelected ? '#FFFFFF' : darkMode ? '#CBD5E1' : '#4B5563',
                                                        border: isSelected ? `2px solid ${colors.primary}` : `2px solid transparent`
                                                    }}
                                                >
                                                    {role.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors[`stage_${index}_roles`] && (
                                        <p className="text-red-500 text-sm mt-2">{errors[`stage_${index}_roles`]}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: colors.primary
                    }}
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Workflow' : 'Create Workflow'}
                </button>
            </div>
        </form>
    );
}