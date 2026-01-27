/**
 * CouncilRoom - War Room / Konsey Masası
 *
 * Yapılacaklar 3.txt - "GÖRSEL VE UX DEVRİMİ":
 * "War Room" (Savaş Odası) Görünümü
 * - Canlı Konsey: Ekranın ortasında bir yuvarlak masa
 * - Her modül (Atlas, Hermes vb.) bir "Avatar" ile temsil ediliyor
 * - Konuşma Balonları: Hermes: "CEO istifa söylentisi var!"
 * - Efekt: Arka planda piyasa düşüyorsa kırmızı yağmur/sis
 *
 * Generative UI temelli, canlı konsey tartışma görünümü
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ModulGorus, OyTipi } from '@analysis/council';

// ============ STYLES ============
const styles = {
    container: 'relative w-full h-full min-h-[600px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden',
    table: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    avatar: 'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 cursor-pointer',
    avatarActive: 'ring-4 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]',
    avatarNegative: 'ring-4 ring-red-400 shadow-[0_0_30px_rgba(248,113,113,0.5)]',
    speechBubble: 'absolute bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 max-w-[200px] text-sm shadow-xl',
    centerDisplay: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20',
    verdictBadge: 'px-6 py-3 rounded-full text-xl font-bold shadow-2xl',
    pulseAnimation: 'animate-pulse',
    floatingParticle: 'absolute rounded-full pointer-events-none',
};

// ============ TYPES ============

interface CouncilRoomProps {
    symbol: string;
    gorusler: ModulGorus[];
    finalKarar: OyTipi;
    konsensus: number;
    piyasaRejimi?: string;
    onModulClick?: (modul: string) => void;
}

interface AvatarPosition {
    modul: string;
    angle: number;  // Derece cinsinden (0-360)
    distance: number;  // Merkezden uzaklık (px)
}

interface SpeechBubble {
    modul: string;
    text: string;
    visible: boolean;
    x: number;
    y: number;
}

// ============ MODül KONFiGÜRASYONLARI ============

const MODUL_AVATARS: Record<string, { icon: string; color: string; gradient: string }> = {
    'Atlas': { icon: '📊', color: 'emerald', gradient: 'from-emerald-500 to-emerald-700' },
    'Orion': { icon: '📈', color: 'blue', gradient: 'from-blue-500 to-blue-700' },
    'Athena': { icon: '🦉', color: 'purple', gradient: 'from-purple-500 to-purple-700' },
    'Hermes': { icon: '🐦', color: 'cyan', gradient: 'from-cyan-500 to-cyan-700' },
    'Aether': { icon: '🌍', color: 'orange', gradient: 'from-orange-500 to-orange-700' },
    'Phoenix': { icon: '🔥', color: 'red', gradient: 'from-red-500 to-red-700' },
    'Cronos': { icon: '⏰', color: 'indigo', gradient: 'from-indigo-500 to-indigo-700' },
    'Chiron': { icon: '🛡️', color: 'rose', gradient: 'from-rose-500 to-rose-700' },
    'Demeter': { icon: '⭐', color: 'yellow', gradient: 'from-yellow-500 to-yellow-700' },
    'Poseidon': { icon: '🔱', color: 'teal', gradient: 'from-teal-500 to-teal-700' },
    'Prometheus': { icon: '🔮', color: 'violet', gradient: 'from-violet-500 to-violet-700' },
};

const COUNCIL_TABLE_RADIUS = 180;  // Masa yarıçapı (desktop)
const AVATAR_DISTANCE = 220;      // Avatar mesafesi (desktop)

// Responsive boyutlar - mobilde küçült
function getResponsiveSize(): { tableRadius: number; avatarDistance: number } {
    if (typeof window === 'undefined') {
        return { tableRadius: COUNCIL_TABLE_RADIUS, avatarDistance: AVATAR_DISTANCE };
    }
    const width = window.innerWidth;
    // Mobil (375px ve altı)
    if (width < 400) {
        return { tableRadius: 80, avatarDistance: 110 };
    }
    // Küçük mobil (400-480px)
    if (width < 480) {
        return { tableRadius: 100, avatarDistance: 130 };
    }
    // Tablet portrait (480-768px)
    if (width < 768) {
        return { tableRadius: 140, avatarDistance: 180 };
    }
    // Tablet ve desktop
    return { tableRadius: COUNCIL_TABLE_RADIUS, avatarDistance: AVATAR_DISTANCE };
}

// ============ AVATAR POSISYONLARI ============

function getAvatarPositions(count: number): AvatarPosition[] {
    const positions: AvatarPosition[] = [];
    const angleStep = 360 / count;
    const { avatarDistance } = getResponsiveSize();

    for (let i = 0; i < count; i++) {
        const angle = angleStep * i - 90;  // -90 derece ile başla (üstten)
        positions.push({
            modul: '',
            angle,
            distance: avatarDistance,
        });
    }

    return positions;
}

// ============ BACKGROUND EFFECTS ============

interface BackgroundEffectsProps {
    piyasaRejimi?: string;
    finalKarar: OyTipi;
}

function BackgroundEffects({ piyasaRejimi, finalKarar }: BackgroundEffectsProps) {
    const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

    React.useEffect(() => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    const getBackgroundGradient = () => {
        if (finalKarar === 'AL') {
            return 'bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900';
        } else if (finalKarar === 'SAT') {
            return 'bg-gradient-to-br from-red-900/30 via-slate-900 to-slate-900';
        }
        return 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900';
    };

    const getParticleColor = () => {
        if (finalKarar === 'AL') return 'bg-emerald-400/20';
        if (finalKarar === 'SAT') return 'bg-red-400/20';
        return 'bg-slate-400/10';
    };

    return (
        <div className={`absolute inset-0 ${getBackgroundGradient()} transition-all duration-1000`}>
            {/* Parçacık efektleri */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`${styles.floatingParticle} ${getParticleColor()} w-2 h-2`}
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        animation: `float 8s ease-in-out ${p.delay}s infinite`,
                    }}
                />
            ))}

            {/* Piyasa rejimioverlay */}
            {piyasaRejimi === 'RISK_OFF' && (
                <div className="absolute inset-0 bg-red-900/10 animate-pulse" />
            )}
            {piyasaRejimi === 'RISK_ON' && (
                <div className="absolute inset-0 bg-emerald-900/10 animate-pulse" />
            )}

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}

