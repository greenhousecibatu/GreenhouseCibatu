import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatScheduleDays, validateScheduleProposal } from '../utils/aiSchedule';

const GEMINI_WS_ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

const TOOLS = [
    {
        type: 'function',
        name: 'inspect_schedule_context',
        description: 'Lihat waktu lokal dan seluruh jadwal alarm aktif. Wajib dipanggil sebelum menyiapkan jadwal baru atau menjawab pertanyaan tentang jadwal yang ada.',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'prepare_schedule',
        description: 'Validasi detail dan siapkan proposal jadwal mingguan. Fungsi ini belum menyimpan jadwal. Panggil setelah semua detail lengkap dan setelah inspect_schedule_context.',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Nama singkat jadwal. Buat nama yang natural bila pengguna tidak menyebutkannya.'
                },
                type: {
                    type: 'string',
                    enum: ['water', 'fertilizer'],
                    description: 'water untuk air/penyiraman, fertilizer untuk pupuk/nutrisi.'
                },
                time: {
                    type: 'string',
                    description: 'Jam mulai dalam format 24 jam HH:MM.'
                },
                duration: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 120,
                    description: 'Durasi pompa dan solenoid menyala dalam menit.'
                },
                days: {
                    type: 'array',
                    minItems: 1,
                    uniqueItems: true,
                    items: {
                        type: 'string',
                        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    description: 'Hari pengulangan mingguan.'
                }
            },
            required: ['type', 'time', 'duration', 'days'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'confirm_schedule_proposal',
        description: 'Simpan proposal menjadi jadwal nyata. Hanya boleh dipanggil pada giliran SETELAH pengguna secara jelas menyetujui rangkuman proposal dan semua peringatannya.',
        parameters: {
            type: 'object',
            properties: {
                proposal_id: {
                    type: 'string',
                    description: 'ID proposal yang dikembalikan prepare_schedule.'
                }
            },
            required: ['proposal_id'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'cancel_schedule_proposal',
        description: 'Batalkan proposal aktif ketika pengguna mengatakan batal atau tidak jadi.',
        parameters: {
            type: 'object',
            properties: {
                proposal_id: {
                    type: 'string',
                    description: 'ID proposal aktif jika diketahui.'
                }
            },
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'prepare_schedule_deletion',
        description: 'Siapkan proposal penghapusan untuk satu jadwal yang sudah diidentifikasi secara pasti dari inspect_schedule_context. Fungsi ini belum menghapus jadwal.',
        parameters: {
            type: 'object',
            properties: {
                schedule_id: {
                    type: 'string',
                    description: 'ID persis jadwal yang akan dihapus dari hasil inspect_schedule_context.'
                }
            },
            required: ['schedule_id'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'confirm_schedule_deletion',
        description: 'Hapus jadwal dalam proposal aktif. Hanya boleh dipanggil pada giliran SETELAH pengguna mendengar detail jadwal dan secara eksplisit menyetujui penghapusan.',
        parameters: {
            type: 'object',
            properties: {
                proposal_id: {
                    type: 'string',
                    description: 'ID proposal penghapusan yang dikembalikan prepare_schedule_deletion.'
                }
            },
            required: ['proposal_id'],
            additionalProperties: false
        }
    },
    {
        type: 'function',
        name: 'cancel_schedule_deletion',
        description: 'Batalkan proposal penghapusan aktif ketika pengguna mengatakan batal atau tidak jadi.',
        parameters: {
            type: 'object',
            properties: {
                proposal_id: {
                    type: 'string',
                    description: 'ID proposal penghapusan aktif jika diketahui.'
                }
            },
            additionalProperties: false
        }
    }
];

const GEMINI_TOOLS = TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: JSON.parse(JSON.stringify(tool.parameters, (key, value) => (
        ['additionalProperties', 'uniqueItems'].includes(key) ? undefined : value
    )))
}));

const bytesToBase64 = (bytes) => {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }
    return window.btoa(binary);
};

const encodePcm16 = (samples, sourceSampleRate) => {
    const targetLength = Math.max(1, Math.round(samples.length * INPUT_SAMPLE_RATE / sourceSampleRate));
    const bytes = new Uint8Array(targetLength * 2);
    const view = new DataView(bytes.buffer);

    for (let index = 0; index < targetLength; index += 1) {
        const sourcePosition = index * sourceSampleRate / INPUT_SAMPLE_RATE;
        const leftIndex = Math.min(samples.length - 1, Math.floor(sourcePosition));
        const rightIndex = Math.min(samples.length - 1, leftIndex + 1);
        const weight = sourcePosition - leftIndex;
        const interpolated = samples[leftIndex] + ((samples[rightIndex] - samples[leftIndex]) * weight);
        const clamped = Math.max(-1, Math.min(1, interpolated));
        view.setInt16(index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }

    return bytesToBase64(bytes);
};

const decodePcm16 = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    const view = new DataView(bytes.buffer);
    const samples = new Float32Array(Math.floor(bytes.length / 2));
    for (let index = 0; index < samples.length; index += 1) {
        samples[index] = view.getInt16(index * 2, true) / 0x8000;
    }
    return samples;
};

