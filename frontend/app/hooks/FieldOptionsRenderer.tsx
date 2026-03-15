'use client';

import React from 'react';

export interface FieldOptions {
    // text
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    defaultValue?: string;
    // richtext
    toolbar?: string[];
    // media
    acceptedTypes?: string[];
    maxFileSize?: number;
    multiple?: boolean;
    // number
    numberType?: 'integer' | 'decimal';
    min?: number;
    max?: number;
    defaultNumber?: number;
    // date
    dateMode?: 'date' | 'time' | 'datetime';
    dateFormat?: string;
    // boolean
    defaultBoolean?: boolean;
    labelTrue?: string;
    labelFalse?: string;
    // select
    choices?: { label: string; value: string }[];
    selectMultiple?: boolean;
    // relation
    relatedCollection?: string;
    relationType?: 'one-to-one' | 'one-to-many' | 'many-to-many';
    // location
    showMap?: boolean;
    defaultLat?: number;
    defaultLng?: number;
    // multiple_content
    itemLabel?: string;
    maxItems?: number;
    itemFields?: string[];
}

export interface Field {
    id: string;
    name: string;
    fieldType: string;
    required: boolean;
    unique: boolean;
    description?: string;
    sequence: number;
    icon?: string;
    apiId?: string;
    isNew?: boolean;
    options?: FieldOptions;
}

export const FIELD_TYPES = [
    { id: 'text', name: 'Text Field', icon: '📝', description: 'Teks pendek — judul, nama, slug', color: '#8B5CF6' },
    { id: 'richtext', name: 'Rich Text', icon: '✏️', description: 'Teks panjang dengan format: bold, italic, heading, list, link', color: '#3B82F6' },
    { id: 'media', name: 'Media Field', icon: '🖼️', description: 'Upload gambar, video, atau dokumen', color: '#EC4899' },
    { id: 'number', name: 'Number Field', icon: '🔢', description: 'Nilai numerik — integer atau desimal', color: '#10B981' },
    { id: 'date', name: 'Date & Time', icon: '📅', description: 'Tanggal, waktu, atau keduanya', color: '#06B6D4' },
    { id: 'boolean', name: 'Boolean', icon: '🔘', description: 'Toggle true/false — aktif/nonaktif, publish/draft', color: '#F59E0B' },
    { id: 'select', name: 'Select', icon: '📋', description: 'Pilih satu atau banyak dari daftar opsi', color: '#6366F1' },
    { id: 'relation', name: 'Relation', icon: '🔗', description: 'Relasi ke collection lain', color: '#EF4444' },
    { id: 'location', name: 'Location', icon: '📍', description: 'Koordinat lokasi — latitude and longitude', color: '#14B8A6' },
    { id: 'multiple_content', name: 'Multiple Content', icon: '📑', description: 'Daftar item berulang — list, carousel, steps, menu links, dll', color: '#F97316' },
];

interface Props {
    selectedFieldType: string;
    options: FieldOptions;
    darkMode: boolean;
    onChange: (key: string, value: any) => void;
}

const SECONDARY = '#38C0A8';