// ============ AVATAR COMPONENT ============

interface AvatarProps {
    modul: string;
    gorus: ModulGorus;
    position: AvatarPosition;
    isActive: boolean;
    onClick?: () => void;
}

function Avatar({ modul, gorus, position, isActive, onClick }: AvatarProps) {
    const config = MODUL_AVATARS[gorus.modul] || { icon: '🤖', color: 'gray', gradient: 'from-gray-500 to-gray-700' };

    // Pozisyon hesapla (yüzde olarak)
    const x = 50 + Math.cos((position.angle * Math.PI) / 180) * 35;  // %35 yarıçap
    const y = 50 + Math.sin((position.angle * Math.PI) / 180) * 35;

    const ringColor = gorus.oy === 'AL' ? 'ring-emerald-400' : gorus.oy === 'SAT' ? 'ring-red-400' : 'ring-yellow-400';
    const bgColor = gorus.oy === 'AL' ? 'bg-emerald-500/20' : gorus.oy === 'SAT' ? 'bg-red-500/20' : 'bg-yellow-500/20';

    return (
        <div
            className={`${styles.avatar} ${isActive ? styles.avatarActive : ''} ${isActive ? ringColor : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={onClick}
        >
            {/* Avatar Container */}
            <div className={`relative w-16 h-16 rounded-full ${bgColor} backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-3xl shadow-xl hover:shadow-2xl transition-all`}>
                {config.icon}

                {/* Güven göstergesi */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-xs font-bold">
                    {gorus.guven}
                </div>
            </div>

            {/* Modül ismi */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium text-slate-300">
                {gorus.modul.replace(' V3', '').replace(' V2', '').split(' ')[0]}
            </div>

            {/* Oy göstergesi */}
            <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${
                gorus.oy === 'AL' ? 'bg-emerald-500 text-white' :
                gorus.oy === 'SAT' ? 'bg-red-500 text-white' :
                'bg-yellow-500 text-black'
            }`}>
                {gorus.oy}
            </div>
        </div>
    );
}

// ============ SPEECH BUBBLE ============

interface SpeechBubbleProps {
    gorus: ModulGorus;
    position: AvatarPosition;
    visible: boolean;
}

