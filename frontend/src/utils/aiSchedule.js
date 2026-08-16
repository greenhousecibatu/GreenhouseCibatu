const DAY_LABELS = {
    Mon: 'Senin',
    Tue: 'Selasa',
    Wed: 'Rabu',
    Thu: 'Kamis',
    Fri: 'Jumat',
    Sat: 'Sabtu',
    Sun: 'Minggu'
};

const VALID_DAYS = Object.keys(DAY_LABELS);
const VALID_TYPES = ['water', 'fertilizer'];
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

const timeToMinutes = (time) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
};

const weeklyScheduleSegments = (start, duration, days) => days.flatMap(day => {
    const dayIndex = VALID_DAYS.indexOf(day);
    const weeklyStart = (dayIndex * MINUTES_PER_DAY) + start;
    const weeklyEnd = weeklyStart + duration;
    if (weeklyEnd <= MINUTES_PER_WEEK) return [[weeklyStart, weeklyEnd]];
    return [[weeklyStart, MINUTES_PER_WEEK], [0, weeklyEnd - MINUTES_PER_WEEK]];
});

const rangesOverlap = (left, right) => left[0] < right[1] && right[0] < left[1];

export const formatScheduleDays = (days = []) => {
    const uniqueDays = VALID_DAYS.filter(day => days.includes(day));
    if (uniqueDays.length === 7) return 'setiap hari';
    return uniqueDays.map(day => DAY_LABELS[day]).join(', ');
};

export const buildScheduleName = ({ name, type, time }) => {
    const cleanedName = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    if (cleanedName) return cleanedName;
    return `${type === 'fertilizer' ? 'Pemupukan' : 'Penyiraman'} ${time}`;
};

export const validateScheduleProposal = (proposal, schedules = []) => {
    const errors = [];
    const warnings = [];
    const type = proposal?.type;
    const time = proposal?.time;
    const duration = Number(proposal?.duration);
    const days = Array.isArray(proposal?.days)
        ? [...new Set(proposal.days.filter(day => VALID_DAYS.includes(day)))]
        : [];
    const start = timeToMinutes(time);

    if (!VALID_TYPES.includes(type)) {
        errors.push('Jenis aktuator harus air atau pupuk.');
    }
    if (start === null) {
        errors.push('Jam harus memakai format 24 jam HH:MM.');
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 120) {
        errors.push('Durasi harus berupa 1 sampai 120 menit.');
    }
    if (days.length === 0) {
        errors.push('Minimal satu hari harus dipilih.');
    }

    if (errors.length === 0) {
        const proposedSegments = weeklyScheduleSegments(start, duration, days);
        const conflicts = schedules.filter(schedule => {
            if (!schedule.enabled || schedule.method !== 'alarm') return false;
            const existingStart = timeToMinutes(schedule.time);
            const existingDuration = Number(schedule.duration);
            if (existingStart === null || !existingDuration) return false;

            const existingDays = (schedule.days || []).filter(day => VALID_DAYS.includes(day));
            const existingSegments = weeklyScheduleSegments(existingStart, existingDuration, existingDays);
            return proposedSegments.some(segment => (
                existingSegments.some(existingSegment => rangesOverlap(segment, existingSegment))
            ));
        });

        if (conflicts.length > 0) {
            const names = conflicts.slice(0, 3).map(schedule => `“${schedule.name}”`).join(', ');
            warnings.push(
                `Waktunya bertumpuk dengan ${names}. ESP32 hanya menjalankan satu jadwal pada satu waktu, sehingga salah satunya dapat terlewat.`
            );
        }

        const hour = Math.floor(start / 60);
        if (type === 'water' && hour >= 10 && hour < 15) {
            warnings.push(
                'Penyiraman pukul 10.00–15.00 umumnya kurang efisien karena penguapan lebih tinggi. Pertimbangkan pagi atau sore; ini saran umum karena greenhouse tidak memiliki sensor.'
            );
        }

        if (duration > 30) {
            warnings.push(
                'Durasi di atas 30 menit cukup panjang. Karena tidak ada sensor, pastikan kapasitas air dan kondisi tanaman sudah diperiksa langsung.'
            );
        }
    }

    const normalized = errors.length === 0 ? {
        name: buildScheduleName({ ...proposal, type, time }),
        type,
        method: 'alarm',
        time,
        duration,
        days,
        interval_value: 0,
        is_active: true
    } : null;

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        schedule: normalized,
        summary: normalized
            ? `${normalized.type === 'water' ? 'Air' : 'Pupuk'} • ${formatScheduleDays(normalized.days)} • ${normalized.time} • ${normalized.duration} menit`
            : null
    };
};
