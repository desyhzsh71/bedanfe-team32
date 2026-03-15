'use client';

import React from 'react';
import { X, Image as ImageIcon, Plus, Trash2, MapPin } from 'lucide-react';

// COLORS
const COLORS = {
    primary: '#3A7AC3',
    secondary: '#38C0A8',
    accent: '#534581',
    error: '#F93232',
    warning: '#FFC973',
    success: '#38C0A8',
    info: '#3A7AC3',
};

// TYPES
export interface RenderFieldProps {
    field: {
        id: string;
        name: string;
        fieldType: string;
        apiId: string;
        required: boolean;
        options?: any;
    };
    lang: 'id' | 'en';
    value: any;
    darkMode: boolean;
    onChange: (apiId: string, value: any) => void;
    onOpenMedia: (fieldKey: string) => void;  // fieldKey = `${lang}:${apiId}`
}

// HELPER
export const normalizeType = (t: string): string => {
    const map: Record<string, string> = {
        TEXT: 'text', RICH_TEXT: 'richtext', RICHTEXT: 'richtext',
        MEDIA: 'media', NUMBER: 'number',
        DATE_TIME: 'date', DATETIME: 'date', DATE: 'date',
        BOOLEAN: 'boolean', SELECT: 'select', RELATION: 'relation',
        LOCATION: 'location', MULTIPLE_CONTENT: 'multiple_content',
    };
    return map[t?.toUpperCase()] ?? t?.toLowerCase() ?? 'text';
};

export const parseOpts = (o: any): any => {
    if (!o) return {};
    if (typeof o === 'string') { try { return JSON.parse(o); } catch { return {}; } }
    return o;
};

// TRANSLATE BUTTON
interface TranslateButtonProps {
    onTranslate: () => void;
    isTranslating: boolean;
    darkMode: boolean;
}