function SpeechBubble({ gorus, position, visible }: SpeechBubbleProps) {
    if (!visible) return null;

    const x = 50 + Math.cos((position.angle * Math.PI) / 180) * 50;
    const y = 50 + Math.sin((position.angle * Math.PI) / 180) * 50;

    // Balon pozisyonunu ayarla (avatarın dış tarafına)
    const bubbleX = x > 50 ? x + 8 : x - 8;
    const bubbleY = y;

    return (
        <div
            className={`${styles.speechBubble} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            style={{
                left: `${bubbleX}%`,
                top: `${bubbleY}%`,
                transform: `translate(-50%, -100%) translateY(-10px)`,
            }}
        >
            {/* Ok işareti */}
            <div
                className="absolute w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45"
                style={{
                    left: x > 50 ? 'auto' : '-6px',
                    right: x > 50 ? '-6px' : 'auto',
                    bottom: '-6px',
                }}
            />

            {/* İçerik */}
            <p className="text-slate-200 text-sm leading-snug">
                {gorus.gorus?.substring(0, 80)}{gorus.gorus?.length > 80 ? '...' : ''}
            </p>

            {/* Sinyal */}
            {gorus.sinyal && (
                <div className="mt-2 text-xs font-semibold text-emerald-400">
                    {gorus.sinyal}
                </div>
            )}
        </div>
    );
}

// ============ CENTER DISPLAY ============

interface CenterDisplayProps {
    symbol: string;
    finalKarar: OyTipi;
    konsensus: number;
}

function CenterDisplay({ symbol, finalKarar, konsensus }: CenterDisplayProps) {
    const bgColor = finalKarar === 'AL' ? 'bg-emerald-500' : finalKarar === 'SAT' ? 'bg-red-500' : 'bg-yellow-500';
    const textColor = finalKarar === 'BEKLE' ? 'text-black' : 'text-white';
    const { tableRadius } = getResponsiveSize();

    // Responsive boyut hesaplama
    const containerSize = Math.round(tableRadius * 0.9);
    const fontSize = containerSize < 100 ? 'text-xl' : containerSize < 150 ? 'text-2xl' : 'text-3xl';
    const subFontSize = containerSize < 100 ? 'text-xs' : 'text-xs';

    return (
        <div className={styles.centerDisplay}>
            {/* Yuvarlak masa - responsive boyut */}
            <div
                className="rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-4 border-slate-600 shadow-2xl flex items-center justify-center"
                style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
            >
                {/* Hologram efekti */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent animate-pulse" />

                {/* Sembol */}
                <div className="text-center z-10 px-2">
                    <div className={`font-bold text-white mb-1 ${fontSize}`}>{symbol}</div>
                    <div className={`${subFontSize} text-slate-400`}>Konsensus</div>
                    <div className="text-sm font-bold text-emerald-400">%{konsensus}</div>
                </div>
            </div>

            {/* Karar Rozeti */}
            <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: `-${containerSize * 0.4}px` }}>
                <div className={`${styles.verdictBadge} ${bgColor} ${textColor} ${styles.pulseAnimation} text-sm px-4 py-2`}>
                    {finalKarar === 'AL' && '🟢 AL'}
                    {finalKarar === 'SAT' && '🔴 SAT'}
                    {finalKarar === 'BEKLE' && '🟡 BEKLE'}
                </div>
            </div>
        </div>
    );
}

// ============ MODül DETAY PANELi ============

interface ModulDetailPanelProps {
    gorus: ModulGorus | null;
    onClose: () => void;
}

function ModulDetailPanel({ gorus, onClose }: ModulDetailPanelProps) {
    if (!gorus) return null;

    const config = MODUL_AVATARS[gorus.modul] || { icon: '🤖', color: 'gray', gradient: 'from-gray-500 to-gray-700' };

    return (
        <div className="absolute top-4 right-4 w-80 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-2xl animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                        <h3 className="font-bold text-white">{gorus.modul}</h3>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            gorus.oy === 'AL' ? 'bg-emerald-500/20 text-emerald-400' :
                            gorus.oy === 'SAT' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {gorus.oy}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Güven skor */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Güven</span>
                    <span className="text-white font-bold">%{gorus.guven}</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${gorus.guven >= 70 ? 'bg-emerald-500' : gorus.guven >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${gorus.guven}%` }}
                    />
                </div>
            </div>

            {/* Sinyal */}
            {gorus.sinyal && (
                <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Sinyal</div>
                    <div className="text-sm font-bold text-emerald-400">{gorus.sinyal}</div>
                </div>
            )}

            {/* Görüş */}
            <div className="text-sm text-slate-300 leading-relaxed">
                {gorus.gorus}
            </div>
        </div>
    );
}