const parseGeminiSocketMessage = async (data) => {
    let jsonText;

    if (typeof data === 'string') {
        jsonText = data;
    } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
        jsonText = await data.text();
    } else if (data instanceof ArrayBuffer) {
        jsonText = new TextDecoder().decode(data);
    } else if (ArrayBuffer.isView(data)) {
        jsonText = new TextDecoder().decode(
            new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        );
    } else {
        throw new TypeError('Format frame WebSocket Gemini tidak dikenali.');
    }

    return JSON.parse(jsonText);
};

const getSessionInstructions = () => {
    const localDateTime = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(new Date());

    return `
Kamu adalah Asisten AI Greenhouse Cibatu. Berbicaralah dalam Bahasa Indonesia yang hangat, natural, ringkas, dan mudah dipahami seperti percakapan manusia. Waktu lokal saat sesi dimulai: ${localDateTime} WIB.

KONDISI SISTEM YANG WAJIB DIPATUHI:
- Greenhouse hanya memiliki pompa utama serta solenoid air dan pupuk sebagai aktuator. Tidak ada sensor kelembapan, suhu, cuaca, debit, atau ketinggian tangki.
- Jangan pernah mengaku membaca sensor, mengetahui cuaca, atau mengetahui kondisi tanaman secara langsung.
- Kamu dapat membaca jadwal, membuat jadwal alarm mingguan, dan menghapus satu jadwal setelah konfirmasi eksplisit. Kamu tidak dapat menyalakan alat saat ini atau mengubah jadwal lama.
- ESP32 hanya menjalankan satu jadwal dalam satu waktu. Jadwal yang bertumpuk berisiko terlewat.
- Bila memberi saran pagi/sore, jelaskan bahwa itu saran umum, bukan hasil sensor.

ALUR WAJIB MEMBUAT JADWAL:
1. Pastikan jenisnya jelas: air/penyiraman atau pupuk/nutrisi.
2. Pastikan hari, jam, dan durasi sudah jelas. Jangan menebak informasi penting yang belum disebutkan.
3. Sistem ini menyimpan alarm berulang mingguan. Jika pengguna berkata “besok” atau tanggal tertentu, jelaskan bahwa jadwal akan berulang setiap nama hari tersebut dan minta persetujuan atas sifat berulangnya.
4. Panggil inspect_schedule_context untuk melihat jadwal aktif.
5. Panggil prepare_schedule. Bacakan rangkuman dan seluruh warning dari hasil tool, lalu tanyakan persetujuan secara eksplisit.
6. Jangan panggil confirm_schedule_proposal pada respons yang sama dengan prepare_schedule. Tunggu giliran suara pengguna berikutnya. Hanya jika pengguna jelas berkata setuju/ya/lanjutkan, panggil confirm_schedule_proposal dengan proposal_id yang sama.
7. Jika pengguna mengubah detail, panggil prepare_schedule lagi dan minta konfirmasi baru. Jika pengguna batal, panggil cancel_schedule_proposal.

ALUR WAJIB MENGHAPUS JADWAL:
1. Panggil inspect_schedule_context dan cocokkan permintaan dengan jadwal yang tersedia.
2. Jika tidak ada yang cocok, jelaskan. Jika ada lebih dari satu kandidat, bacakan pilihan singkat dan minta pengguna menentukan satu; jangan menebak.
3. Setelah tepat satu jadwal dipilih, panggil prepare_schedule_deletion dengan ID jadwal tersebut.
4. Bacakan nama, jenis/metode, hari atau interval, jam, dan durasinya, lalu tanyakan secara eksplisit apakah benar ingin dihapus.
5. Jangan panggil confirm_schedule_deletion pada respons yang sama dengan prepare_schedule_deletion. Permintaan awal “hapus jadwal...” bukan konfirmasi akhir.
6. Tunggu giliran suara pengguna berikutnya. Hanya jika pengguna jelas berkata “ya, hapus” atau persetujuan setara, panggil confirm_schedule_deletion dengan proposal_id yang sama.
7. Jika detail jadwal berubah, bacakan detail terbaru dan minta konfirmasi ulang. Jika pengguna batal, panggil cancel_schedule_deletion.

Jangan mengatakan jadwal sudah tersimpan sebelum tool confirm_schedule_proposal mengembalikan success. Setelah berhasil, sebutkan bahwa jadwal sudah masuk ke menu Jadwal dan akan disinkronkan ke ESP32.
Jangan mengatakan jadwal sudah dihapus sebelum tool confirm_schedule_deletion mengembalikan success.
`;
};