export function FieldOptionsRenderer({ selectedFieldType, options, darkMode, onChange }: Props) {
    const inp: React.CSSProperties = {
        backgroundColor: darkMode ? '#3F3F52' : '#F1F5F9',
        borderColor: darkMode ? '#3F3F52' : '#E2E8F0',
        color: darkMode ? '#E0E0E0' : '#1E293B',
    };
    const lbl = { color: darkMode ? '#94A3B8' : '#64748B' };
    const txt = { color: darkMode ? '#E0E0E0' : '#1E293B' };
    const acc = { accentColor: SECONDARY };

    const TextInput = ({ label, k, type = 'text', placeholder = '' }: { label: string; k: string; type?: string; placeholder?: string }) => (
        <div>
            <label className="block text-xs mb-1" style={lbl}>{label}</label>
            <input type={type}
                value={(options as any)[k] ?? ''}
                onChange={e => onChange(k, type === 'number' ? (e.target.value === '' ? undefined : parseFloat(e.target.value)) : e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
        </div>
    );

    const Check = ({ label, k }: { label: string; k: string }) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!(options as any)[k]} onChange={e => onChange(k, e.target.checked)} className="w-4 h-4 rounded" style={acc} />
            <span className="text-sm" style={txt}>{label}</span>
        </label>
    );

    return (
        <div className="space-y-4 mt-4 pt-4 border-t" style={{ borderColor: darkMode ? '#3F3F52' : '#E2E8F0' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={lbl}>Setting Configuration</p>

            {/* TEXT */}
            {selectedFieldType === 'text' && (<>
                <TextInput label="Placeholder" k="placeholder" placeholder="e.g., Masukkan judul artikel..." />
                <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Min Length" k="minLength" type="number" />
                    <TextInput label="Max Length" k="maxLength" type="number" />
                </div>
                <TextInput label="Default Value" k="defaultValue" placeholder="Nilai awal (opsional)" />
            </>)}

            {/* RICH TEXT */}
            {selectedFieldType === 'richtext' && (
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Toolbar Options</label>
                    <div className="space-y-2">
                        {[
                            { key: 'bold', label: 'Bold / Italic / Underline' },
                            { key: 'heading', label: 'Heading (H1–H4)' },
                            { key: 'list', label: 'Bullet & Numbered List' },
                            { key: 'link', label: 'Link' },
                            { key: 'image', label: 'Insert Image' },
                            { key: 'blockquote', label: 'Blockquote' },
                            { key: 'code', label: 'Code Block' },
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox"
                                    checked={(options.toolbar || []).includes(key)}
                                    onChange={e => {
                                        const cur = options.toolbar || [];
                                        onChange('toolbar', e.target.checked ? [...cur, key] : cur.filter(t => t !== key));
                                    }}
                                    className="w-4 h-4 rounded" style={acc} />
                                <span className="text-sm" style={txt}>{label}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs mt-2" style={lbl}>Kosongkan = semua toolbar aktif</p>
                </div>
            )}

            {/* MEDIA */}
            {selectedFieldType === 'media' && (<>
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Tipe File yang Diterima</label>
                    <div className="space-y-2">
                        {[
                            { val: 'image/*', label: '🖼️  Gambar (jpg, png, webp, svg...)' },
                            { val: 'video/*', label: '🎬  Video (mp4, webm...)' },
                            { val: 'application/pdf', label: '📄  PDF' },
                            { val: '.doc,.docx', label: '📝  Dokumen Word' },
                        ].map(({ val, label }) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox"
                                    checked={(options.acceptedTypes || []).includes(val)}
                                    onChange={e => {
                                        const cur = options.acceptedTypes || [];
                                        onChange('acceptedTypes', e.target.checked ? [...cur, val] : cur.filter(t => t !== val));
                                    }}
                                    className="w-4 h-4 rounded" style={acc} />
                                <span className="text-sm" style={txt}>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Maks Ukuran File (MB)</label>
                    <input type="number" value={options.maxFileSize ?? 5} min={1} max={100}
                        onChange={e => onChange('maxFileSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                </div>
                <Check label="Izinkan Multiple File" k="multiple" />
            </>)}

            {/* NUMBER */}
            {selectedFieldType === 'number' && (<>
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Tipe Angka</label>
                    <div className="flex gap-4">
                        {(['integer', 'decimal'] as const).map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="numberType" value={t}
                                    checked={(options.numberType || 'integer') === t}
                                    onChange={() => onChange('numberType', t)} style={acc} />
                                <span className="text-sm" style={txt}>{t === 'integer' ? 'Integer (bilangan bulat)' : 'Decimal'}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Nilai Min" k="min" type="number" />
                    <TextInput label="Nilai Max" k="max" type="number" />
                </div>
                <TextInput label="Default Value" k="defaultNumber" type="number" />
            </>)}

            {/* DATE & TIME */}
            {selectedFieldType === 'date' && (<>
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Mode</label>
                    <div className="space-y-2">
                        {([
                            { val: 'date', label: '📅  Date only' },
                            { val: 'time', label: '⏰  Time only' },
                            { val: 'datetime', label: '🗓️  Date & Time' },
                        ] as const).map(({ val, label }) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="dateMode" value={val}
                                    checked={(options.dateMode || 'date') === val}
                                    onChange={() => onChange('dateMode', val)} style={acc} />
                                <span className="text-sm" style={txt}>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Format Tanggal</label>
                    <select value={options.dateFormat || 'YYYY-MM-DD'} onChange={e => onChange('dateFormat', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp}>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD MMM YYYY">DD MMM YYYY (e.g. 01 Jan 2025)</option>
                    </select>
                </div>
            </>)}

            {/* BOOLEAN */}
            {selectedFieldType === 'boolean' && (<>
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Default Value</label>
                    <div className="flex gap-4">
                        {[true, false].map(val => (
                            <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="defaultBoolean"
                                    checked={(options.defaultBoolean ?? false) === val}
                                    onChange={() => onChange('defaultBoolean', val)} style={acc} />
                                <span className="text-sm" style={txt}>{val ? 'True (aktif)' : 'False (nonaktif)'}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <TextInput label="Label saat True" k="labelTrue" placeholder="e.g., Aktif, Publish, Ya" />
                <TextInput label="Label saat False" k="labelFalse" placeholder="e.g., Nonaktif, Draft, Tidak" />
            </>)}

            {/* SELECT */}
            {selectedFieldType === 'select' && (<>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Daftar Pilihan (satu per baris)</label>
                    <textarea
                        value={(options.choices || []).map(c => c.label).join('\n')}
                        onChange={e => {
                            const lines = e.target.value.split('\n');
                            onChange('choices', lines.map(l => ({
                                label: l.trim(),
                                value: l.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                            })).filter(c => c.label));
                        }}
                        placeholder={'Draft\nPublished\nArchived'}
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg border text-sm font-mono resize-none"
                        style={inp}
                    />
                    <p className="text-xs mt-1" style={lbl}>{(options.choices || []).length} pilihan terdaftar</p>
                </div>
                <Check label="Izinkan pilih banyak (multiple select)" k="selectMultiple" />
            </>)}

            {/* LOCATION */}
            {selectedFieldType === 'location' && (<>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Default Latitude</label>
                    <input type="number" step="0.000001" value={options.defaultLat ?? ''}
                        onChange={e => onChange('defaultLat', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        placeholder="e.g., -6.2088"
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                </div>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Default Longitude</label>
                    <input type="number" step="0.000001" value={options.defaultLng ?? ''}
                        onChange={e => onChange('defaultLng', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        placeholder="e.g., 106.8456"
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                </div>
                <p className="text-xs" style={lbl}>Kosongkan untuk tanpa default koordinat</p>
            </>)}

            {/* MULTIPLE CONTENT */}
            {selectedFieldType === 'multiple_content' && (<>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Label Item</label>
                    <input type="text" value={options.itemLabel ?? ''}
                        onChange={e => onChange('itemLabel', e.target.value)}
                        placeholder="e.g., Link, Slide, Step, Menu Item"
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                    <p className="text-xs mt-1" style={lbl}>Nama untuk setiap item dalam list</p>
                </div>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Maks Jumlah Item</label>
                    <input type="number" min={1} max={100} value={options.maxItems ?? ''}
                        onChange={e => onChange('maxItems', e.target.value === '' ? undefined : parseInt(e.target.value))}
                        placeholder="Kosongkan = tidak terbatas"
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                </div>
            </>)}

            {/* RELATION */}
            {selectedFieldType === 'relation' && (<>
                <div>
                    <label className="block text-xs mb-1" style={lbl}>Collection yang Dituju</label>
                    <input type="text" value={options.relatedCollection || ''}
                        onChange={e => onChange('relatedCollection', e.target.value)}
                        placeholder="e.g., authors, categories, tags"
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={inp} />
                </div>
                <div>
                    <label className="block text-xs mb-2" style={lbl}>Tipe Relasi</label>
                    <div className="space-y-2">
                        {([
                            { val: 'one-to-one', label: 'One-to-One  — 1 entri hanya punya 1 relasi' },
                            { val: 'one-to-many', label: 'One-to-Many — 1 entri bisa punya banyak relasi' },
                            { val: 'many-to-many', label: 'Many-to-Many — banyak ke banyak' },
                        ] as const).map(({ val, label }) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="relationType" value={val}
                                    checked={(options.relationType || 'one-to-one') === val}
                                    onChange={() => onChange('relationType', val)} style={acc} />
                                <span className="text-sm" style={txt}>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </>)}
        </div>
    );
}