export function TranslateButton({ onTranslate, isTranslating, darkMode }: TranslateButtonProps) {
    return (
        <button
            onClick={onTranslate}
            disabled={isTranslating}
            title="Auto-translate dari ID ke EN"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            style={{
                backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
                color: darkMode ? '#94A3B8' : '#64748B',
                border: `1px solid ${darkMode ? '#4A5568' : '#E2E8F0'}`,
            }}
            onMouseEnter={e => { if (!isTranslating) e.currentTarget.style.borderColor = COLORS.secondary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#4A5568' : '#E2E8F0'; }}
        >
            {isTranslating
                ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Translating...</>
                : <>🌐 Translate ID → EN</>
            }
        </button>
    );
}

// TRANSLATE
export async function translateContent(
    fields: Array<{ fieldType: string; apiId: string }>,
    contentID: Record<string, any>,
): Promise<Record<string, any>> {
    const translatableTypes = ['text', 'richtext'];
    const result: Record<string, any> = { ...contentID };

    for (const field of fields) {
        const type = normalizeType(field.fieldType);
        const val = contentID[field.apiId];

        if (!translatableTypes.includes(type) || !val || typeof val !== 'string') continue;

        try {
            result[field.apiId] = val;
        } catch {
            result[field.apiId] = val;
        }
    }

    return result;
}

// MAIN RENDER
export function renderField({
    field,
    lang,
    value,
    darkMode,
    onChange,
    onOpenMedia,
}: RenderFieldProps): React.ReactNode {
    const opts = parseOpts(field.options);
    const type = normalizeType(field.fieldType);
    const val = value ?? '';

    const inp: React.CSSProperties = {
        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
        color: darkMode ? '#E0E0E0' : '#1E293B',
    };
    const focusOn = (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderColor = COLORS.secondary; };
    const focusOff = (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; };

    const labelEl = (
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>
            {field.name}
            {field.required && lang === 'id' && <span style={{ color: COLORS.error }}> *</span>}
        </label>
    );

    const key = `${field.id}-${lang}`;

    // TEXT
    if (type === 'text') return (
        <div key={key} className="mb-5">
            {labelEl}
            <input type="text" value={val}
                onChange={e => onChange(field.apiId, e.target.value)}
                placeholder={opts.placeholder || `Enter ${field.name.toLowerCase()}...`}
                onFocus={focusOn} onBlur={focusOff}
                maxLength={opts.maxLength}
                className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
            {opts.maxLength && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{String(val).length}/{opts.maxLength}</p>}
        </div>
    );

    // RICH TEXT 
    if (type === 'richtext') return (
        <div key={key} className="mb-5">
            {labelEl}
            <div className="rounded-lg border-2 overflow-hidden transition" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                <div className="flex flex-wrap gap-1 p-2 border-b"
                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9', borderColor: darkMode ? '#4A5568' : '#E2E8F0' }}>
                    {['B', 'I', 'U', 'H1', 'H2', '• List', '1. List', 'Link', '❝', '</>'].map(b => (
                        <span key={b} className="px-2 py-1 text-xs rounded cursor-pointer select-none"
                            style={{ backgroundColor: darkMode ? '#2D2D3F' : '#FFFFFF', color: darkMode ? '#94A3B8' : '#64748B', border: `1px solid ${darkMode ? '#4A5568' : '#E2E8F0'}` }}>
                            {b}
                        </span>
                    ))}
                </div>
                <textarea value={val}
                    onChange={e => onChange(field.apiId, e.target.value)}
                    placeholder={`Enter ${field.name.toLowerCase()}...`}
                    rows={8}
                    className="w-full px-4 py-3 resize-none focus:outline-none"
                    style={{ backgroundColor: darkMode ? '#3F3F52' : '#FFFFFF', color: darkMode ? '#E0E0E0' : '#1E293B' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Rich text editor (formatting toolbar coming soon)</p>
        </div>
    );

    // NUMBER
    if (type === 'number') return (
        <div key={key} className="mb-5">
            {labelEl}
            <input type="number" value={val}
                min={opts.min} max={opts.max}
                step={opts.numberType === 'decimal' ? 0.01 : 1}
                onChange={e => onChange(field.apiId, e.target.value)}
                placeholder="0" onFocus={focusOn} onBlur={focusOff}
                className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
            {(opts.min !== undefined || opts.max !== undefined) && (
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Range: {opts.min ?? '—'} – {opts.max ?? '—'}</p>
            )}
        </div>
    );

    // DATE & TIME
    if (type === 'date') {
        const inputType = opts.dateMode === 'datetime' ? 'datetime-local'
            : opts.dateMode === 'time' ? 'time' : 'date';
        return (
            <div key={key} className="mb-5">
                {labelEl}
                <input type={inputType} value={val}
                    onChange={e => onChange(field.apiId, e.target.value)}
                    onFocus={focusOn} onBlur={focusOff}
                    className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
            </div>
        );
    }

    // BOOLEAN 
    if (type === 'boolean') {
        const isTrue = val === true || val === 'true';
        const isSet = val !== '' && val !== undefined && val !== null;
        const labelTrue = opts.labelTrue || 'True';
        const labelFalse = opts.labelFalse || 'False';
        return (
            <div key={key} className="mb-5">
                {labelEl}
                <div className="flex gap-3">
                    <button onClick={() => onChange(field.apiId, true)}
                        className="flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition"
                        style={{
                            borderColor: isSet && isTrue ? COLORS.secondary : (darkMode ? '#3F3F52' : '#E2E8F0'),
                            backgroundColor: isSet && isTrue ? `${COLORS.secondary}18` : (darkMode ? '#3F3F52' : '#F1F5F9'),
                            color: isSet && isTrue ? COLORS.secondary : (darkMode ? '#94A3B8' : '#64748B'),
                        }}>
                        ✓ {labelTrue}
                    </button>
                    <button onClick={() => onChange(field.apiId, false)}
                        className="flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition"
                        style={{
                            borderColor: isSet && !isTrue ? COLORS.error : (darkMode ? '#3F3F52' : '#E2E8F0'),
                            backgroundColor: isSet && !isTrue ? `${COLORS.error}18` : (darkMode ? '#3F3F52' : '#F1F5F9'),
                            color: isSet && !isTrue ? COLORS.error : (darkMode ? '#94A3B8' : '#64748B'),
                        }}>
                        ✗ {labelFalse}
                    </button>
                </div>
            </div>
        );
    }

    // SELECT 
    if (type === 'select') {
        const isMulti = opts.selectMultiple;
        return (
            <div key={key} className="mb-5">
                {labelEl}
                <select value={val}
                    onChange={e => {
                        if (isMulti) onChange(field.apiId, Array.from((e.target as HTMLSelectElement).selectedOptions, o => o.value));
                        else onChange(field.apiId, e.target.value);
                    }}
                    multiple={isMulti}
                    onFocus={focusOn} onBlur={focusOff}
                    className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp}>
                    {!isMulti && <option value="">-- Pilih {field.name} --</option>}
                    {(opts.choices || []).map((c: { label: string; value: string }) =>
                        <option key={c.value} value={c.value}>{c.label}</option>
                    )}
                </select>
                {isMulti && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Tahan Ctrl/Cmd untuk pilih banyak</p>}
            </div>
        );
    }

    // MEDIA 
    if (type === 'media') {
        const selected = val;
        const fieldKey = `${lang}:${field.apiId}`;
        return (
            <div key={key} className="mb-5">
                {labelEl}
                {selected?.filename ? (
                    <div className="rounded-lg border-2 overflow-hidden"
                        style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                                style={{ backgroundColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                {selected.url
                                    ? <img src={selected.url} alt={selected.originalName} className="w-full h-full object-cover" />
                                    : <ImageIcon size={22} style={{ color: '#94A3B8' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{selected.originalName}</p>
                                <p className="text-xs" style={{ color: '#94A3B8' }}>Media asset</p>
                            </div>
                            <button onClick={() => onChange(field.apiId, null)}
                                className="p-1.5 rounded-lg transition"
                                style={{ color: '#94A3B8' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? '#2D2D3F' : '#F1F5F9'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => onOpenMedia(fieldKey)}
                        className="w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-8 transition"
                        style={{ borderColor: darkMode ? '#4A5568' : '#CBD5E1', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#4A5568' : '#CBD5E1'; }}>
                        <ImageIcon size={28} className="mb-2" style={{ color: '#94A3B8' }} />
                        <p className="text-sm" style={{ color: '#94A3B8' }}>Klik untuk pilih media dari Media Assets</p>
                        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                            {(opts.acceptedTypes || []).join(', ') || 'Semua tipe'} • Max {opts.maxFileSize || 5}MB
                        </p>
                    </button>
                )}
            </div>
        );
    }

    // RELATION 
    if (type === 'relation') return (
        <div key={key} className="mb-5">
            {labelEl}
            <input type="text" value={val}
                onChange={e => onChange(field.apiId, e.target.value)}
                placeholder={`Pilih ${opts.relatedCollection || 'item'}...`}
                onFocus={focusOn} onBlur={focusOff}
                className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                Relasi ke: <span className="font-mono">{opts.relatedCollection || 'unknown'}</span>
                {opts.relationType && ` (${opts.relationType})`}
            </p>
        </div>
    );

    // LOCATION 
    if (type === 'location') {
        const loc = (val && typeof val === 'object') ? val : { lat: opts.defaultLat ?? '', lng: opts.defaultLng ?? '' };
        const setLoc = (part: 'lat' | 'lng', v: string) =>
            onChange(field.apiId, { ...loc, [part]: v === '' ? '' : parseFloat(v) });

        return (
            <div key={key} className="mb-5">
                {labelEl}
                <div className="rounded-lg border-2 overflow-hidden"
                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium mb-1.5 flex items-center gap-1"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                <MapPin size={12} /> Latitude
                            </label>
                            <input type="number" step="0.000001"
                                value={loc.lat ?? ''}
                                onChange={e => setLoc('lat', e.target.value)}
                                placeholder="-6.2088"
                                onFocus={focusOn} onBlur={focusOff}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm transition focus:outline-none" style={inp} />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1.5 flex items-center gap-1"
                                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                                <MapPin size={12} /> Longitude
                            </label>
                            <input type="number" step="0.000001"
                                value={loc.lng ?? ''}
                                onChange={e => setLoc('lng', e.target.value)}
                                placeholder="106.8456"
                                onFocus={focusOn} onBlur={focusOff}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm transition focus:outline-none" style={inp} />
                        </div>
                    </div>

                    {loc.lat && loc.lng && !isNaN(Number(loc.lat)) && !isNaN(Number(loc.lng)) && (
                        <div className="border-t" style={{ borderColor: darkMode ? '#4A5568' : '#E2E8F0' }}>
                            <iframe
                                title="map-preview"
                                width="100%"
                                height="200"
                                style={{ border: 0, display: 'block' }}
                                loading="lazy"
                                src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed`}
                            />
                        </div>
                    )}

                    <div className="px-4 py-2.5 border-t flex items-center justify-between"
                        style={{ borderColor: darkMode ? '#4A5568' : '#E2E8F0', backgroundColor: darkMode ? '#2D2D3F' : '#F1F5F9' }}>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>
                            {loc.lat && loc.lng
                                ? `📍 ${Number(loc.lat).toFixed(6)}, ${Number(loc.lng).toFixed(6)}`
                                : 'Masukkan koordinat untuk preview peta'}
                        </p>
                        {loc.lat && loc.lng && (
                            <a
                                href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                                style={{ color: COLORS.primary }}>
                                Buka di Maps ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // MULTIPLE CONTENT 
    if (type === 'multiple_content') {
        const items: string[] = Array.isArray(val) ? val : [];
        const itemLabel = opts.itemLabel || 'Item';
        const maxItems = opts.maxItems;
        const canAdd = !maxItems || items.length < maxItems;

        const updateItem = (idx: number, newVal: string) => {
            const updated = [...items];
            updated[idx] = newVal;
            onChange(field.apiId, updated);
        };

        const addItem = () => {
            if (!canAdd) return;
            onChange(field.apiId, [...items, '']);
        };

        const removeItem = (idx: number) => {
            onChange(field.apiId, items.filter((_, i) => i !== idx));
        };

        const moveItem = (idx: number, dir: 'up' | 'down') => {
            const updated = [...items];
            const to = dir === 'up' ? idx - 1 : idx + 1;
            if (to < 0 || to >= updated.length) return;
            [updated[idx], updated[to]] = [updated[to], updated[idx]];
            onChange(field.apiId, updated);
        };

        return (
            <div key={key} className="mb-5">
                {labelEl}
                <div className="rounded-lg border-2 overflow-hidden"
                    style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                    {items.length === 0 ? (
                        <div className="text-center py-8" style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                            <p className="text-sm" style={{ color: '#94A3B8' }}>Belum ada {itemLabel}</p>
                            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Klik "+ Tambah {itemLabel}" untuk mulai</p>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                            {items.map((item, idx) => (
                                <div key={idx}
                                    className="flex items-center gap-2 px-3 py-2.5 border-b"
                                    style={{ borderColor: darkMode ? '#4A5568' : '#E2E8F0' }}>
                                    <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{ backgroundColor: `${COLORS.accent}20`, color: COLORS.accent }}>
                                        {idx + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={e => updateItem(idx, e.target.value)}
                                        placeholder={`${itemLabel} ${idx + 1}...`}
                                        className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none transition"
                                        style={inp}
                                        onFocus={focusOn}
                                        onBlur={focusOff}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0}
                                            className="w-5 h-4 flex items-center justify-center rounded text-xs transition disabled:opacity-30"
                                            style={{ color: '#94A3B8' }}>▲</button>
                                        <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1}
                                            className="w-5 h-4 flex items-center justify-center rounded text-xs transition disabled:opacity-30"
                                            style={{ color: '#94A3B8' }}>▼</button>
                                    </div>
                                    <button onClick={() => removeItem(idx)}
                                        className="p-1.5 rounded-lg transition shrink-0"
                                        style={{ color: COLORS.error }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(249,50,50,0.1)' : '#FEE2E2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2.5"
                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#F1F5F9', borderTop: `1px solid ${darkMode ? '#4A5568' : '#E2E8F0'}` }}>
                        <button
                            onClick={addItem}
                            disabled={!canAdd}
                            className="flex items-center gap-1.5 text-xs font-semibold transition disabled:opacity-40"
                            style={{ color: canAdd ? COLORS.secondary : '#94A3B8' }}>
                            <Plus size={14} /> Tambah {itemLabel}
                        </button>
                        <span className="text-xs" style={{ color: '#94A3B8' }}>
                            {items.length}{maxItems ? `/${maxItems}` : ''} {itemLabel}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // FALLBACK
    return (
        <div key={key} className="mb-5">
            {labelEl}
            <input type="text" value={val}
                onChange={e => onChange(field.apiId, e.target.value)}
                placeholder={`Enter ${field.name.toLowerCase()}...`}
                onFocus={focusOn} onBlur={focusOff}
                className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
        </div>
    );
}

// SEO fields 
export interface SeoData {
    metaTitle: string; metaDescription: string; keywords: string;
    ogTitle: string; ogDescription: string; ogImage: any; canonicalUrl: string;
}

export const emptySeo = (): SeoData => ({
    metaTitle: '', metaDescription: '', keywords: '',
    ogTitle: '', ogDescription: '', ogImage: null, canonicalUrl: '',
});

interface SeoFieldsProps {
    lang: 'id' | 'en';
    data: SeoData;
    darkMode: boolean;
    onChange: (key: keyof SeoData, value: any) => void;
    onOpenMedia: (fieldKey: string) => void;
    onRemoveOgImage: (fieldKey: string) => void;
}

export function renderSEOFields({
    lang, data, darkMode, onChange, onOpenMedia, onRemoveOgImage
}: SeoFieldsProps): React.ReactNode {
    const fieldKey = `seo-${lang}-ogImage`;
    const inp: React.CSSProperties = {
        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
        color: darkMode ? '#E0E0E0' : '#1E293B',
    };
    const focusOn = (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderColor = COLORS.secondary; };
    const focusOff = (e: React.FocusEvent<HTMLElement>) => { e.target.style.borderColor = darkMode ? '#3F3F52' : '#E2E8F0'; };
    const lbl = (text: string) => (
        <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{text}</label>
    );
    const hint = (text: string) => <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{text}</p>;

    return (
        <div className="space-y-5">
            <div>
                {lbl(`Meta Title (${lang.toUpperCase()})`)}
                <input type="text" value={data.metaTitle}
                    onChange={e => onChange('metaTitle', e.target.value)}
                    placeholder="50-60 karakter" onFocus={focusOn} onBlur={focusOff}
                    className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
                {hint(`${data.metaTitle.length}/60`)}
            </div>

            <div>
                {lbl(`Meta Description (${lang.toUpperCase()})`)}
                <textarea value={data.metaDescription}
                    onChange={e => onChange('metaDescription', e.target.value)}
                    placeholder="150-160 karakter" rows={3}
                    onFocus={focusOn} onBlur={focusOff}
                    className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none resize-none" style={inp} />
                {hint(`${data.metaDescription.length}/160`)}
            </div>

            <div>
                {lbl('Keywords')}
                <input type="text" value={data.keywords}
                    onChange={e => onChange('keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    onFocus={focusOn} onBlur={focusOff}
                    className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
            </div>

            <div className="border-t pt-5" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
                <p className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Open Graph (Social Media)</p>
                <div className="space-y-4">
                    <div>
                        {lbl('OG Title')}
                        <input type="text" value={data.ogTitle}
                            onChange={e => onChange('ogTitle', e.target.value)}
                            placeholder="Judul untuk social media sharing"
                            onFocus={focusOn} onBlur={focusOff}
                            className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
                    </div>
                    <div>
                        {lbl('OG Description')}
                        <textarea value={data.ogDescription}
                            onChange={e => onChange('ogDescription', e.target.value)}
                            placeholder="Deskripsi untuk social media sharing" rows={2}
                            onFocus={focusOn} onBlur={focusOff}
                            className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none resize-none" style={inp} />
                    </div>

                    <div>
                        {lbl('OG Image')}
                        {data.ogImage?.filename ? (
                            <div className="rounded-lg border-2 overflow-hidden"
                                style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}>
                                <div className="flex items-center gap-3 p-3">
                                    <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden"
                                        style={{ backgroundColor: darkMode ? '#2D2D3F' : '#E2E8F0' }}>
                                        <img src={data.ogImage.url} alt={data.ogImage.originalName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: darkMode ? '#E0E0E0' : '#1E293B' }}>{data.ogImage.originalName}</p>
                                        <p className="text-xs" style={{ color: '#94A3B8' }}>OG Image</p>
                                    </div>
                                    <button onClick={() => onRemoveOgImage(fieldKey)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => onOpenMedia(fieldKey)}
                                className="w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-6 transition"
                                style={{ borderColor: darkMode ? '#4A5568' : '#CBD5E1', backgroundColor: darkMode ? '#3F3F52' : '#F8FAFC' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#4A5568' : '#CBD5E1'; }}>
                                <ImageIcon size={22} className="mb-2" style={{ color: '#94A3B8' }} />
                                <p className="text-sm" style={{ color: '#94A3B8' }}>Klik untuk tambah OG image</p>
                                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Rekomendasi: 1200×630px</p>
                            </button>
                        )}
                    </div>

                    <div>
                        {lbl('Canonical URL')}
                        <input type="text" value={data.canonicalUrl}
                            onChange={e => onChange('canonicalUrl', e.target.value)}
                            placeholder="https://yoursite.com/page-url"
                            onFocus={focusOn} onBlur={focusOff}
                            className="w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none" style={inp} />
                    </div>
                </div>
            </div>
        </div>
    );
}