// ============ MAIN COUNCIL ROOM COMPONENT ============

export function CouncilRoom({
    symbol,
    gorusler,
    finalKarar,
    konsensus,
    piyasaRejimi,
    onModulClick,
}: CouncilRoomProps) {
    const [selectedModul, setSelectedModul] = useState<string | null>(null);
    const [activeBubble, setActiveBubble] = useState<string | null>(null);
    const [rotatingBubbles, setRotatingBubbles] = useState(false);

    // Otomatik konuşma balonu rotasyonu
    React.useEffect(() => {
        if (!rotatingBubbles) return;

        const interval = setInterval(() => {
            const currentIndex = gorusler.findIndex(g => g.modul === activeBubble);
            const nextIndex = (currentIndex + 1) % gorusler.length;
            setActiveBubble(gorusler[nextIndex]?.modul || null);
        }, 3000);

        return () => clearInterval(interval);
    }, [rotatingBubbles, activeBubble, gorusler]);

    const avatarPositions = getAvatarPositions(gorusler.length);
    const selectedGorus = gorusler.find(g => g.modul === selectedModul) || null;

    return (
        <div className={styles.container}>
            {/* Arka plan efektleri */}
            <BackgroundEffects piyasaRejimi={piyasaRejimi} finalKarar={finalKarar} />

            {/* Konsey Masası */}
            <div className={styles.table}>
                {/* Avatarlar */}
                {gorusler.map((gorus, i) => {
                    const position = { ...avatarPositions[i], modul: gorus.modul };
                    const isActive = selectedModul === gorus.modul;

                    return (
                        <React.Fragment key={gorus.modul}>
                            <Avatar
                                modul={gorus.modul}
                                gorus={gorus}
                                position={position}
                                isActive={isActive}
                                onClick={() => {
                                    setSelectedModul(gorus.modul);
                                    setActiveBubble(gorus.modul);
                                    onModulClick?.(gorus.modul);
                                }}
                            />
                            <SpeechBubble
                                gorus={gorus}
                                position={position}
                                visible={activeBubble === gorus.modul}
                            />
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Merkez ekran */}
            <CenterDisplay
                symbol={symbol}
                finalKarar={finalKarar}
                konsensus={konsensus}
            />

            {/* Detay paneli */}
            <ModulDetailPanel
                gorus={selectedGorus}
                onClose={() => setSelectedModul(null)}
            />

            {/* Kontrol butonları */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                    onClick={() => setRotatingBubbles(!rotatingBubbles)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        rotatingBubbles
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    🗣️ Otomatik Konuşma
                </button>
                <button
                    onClick={() => setActiveBubble(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                    Temizle
                </button>
            </div>
        </div>
    );
}

// ============ COMPACT VARIANT (Daha küçük ekranlar için) ============

interface CompactCouncilRoomProps {
    gorusler: ModulGorus[];
    finalKarar: OyTipi;
    konsensus: number;
}

export function CompactCouncilRoom({ gorusler, finalKarar, konsensus }: CompactCouncilRoomProps) {
    return (
        <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            {/* Karar Rozeti */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">
                        {finalKarar === 'AL' ? '🟢' : finalKarar === 'SAT' ? '🔴' : '🟡'}
                    </span>
                    <span className="text-lg font-bold text-white">{finalKarar}</span>
                </div>
                <div className="text-sm text-slate-400">
                    Konsensus: <span className="font-bold text-emerald-400">%{konsensus}</span>
                </div>
            </div>

            {/* Modül avatarları (tek satır) */}
            <div className="flex flex-wrap gap-3 justify-center">
                {gorusler.map((gorus) => {
                    const config = MODUL_AVATARS[gorus.modul] || { icon: '🤖', color: 'gray', gradient: '' };
                    const bgColor = gorus.oy === 'AL' ? 'bg-emerald-500/20' : gorus.oy === 'SAT' ? 'bg-red-500/20' : 'bg-yellow-500/20';

                    return (
                        <div
                            key={gorus.modul}
                            className={`w-12 h-12 rounded-full ${bgColor} border border-white/10 flex items-center justify-center text-xl cursor-pointer hover:scale-110 transition-transform`}
                            title={`${gorus.modul}: ${gorus.oy} (%${gorus.guven})`}
                        >
                            {config.icon}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CouncilRoom;