const simplifySchedules = (schedules) => schedules
    .map(schedule => ({
        id: schedule.id || schedule._id,
        name: schedule.name,
        type: schedule.type,
        method: schedule.method,
        time: schedule.time,
        duration: schedule.duration,
        days: schedule.days || [],
        interval_value: schedule.interval_value || 0,
        enabled: Boolean(schedule.enabled)
    }));

const describeSchedule = (schedule) => {
    const typeLabel = schedule.type === 'water' ? 'Air' : 'Pupuk';
    if (schedule.method === 'interval') {
        return `${typeLabel} • setiap ${schedule.interval_value} menit • durasi ${schedule.duration} menit`;
    }
    return `${typeLabel} • ${formatScheduleDays(schedule.days)} • ${schedule.time} • ${schedule.duration} menit`;
};

const scheduleFingerprint = (schedule) => JSON.stringify({
    id: String(schedule.id),
    name: schedule.name,
    type: schedule.type,
    method: schedule.method,
    time: schedule.time,
    duration: Number(schedule.duration),
    days: schedule.days || [],
    interval_value: Number(schedule.interval_value || 0),
    enabled: Boolean(schedule.enabled)
});

export default function RealtimeAiAssistant({ isOpen, onClose }) {
    const { authFetch, createSchedule, deleteSchedule, showToast } = useApp();
    const [status, setStatus] = useState('idle');
    const [activity, setActivity] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [proposal, setProposal] = useState(null);
    const [deleteProposal, setDeleteProposal] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    const socketRef = useRef(null);
    const streamRef = useRef(null);
    const inputAudioContextRef = useRef(null);
    const inputSourceRef = useRef(null);
    const inputProcessorRef = useRef(null);
    const inputGainRef = useRef(null);
    const outputAudioContextRef = useRef(null);
    const outputSourcesRef = useRef(new Set());
    const outputStartTimeRef = useRef(0);
    const isGeminiReadyRef = useRef(false);
    const isStoppingRef = useRef(false);
    const isMutedRef = useRef(false);
    const proposalRef = useRef(null);
    const deleteProposalRef = useRef(null);
    const deleteProposalPresentedRef = useRef(false);
    const deleteConfirmationEligibleRef = useRef(false);
    const assistantDraftRef = useRef(null);

    const sendEvent = useCallback((event) => {
        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(event));
            return true;
        }
        return false;
    }, []);

    const stopPlayback = useCallback(() => {
        outputSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch {
                // Sumber mungkin sudah selesai tepat sebelum dihentikan.
            }
        });
        outputSourcesRef.current.clear();
        outputStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
    }, []);

    const stopSession = useCallback(() => {
        isStoppingRef.current = true;
        isGeminiReadyRef.current = false;

        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
            socket.close(1000, 'Percakapan selesai');
        } else {
            socket?.close();
        }

        if (inputProcessorRef.current) {
            inputProcessorRef.current.onaudioprocess = null;
            inputProcessorRef.current.disconnect();
        }
        inputSourceRef.current?.disconnect();
        inputGainRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        stopPlayback();
        inputAudioContextRef.current?.close().catch(() => {});
        outputAudioContextRef.current?.close().catch(() => {});

        socketRef.current = null;
        streamRef.current = null;
        inputAudioContextRef.current = null;
        inputSourceRef.current = null;
        inputProcessorRef.current = null;
        inputGainRef.current = null;
        outputAudioContextRef.current = null;
        assistantDraftRef.current = null;
        proposalRef.current = null;
        deleteProposalRef.current = null;
        deleteProposalPresentedRef.current = false;
        deleteConfirmationEligibleRef.current = false;
        isMutedRef.current = false;
        setProposal(null);
        setDeleteProposal(null);
        setStatus('idle');
        setActivity('idle');
        setIsMuted(false);
    }, [stopPlayback]);

    const fetchSchedules = useCallback(async () => {
        const response = await authFetch('/api/schedules');
        if (!response.ok) throw new Error('Gagal membaca jadwal terbaru.');
        return response.json();
    }, [authFetch]);

    const returnToolResult = useCallback((callId, name, result) => {
        sendEvent({
            toolResponse: {
                functionResponses: [{
                    id: callId,
                    name,
                    response: { result }
                }]
            }
        });
    }, [sendEvent]);

    const handleToolCall = useCallback(async (item) => {
        let args = {};
        const callId = item.id || item.call_id;
        const respond = result => returnToolResult(callId, item.name, result);
        try {
            args = typeof item.args === 'object' && item.args !== null
                ? item.args
                : item.arguments
                    ? JSON.parse(item.arguments)
                    : {};
        } catch {
            respond({
                success: false,
                error: 'Argumen tool tidak valid. Tanyakan kembali detail kepada pengguna.'
            });
            return;
        }

        try {
            if (item.name === 'inspect_schedule_context') {
                const schedules = await fetchSchedules();
                respond({
                    success: true,
                    current_time_wib: new Intl.DateTimeFormat('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        dateStyle: 'full',
                        timeStyle: 'medium'
                    }).format(new Date()),
                    schedule_type_supported: 'alarm mingguan dan interval',
                    hardware_note: 'ESP32 hanya menjalankan satu jadwal dalam satu waktu',
                    schedules: simplifySchedules(schedules)
                });
                return;
            }

            if (item.name === 'prepare_schedule') {
                const schedules = await fetchSchedules();
                const validation = validateScheduleProposal(args, schedules);

                if (!validation.valid) {
                    respond({
                        success: false,
                        status: 'needs_correction',
                        errors: validation.errors
                    });
                    return;
                }

                const prepared = {
                    id: `proposal-${Date.now()}`,
                    schedule: validation.schedule,
                    summary: validation.summary,
                    warnings: validation.warnings
                };
                deleteProposalRef.current = null;
                deleteProposalPresentedRef.current = false;
                deleteConfirmationEligibleRef.current = false;
                setDeleteProposal(null);
                proposalRef.current = prepared;
                setProposal(prepared);
                setMessages(previous => [
                    ...previous,
                    {
                        id: prepared.id,
                        role: 'system',
                        text: `Proposal siap: ${prepared.summary}`
                    }
                ]);

                respond({
                    success: true,
                    status: 'proposal_ready_not_saved',
                    proposal_id: prepared.id,
                    summary: prepared.summary,
                    warnings: prepared.warnings,
                    next_action: 'Bacakan rangkuman dan warning, lalu minta konfirmasi eksplisit. Tunggu giliran pengguna berikutnya sebelum menyimpan.'
                });
                return;
            }

            if (item.name === 'confirm_schedule_proposal') {
                const prepared = proposalRef.current;
                if (!prepared || prepared.id !== args.proposal_id) {
                    respond({
                        success: false,
                        status: 'proposal_not_found',
                        error: 'Proposal tidak ditemukan atau sudah berubah. Siapkan proposal baru.'
                    });
                    return;
                }

                const latestSchedules = await fetchSchedules();
                const latestValidation = validateScheduleProposal(prepared.schedule, latestSchedules);
                if (!latestValidation.valid) {
                    respond({
                        success: false,
                        status: 'proposal_no_longer_valid',
                        errors: latestValidation.errors,
                        next_action: 'Jelaskan masalahnya dan siapkan proposal baru.'
                    });
                    return;
                }

                const newWarnings = latestValidation.warnings.filter(warning => !prepared.warnings.includes(warning));
                if (newWarnings.length > 0) {
                    const refreshed = {
                        ...prepared,
                        warnings: [...prepared.warnings, ...newWarnings]
                    };
                    proposalRef.current = refreshed;
                    setProposal(refreshed);
                    respond({
                        success: false,
                        status: 'schedule_context_changed_needs_reconfirmation',
                        new_warnings: newWarnings,
                        proposal_id: refreshed.id,
                        next_action: 'Jadwal belum disimpan. Bacakan warning baru dan minta konfirmasi ulang.'
                    });
                    return;
                }

                await createSchedule(prepared.schedule);
                proposalRef.current = null;
                setProposal(null);
                setMessages(previous => [
                    ...previous,
                    {
                        id: `saved-${Date.now()}`,
                        role: 'success',
                        text: `Jadwal tersimpan: ${prepared.summary}`
                    }
                ]);

                respond({
                    success: true,
                    status: 'schedule_saved',
                    summary: prepared.summary,
                    message: 'Jadwal sudah masuk database dan sinkronisasi MQTT telah dipicu.'
                });
                return;
            }

            if (item.name === 'cancel_schedule_proposal') {
                const prepared = proposalRef.current;
                proposalRef.current = null;
                setProposal(null);
                respond({
                    success: true,
                    status: 'proposal_cancelled',
                    cancelled_proposal_id: prepared?.id || args.proposal_id || null
                });
                return;
            }

            if (item.name === 'prepare_schedule_deletion') {
                const schedules = simplifySchedules(await fetchSchedules());
                const target = schedules.find(schedule => String(schedule.id) === String(args.schedule_id));
                if (!target) {
                    respond({
                        success: false,
                        status: 'schedule_not_found',
                        error: 'Jadwal tidak ditemukan. Periksa kembali daftar jadwal terbaru.'
                    });
                    return;
                }

                const prepared = {
                    id: `delete-proposal-${Date.now()}`,
                    schedule: target,
                    fingerprint: scheduleFingerprint(target),
                    summary: describeSchedule(target)
                };

                proposalRef.current = null;
                setProposal(null);
                deleteProposalRef.current = prepared;
                deleteProposalPresentedRef.current = false;
                deleteConfirmationEligibleRef.current = false;
                setDeleteProposal(prepared);
                setMessages(previous => [
                    ...previous,
                    {
                        id: prepared.id,
                        role: 'system',
                        text: `Menunggu konfirmasi hapus: ${target.name} • ${prepared.summary}`
                    }
                ]);

                respond({
                    success: true,
                    status: 'deletion_proposal_ready_not_deleted',
                    proposal_id: prepared.id,
                    schedule: target,
                    summary: prepared.summary,
                    next_action: 'Bacakan detail jadwal dan minta konfirmasi eksplisit. Tunggu giliran pengguna berikutnya sebelum menghapus.'
                });
                return;
            }

            if (item.name === 'confirm_schedule_deletion') {
                const prepared = deleteProposalRef.current;
                if (!prepared || prepared.id !== args.proposal_id) {
                    respond({
                        success: false,
                        status: 'deletion_proposal_not_found',
                        error: 'Proposal penghapusan tidak ditemukan atau sudah berubah. Periksa jadwal dan siapkan proposal baru.'
                    });
                    return;
                }

                if (!deleteConfirmationEligibleRef.current) {
                    respond({
                        success: false,
                        status: 'explicit_confirmation_still_required',
                        proposal_id: prepared.id,
                        error: 'Belum ada giliran suara pengguna baru setelah proposal dibacakan. Jangan hapus jadwal; minta konfirmasi eksplisit.'
                    });
                    return;
                }

                const latestSchedules = simplifySchedules(await fetchSchedules());
                const latest = latestSchedules.find(schedule => String(schedule.id) === String(prepared.schedule.id));
                if (!latest) {
                    deleteProposalRef.current = null;
                    deleteProposalPresentedRef.current = false;
                    deleteConfirmationEligibleRef.current = false;
                    setDeleteProposal(null);
                    respond({
                        success: false,
                        status: 'schedule_already_missing',
                        error: 'Jadwal tersebut sudah tidak ada. Tidak ada penghapusan yang dilakukan.'
                    });
                    return;
                }

                if (scheduleFingerprint(latest) !== prepared.fingerprint) {
                    const refreshed = {
                        ...prepared,
                        schedule: latest,
                        fingerprint: scheduleFingerprint(latest),
                        summary: describeSchedule(latest)
                    };
                    deleteProposalRef.current = refreshed;
                    deleteProposalPresentedRef.current = false;
                    deleteConfirmationEligibleRef.current = false;
                    setDeleteProposal(refreshed);
                    respond({
                        success: false,
                        status: 'schedule_changed_needs_reconfirmation',
                        proposal_id: refreshed.id,
                        schedule: latest,
                        summary: refreshed.summary,
                        next_action: 'Detail jadwal berubah. Bacakan detail terbaru dan minta konfirmasi ulang.'
                    });
                    return;
                }

                await deleteSchedule(latest.id);
                const remainingSchedules = simplifySchedules(await fetchSchedules());
                if (remainingSchedules.some(schedule => String(schedule.id) === String(latest.id))) {
                    throw new Error('Server belum menghapus jadwal. Tidak ada keberhasilan yang dilaporkan.');
                }

                deleteProposalRef.current = null;
                deleteProposalPresentedRef.current = false;
                deleteConfirmationEligibleRef.current = false;
                setDeleteProposal(null);
                setMessages(previous => [
                    ...previous,
                    {
                        id: `deleted-${Date.now()}`,
                        role: 'success',
                        text: `Jadwal dihapus: ${latest.name}`
                    }
                ]);
                respond({
                    success: true,
                    status: 'schedule_deleted',
                    deleted_schedule: latest,
                    message: 'Jadwal sudah dihapus dari database dan sinkronisasi MQTT telah dipicu.'
                });
                return;
            }

            if (item.name === 'cancel_schedule_deletion') {
                const prepared = deleteProposalRef.current;
                deleteProposalRef.current = null;
                deleteProposalPresentedRef.current = false;
                deleteConfirmationEligibleRef.current = false;
                setDeleteProposal(null);
                respond({
                    success: true,
                    status: 'deletion_proposal_cancelled',
                    cancelled_proposal_id: prepared?.id || args.proposal_id || null
                });
                return;
            }

            respond({
                success: false,
                error: 'Tool tidak dikenali.'
            });
        } catch (error) {
            respond({
                success: false,
                error: error.message || 'Operasi gagal dijalankan.'
            });
        }
    }, [createSchedule, deleteSchedule, fetchSchedules, returnToolResult]);

    const updateAssistantTranscript = useCallback((delta, completedText) => {
        if (!delta && !completedText) return;

        const existing = assistantDraftRef.current;
        if (!existing) {
            const draft = {
                id: `assistant-${Date.now()}`,
                text: completedText || delta || ''
            };
            assistantDraftRef.current = draft;
            setMessages(previous => [...previous, { ...draft, role: 'assistant' }]);
            return;
        }

        const nextText = completedText || `${existing.text}${delta || ''}`;
        assistantDraftRef.current = { ...existing, text: nextText };
        setMessages(previous => previous.map(message => (
            message.id === existing.id ? { ...message, text: nextText } : message
        )));
    }, []);

    const playAudioChunk = useCallback(async (base64Audio) => {
        const context = outputAudioContextRef.current;
        if (!context || !base64Audio) return;

        if (context.state === 'suspended') await context.resume();

        const samples = decodePcm16(base64Audio);
        const buffer = context.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
        buffer.copyToChannel(samples, 0);

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        outputSourcesRef.current.add(source);
        source.onended = () => outputSourcesRef.current.delete(source);

        const startAt = Math.max(context.currentTime + 0.02, outputStartTimeRef.current);
        source.start(startAt);
        outputStartTimeRef.current = startAt + buffer.duration;
        setActivity('speaking');
    }, []);

    const configureAudioInput = useCallback(async (stream) => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const inputContext = new AudioContextClass();
        const outputContext = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
        inputAudioContextRef.current = inputContext;
        outputAudioContextRef.current = outputContext;
        outputStartTimeRef.current = outputContext.currentTime;

        await Promise.all([inputContext.resume(), outputContext.resume()]);

        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(2048, 1, 1);
        const silentGain = inputContext.createGain();
        silentGain.gain.value = 0;

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputContext.destination);
        inputSourceRef.current = source;
        inputProcessorRef.current = processor;
        inputGainRef.current = silentGain;

        processor.onaudioprocess = event => {
            if (!isGeminiReadyRef.current || isMutedRef.current) return;

            const channelData = event.inputBuffer.getChannelData(0);
            const encodedAudio = encodePcm16(channelData, inputContext.sampleRate);
            sendEvent({
                realtimeInput: {
                    audio: {
                        data: encodedAudio,
                        mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`
                    }
                }
            });
        };
    }, [sendEvent]);

    const handleServerEvent = useCallback((event) => {
        if (event.setupComplete) {
            isGeminiReadyRef.current = true;
            setStatus('connected');
            setActivity('speaking');
            sendEvent({
                realtimeInput: {
                    text: 'Sapa pengguna secara singkat, perkenalkan diri sebagai asisten jadwal Greenhouse Cibatu, lalu tanyakan jadwal apa yang ingin dibantu.'
                }
            });
            return;
        }

        if (event.toolCall?.functionCalls?.length) {
            setActivity('thinking');
            event.toolCall.functionCalls.forEach(handleToolCall);
        }

        const content = event.serverContent;
        if (content) {
            if (content.inputTranscription?.text) {
                if (deleteProposalRef.current && deleteProposalPresentedRef.current) {
                    deleteConfirmationEligibleRef.current = true;
                }
                setActivity('thinking');
            }
            if (content.outputTranscription?.text) {
                updateAssistantTranscript(content.outputTranscription.text);
            }

            (content.modelTurn?.parts || []).forEach(part => {
                if (part.inlineData?.data) {
                    playAudioChunk(part.inlineData.data).catch(error => {
                        console.error('Gagal memainkan audio Gemini:', error);
                    });
                }
            });

            if (content.interrupted) {
                stopPlayback();
                assistantDraftRef.current = null;
                setActivity('listening');
            }

            if (content.turnComplete) {
                if (deleteProposalRef.current) {
                    deleteProposalPresentedRef.current = true;
                }
                assistantDraftRef.current = null;
                setActivity(isMutedRef.current ? 'muted' : 'listening');
            }
        }

        if (event.error) {
            console.error('Gemini Live error:', event.error);
            setErrorMessage(event.error.message || 'Percakapan Gemini Live mengalami gangguan.');
            setStatus('error');
            setActivity('idle');
        }
    }, [handleToolCall, playAudioChunk, sendEvent, stopPlayback, updateAssistantTranscript]);

    const startSession = useCallback(async () => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!navigator.mediaDevices?.getUserMedia || !window.WebSocket || !AudioContextClass) {
            setErrorMessage('Browser ini belum mendukung percakapan suara langsung. Gunakan Chrome, Edge, atau Safari versi terbaru.');
            setStatus('error');
            return;
        }

        stopSession();
        isStoppingRef.current = false;
        setStatus('connecting');
        setActivity('connecting');
        setErrorMessage('');
        setMessages([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;
            await configureAudioInput(stream);

            const tokenResponse = await authFetch('/api/ai/realtime/token');
            const tokenData = await tokenResponse.json();
            if (!tokenResponse.ok || !tokenData.value) {
                throw new Error(tokenData.error || 'Gagal menyiapkan layanan Gemini Live.');
            }

            const socket = new WebSocket(`${GEMINI_WS_ENDPOINT}?access_token=${encodeURIComponent(tokenData.value)}`);
            socket.binaryType = 'arraybuffer';
            socketRef.current = socket;
            let setupTimeoutId = null;

            socket.addEventListener('open', () => {
                socket.send(JSON.stringify({
                    setup: {
                        model: `models/${tokenData.model}`,
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: tokenData.voice || 'Kore'
                                    }
                                }
                            }
                        },
                        systemInstruction: {
                            parts: [{ text: getSessionInstructions() }]
                        },
                        tools: [{ functionDeclarations: GEMINI_TOOLS }],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        realtimeInputConfig: {
                            automaticActivityDetection: {
                                disabled: false,
                                prefixPaddingMs: 100,
                                silenceDurationMs: 650
                            }
                        }
                    }
                }));

                setupTimeoutId = window.setTimeout(() => {
                    if (socketRef.current !== socket || isGeminiReadyRef.current) return;

                    stopSession();
                    setErrorMessage('Gemini Live tidak merespons dalam 15 detik. Silakan coba hubungkan kembali.');
                    setStatus('error');
                    setActivity('idle');
                }, 15000);
            });

            socket.addEventListener('message', async message => {
                if (socketRef.current !== socket) return;

                try {
                    const event = await parseGeminiSocketMessage(message.data);
                    if (event.setupComplete && setupTimeoutId) {
                        window.clearTimeout(setupTimeoutId);
                        setupTimeoutId = null;
                    }
                    handleServerEvent(event);
                } catch (error) {
                    console.error('Pesan Gemini Live tidak valid:', error);
                    setErrorMessage('Respons Gemini Live tidak dapat dibaca. Silakan hubungkan kembali.');
                    setStatus('error');
                    setActivity('idle');
                }
            });

            socket.addEventListener('error', () => {
                if (setupTimeoutId) window.clearTimeout(setupTimeoutId);
                if (socketRef.current !== socket || isStoppingRef.current) return;
                setErrorMessage('Koneksi WebSocket ke Gemini Live gagal. Periksa jaringan dan konfigurasi API.');
                setStatus('error');
                setActivity('idle');
            });

            socket.addEventListener('close', event => {
                if (setupTimeoutId) window.clearTimeout(setupTimeoutId);
                isGeminiReadyRef.current = false;
                if (socketRef.current !== socket || isStoppingRef.current) return;

                const reason = event.reason ? ` ${event.reason}` : '';
                setErrorMessage(`Koneksi Gemini Live terputus.${reason}`);
                setStatus('error');
                setActivity('idle');
            });
        } catch (error) {
            stopSession();
            const message = error.name === 'NotAllowedError'
                ? 'Izin mikrofon ditolak. Izinkan mikrofon lalu coba lagi.'
                : error.message || 'Gagal memulai percakapan Gemini Live.';
            setErrorMessage(message);
            setStatus('error');
            setActivity('idle');
            showToast('error', message, 'error');
        }
    }, [authFetch, configureAudioInput, handleServerEvent, showToast, stopSession]);

    const toggleMute = () => {
        const nextMuted = !isMuted;
        isMutedRef.current = nextMuted;
        streamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = !nextMuted;
        });
        if (nextMuted) sendEvent({ realtimeInput: { audioStreamEnd: true } });
        setIsMuted(nextMuted);
        setActivity(nextMuted ? 'muted' : 'listening');
    };

    const closeAssistant = () => {
        stopSession();
        onClose();
    };

    useEffect(() => {
        if (!isOpen) stopSession();
        return () => stopSession();
    }, [isOpen, stopSession]);

    if (!isOpen) return null;

    const activityLabel = {
        idle: 'Siap memulai',
        connecting: 'Menyiapkan percakapan…',
        listening: isMuted ? 'Mikrofon dimatikan' : 'Silakan bicara, aku mendengarkan',
        thinking: 'Sedang memahami permintaanmu…',
        speaking: 'Asisten sedang berbicara',
        muted: 'Mikrofon dimatikan'
    }[activity];

    return (
        <div className="fixed inset-0 z-[120] bg-background">
            <div className="max-w-md mx-auto h-full min-h-0 flex flex-col bg-gradient-to-b from-primary/10 via-background to-background">
                <header className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-title-md text-title-md text-on-surface">Asisten Greenhouse AI</h2>
                                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[9px] font-bold tracking-wider">BETA</span>
                            </div>
                            <p className="font-label-caps text-label-caps text-outline">Gemini Live • Percakapan suara langsung</p>
                        </div>
                    </div>
                    <button onClick={closeAssistant} className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors" aria-label="Tutup asisten AI">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${status === 'connected' ? 'bg-primary shadow-[0_0_0_16px_rgba(15,82,56,0.08),0_16px_40px_rgba(15,82,56,0.25)]' : 'bg-surface-container-high text-outline'}`}>
                            {status === 'connected' ? (
                                <div className="flex items-center gap-1 h-12" aria-hidden="true">
                                    {[18, 34, 46, 28, 42, 22, 36].map((height, index) => (
                                        <span
                                            key={index}
                                            className={`w-1.5 rounded-full bg-white transition-all ${['speaking', 'listening'].includes(activity) ? 'animate-pulse' : ''}`}
                                            style={{ height: `${activity === 'thinking' ? 12 : height}px`, animationDelay: `${index * 90}ms` }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span className="material-symbols-outlined text-5xl">record_voice_over</span>
                            )}
                            {status === 'connected' && (
                                <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-success border-4 border-background flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>check</span>
                                </span>
                            )}
                        </div>
                        <p className="font-title-md text-title-md text-on-surface mt-5">{activityLabel}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-xs">
                            Bicara seperti biasa. Kamu boleh memotong pembicaraan asisten kapan saja.
                        </p>
                    </div>

                    {status === 'idle' && (
                        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm space-y-4">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                                <div>
                                    <h3 className="font-label-bold text-label-bold text-on-surface">Coba katakan secara natural</h3>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">“Tolong jadwalkan penyiraman jam dua belas siang.”</p>
                                </div>
                            </div>
                            <p className="font-label-caps text-label-caps text-outline">
                                Asisten akan menanyakan detail yang belum jelas dan meminta persetujuan sebelum benar-benar menyimpan jadwal.
                            </p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="bg-error/10 border border-error/20 rounded-2xl p-4 flex gap-3 text-error">
                            <span className="material-symbols-outlined">error</span>
                            <p className="font-body-sm text-body-sm flex-1">{errorMessage}</p>
                        </div>
                    )}

                    {messages.length > 0 && (
                        <div className="space-y-3">
                            <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest px-1">Percakapan</p>
                            {messages.slice(-6).map(message => (
                                <div
                                    key={message.id}
                                    className={`rounded-2xl p-4 border ${message.role === 'assistant' ? 'bg-surface-container-lowest border-outline-variant/20' : message.role === 'success' ? 'bg-primary/10 border-primary/20' : 'bg-secondary/10 border-secondary/20'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined ${message.role === 'success' ? 'text-primary' : message.role === 'system' ? 'text-secondary' : 'text-outline'}`} style={{ fontSize: '19px' }}>
                                            {message.role === 'success' ? 'task_alt' : message.role === 'system' ? 'pending_actions' : 'smart_toy'}
                                        </span>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{message.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {proposal && (
                        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-secondary">
                                <span className="material-symbols-outlined">event_note</span>
                                <h3 className="font-label-bold text-label-bold">Menunggu konfirmasi suara</h3>
                            </div>
                            <div className="text-on-surface">
                                <p className="font-title-md text-title-md">{proposal.schedule.name}</p>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                    {proposal.schedule.type === 'water' ? 'Air' : 'Pupuk'} • {formatScheduleDays(proposal.schedule.days)} • {proposal.schedule.time} • {proposal.schedule.duration} menit
                                </p>
                            </div>
                            {proposal.warnings.map((warning, index) => (
                                <p key={index} className="font-label-caps text-label-caps text-[#8A5200] flex gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>warning</span>
                                    {warning}
                                </p>
                            ))}
                            <p className="font-label-caps text-label-caps text-outline">Ucapkan “setuju” untuk menyimpan atau “batal” untuk membatalkan.</p>
                        </div>
                    )}

                    {deleteProposal && (
                        <div className="bg-error/10 border border-error/25 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-error">
                                <span className="material-symbols-outlined">delete_forever</span>
                                <h3 className="font-label-bold text-label-bold">Menunggu konfirmasi penghapusan</h3>
                            </div>
                            <div className="text-on-surface">
                                <p className="font-title-md text-title-md">{deleteProposal.schedule.name}</p>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                    {deleteProposal.summary}
                                </p>
                            </div>
                            <p className="font-label-caps text-label-caps text-error">
                                Ucapkan “ya, hapus” untuk menghapus permanen atau “batal” untuk mempertahankan jadwal.
                            </p>
                        </div>
                    )}
                </main>

                <footer className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur-xl pb-safe">
                    {status === 'connected' ? (
                        <div className="flex items-center justify-center gap-5">
                            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface'}`} aria-label={isMuted ? 'Nyalakan mikrofon' : 'Matikan mikrofon'}>
                                <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
                            </button>
                            <button onClick={stopSession} className="h-14 px-7 rounded-full bg-error text-white font-label-bold text-label-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
                                <span className="material-symbols-outlined">call_end</span>
                                Akhiri
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={startSession}
                            disabled={status === 'connecting'}
                            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-title-md text-title-md flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all"
                        >
                            {status === 'connecting' ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined">mic</span>
                            )}
                            {status === 'connecting' ? 'Menghubungkan…' : status === 'error' ? 'Coba Lagi' : 'Mulai Percakapan'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
