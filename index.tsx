
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './components/Player';
import { GameState, TargetData, ScoreStats, GameSettings, Language } from './types';
import {
  GAME_DURATION,
  SPAWN_AREA_WIDTH,
  SPAWN_AREA_HEIGHT,
  SPAWN_DISTANCE,
  TARGET_RADIUS,
  COLOR_TARGET,
  TRANSLATIONS
} from './constants';

// --- 3D Scene Components ---

const ShootingRangeEnvironment = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Grid on Floor */}
      <Grid 
        infiniteGrid 
        fadeDistance={25} 
        sectionColor="#555" 
        cellColor="#333" 
        position={[0, 0.01, 0]} 
      />

      {/* Back Wall (Target Area) */}
      <mesh position={[0, 5, -SPAWN_DISTANCE - 2]} receiveShadow>
        <boxGeometry args={[40, 15, 1]} />
        <meshStandardMaterial color="#444" roughness={0.9} />
      </mesh>

      {/* Side Walls */}
      <mesh position={[-15, 5, -10]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[40, 15, 1]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[15, 5, -10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[40, 15, 1]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>

      {/* Ceiling Lights Area */}
      <mesh position={[0, 8, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 30]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>
      <spotLight position={[0, 10, 0]} intensity={0.8} angle={1} penumbra={0.5} castShadow />
      
      {/* Environment for reflections on glossy targets */}
      <Environment preset="city" />
    </group>
  );
};

const Target: React.FC<{ position: [number, number, number], size: number }> = ({ position, size }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if(meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      // Gentle rotation
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <sphereGeometry args={[size, 64, 64]} />
      {/* Improved 3D Material for "Orb" look */}
      <meshPhysicalMaterial 
        color={COLOR_TARGET}
        emissive={COLOR_TARGET}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
};

// --- Game Logic Helpers ---

const DEFAULT_SETTINGS: GameSettings = {
  targetCount: 3,
  targetSize: TARGET_RADIUS,
  duration: 60,
  crosshair: 'dot',
  sensitivity: 1,
  language: 'zh', // Default to Chinese as requested
};

const generateTarget = (currentList: TargetData[]): TargetData => {
  const x = (Math.random() - 0.5) * SPAWN_AREA_WIDTH;
  // Adjusted vertical spawn range to be more eye-level (around 2.0 height)
  // New range: 1.2 to 3.7
  const y = 1.2 + Math.random() * 2.5; 
  const z = -SPAWN_DISTANCE; 
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    position: [x, y, z],
    createdAt: Date.now(),
    spawnTime: Date.now(),
  };
};

// --- UI Components ---

const Scoreboard = ({ stats, settings, onRestart, onMenu }: { stats: ScoreStats, settings: GameSettings, onRestart: () => void, onMenu: () => void }) => {
  const t = TRANSLATIONS[settings.language];
  
  // Calculate Standard Deviation for Consistency
  const reactionTimes = stats.hitHistory.map(h => h.reactionTime);
  const avgReaction = stats.avgReactionTime;
  const variance = reactionTimes.reduce((acc, val) => acc + Math.pow(val - avgReaction, 2), 0) / (reactionTimes.length || 1);
  const stdDev = Math.sqrt(variance);

  // Determine Grade
  let grade = 'D';
  let gradeLabel = t.grade_d;
  let gradeColor = 'text-gray-400';

  // Simple grading logic: High accuracy + Fast reaction = High Grade
  // Score depends on pure hit count mostly, but let's factor speed
  if (stats.accuracy > 90 && avgReaction < 350) { grade = 'S'; gradeLabel = t.grade_s; gradeColor = 'text-yellow-400'; }
  else if (stats.accuracy > 85 && avgReaction < 450) { grade = 'A'; gradeLabel = t.grade_a; gradeColor = 'text-purple-400'; }
  else if (stats.accuracy > 75 && avgReaction < 550) { grade = 'B'; gradeLabel = t.grade_b; gradeColor = 'text-blue-400'; }
  else if (stats.accuracy > 60) { grade = 'C'; gradeLabel = t.grade_c; gradeColor = 'text-green-400'; }

  // Simple SVG Line Chart for Reaction Time
  const renderChart = () => {
    if (stats.hitHistory.length < 2) return <div className="text-gray-500 text-sm italic py-8">No data for chart / 数据不足</div>;

    const height = 80;
    const width = 300;
    const padding = 5;
    
    const maxReaction = Math.max(...stats.hitHistory.map(h => h.reactionTime)) * 1.1;
    
    const points = stats.hitHistory.map((h, i) => {
      const x = padding + (i / (stats.hitHistory.length - 1)) * (width - padding * 2);
      const y = height - padding - (h.reactionTime / maxReaction) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full flex flex-col items-center mt-4">
        <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-widest">{t.report_chart_title}</h4>
        <div className="w-full bg-black/40 rounded-lg p-2 border border-white/5">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <polyline
              fill="none"
              stroke="#00ffcc"
              strokeWidth="2"
              points={points}
            />
            {stats.hitHistory.map((h, i) => {
               const x = padding + (i / (stats.hitHistory.length - 1)) * (width - padding * 2);
               const y = height - padding - (h.reactionTime / maxReaction) * (height - padding * 2);
               return <circle key={i} cx={x} cy={y} r="2" fill="white" />;
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
      <div className="bg-[#151515] p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-white italic tracking-tighter">{t.report_title}</h2>
          <div className="flex items-center justify-center gap-4 mt-2">
             <div className="text-[#00ffcc] text-xl font-mono font-bold">{stats.score} PTS</div>
             <div className={`text-2xl font-black italic ${gradeColor}`}>{grade} - {gradeLabel}</div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
           {/* Accuracy */}
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:bg-black/50 transition-colors">
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t.accuracy}</div>
              <div className="text-3xl font-bold text-white">{stats.accuracy.toFixed(1)}<span className="text-sm text-gray-500">%</span></div>
           </div>

           {/* Avg Reaction */}
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:bg-black/50 transition-colors">
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t.report_avg_reaction}</div>
              <div className="text-3xl font-bold text-[#00ffcc]">{Math.round(stats.avgReactionTime)}<span className="text-sm text-gray-500">ms</span></div>
           </div>

           {/* Consistency */}
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:bg-black/50 transition-colors">
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t.report_consistency}</div>
              <div className="text-3xl font-bold text-blue-300">±{Math.round(stdDev)}<span className="text-sm text-gray-500">ms</span></div>
              <div className="text-[10px] text-gray-600 mt-1">{t.consistency_label}</div>
           </div>

           {/* Hits */}
           <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:bg-black/50 transition-colors">
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t.report_hits}</div>
              <div className="text-2xl font-bold text-white">{stats.shotsHit} <span className="text-gray-500 text-lg">/ {stats.shotsFired}</span></div>
           </div>

            {/* Avg Distance */}
           <div className="col-span-2 bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:bg-black/50 transition-colors">
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{t.report_avg_dist}</div>
              <div className="text-2xl font-bold text-white">
                 {(stats.hitHistory.reduce((acc, h) => acc + h.distance, 0) / (stats.hitHistory.length || 1)).toFixed(2)}m
              </div>
           </div>
        </div>

        {renderChart()}

        <div className="flex gap-4 mt-2">
          <button onClick={onRestart} className="flex-1 py-4 bg-[#00ffcc] hover:bg-[#00ccaa] text-black font-black text-lg rounded-xl transition-all hover:scale-[1.02]">
            {t.play_again}
          </button>
          <button onClick={onMenu} className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02]">
            {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuScreen = ({ settings, setSettings, onStart }: { settings: GameSettings, setSettings: (s: GameSettings) => void, onStart: () => void }) => {
  const t = TRANSLATIONS[settings.language];

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-50 cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
      <div className="w-full max-w-xl bg-[#151515] p-10 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffcc] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

        <h1 className="text-5xl font-black text-center text-white mb-2 italic tracking-tighter">
          {settings.language === 'zh' ? 'FPS 瞄准训练' : 'AIM TRAINER'} <span className="text-[#00ffcc]">3D</span>
        </h1>
        <p className="text-center text-gray-500 mb-8 tracking-widest text-sm uppercase">{t.subtitle}</p>
        
        <div className="space-y-6 mb-8">
          
          {/* Language Toggle */}
          <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
            <label className="text-gray-400 font-bold text-sm">{t.setting_language}</label>
            <div className="flex gap-2">
               <button 
                onClick={() => setSettings({...settings, language: 'en'})}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${settings.language === 'en' ? 'bg-[#00ffcc] text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 English
               </button>
               <button 
                onClick={() => setSettings({...settings, language: 'zh'})}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${settings.language === 'zh' ? 'bg-[#00ffcc] text-black' : 'text-gray-500 hover:text-white'}`}
               >
                 中文
               </button>
            </div>
          </div>

          {/* Target Count */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-400 font-bold text-sm">{t.setting_targets}</label>
              <span className="text-[#00ffcc] font-mono">{settings.targetCount}</span>
            </div>
            <input 
              type="range" min="1" max="10" step="1"
              value={settings.targetCount}
              onChange={(e) => setSettings({...settings, targetCount: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
            />
          </div>

          {/* Target Size */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-400 font-bold text-sm">{t.setting_size}</label>
              <span className="text-[#00ffcc] font-mono">{settings.targetSize.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.2" max="1.5" step="0.1"
              value={settings.targetSize}
              onChange={(e) => setSettings({...settings, targetSize: parseFloat(e.target.value)})}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
            />
          </div>

          {/* Crosshair */}
          <div>
            <label className="text-gray-400 font-bold text-sm block mb-3">{t.setting_crosshair}</label>
            <div className="flex gap-2">
              {['dot', 'cross', 'circle', 'plus'].map(type => (
                <button
                  key={type}
                  onClick={() => setSettings({...settings, crosshair: type as any})}
                  className={`flex-1 py-2 rounded font-bold uppercase text-xs transition-all border ${
                    settings.crosshair === type 
                    ? 'bg-[#00ffcc] text-black border-[#00ffcc]' 
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="w-full py-4 bg-[#00ffcc] hover:bg-[#00ccaa] text-black font-black text-xl rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t.start}
        </button>
      </div>
    </div>
  );
};

const Crosshair = ({ type }: { type: string }) => {
  const style: React.CSSProperties = {
     position: 'absolute',
     top: '50%',
     left: '50%',
     transform: 'translate(-50%, -50%)',
     pointerEvents: 'none',
     zIndex: 50,
  };

  if (type === 'dot') return <div style={{...style, width: '4px', height: '4px', borderRadius: '50%', background: '#00ffcc', boxShadow: '0 0 4px #00ffcc'}} />;
  
  if (type === 'cross') return (
    <div style={{...style, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
       <div style={{position: 'absolute', width: '100%', height: '2px', background: '#00ffcc'}}></div>
       <div style={{position: 'absolute', width: '2px', height: '100%', background: '#00ffcc'}}></div>
    </div>
  );

  if (type === 'circle') return <div style={{...style, width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #00ffcc'}} />;

  if (type === 'plus') return (
     <div style={{...style, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
       <div style={{position: 'absolute', width: '12px', height: '2px', background: '#00ffcc'}}></div>
       <div style={{position: 'absolute', width: '2px', height: '12px', background: '#00ffcc'}}></div>
     </div>
  );

  return null;
};

// --- Main Application ---

const App = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  // Gameplay State
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [timeLeft, setTimeLeft] = useState(settings.duration);
  const [stats, setStats] = useState<ScoreStats>({
    score: 0,
    shotsFired: 0,
    shotsHit: 0,
    accuracy: 0,
    avgReactionTime: 0,
    hitHistory: [],
  });
  
  const t = TRANSLATIONS[settings.language];

  // Handle ESC or Space for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPauseKey = e.code === 'Escape' || e.code === 'Space';
      if (isPauseKey) {
        // Prevent default Space action (scrolling) if we are in game
        if(e.code === 'Space') e.preventDefault();
        
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
        } else if (gameState === GameState.PAUSED) {
          setGameState(GameState.PLAYING);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (gameState === GameState.PLAYING) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState(GameState.FINISHED);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    setStats({ 
      score: 0, 
      shotsFired: 0, 
      shotsHit: 0, 
      accuracy: 0,
      avgReactionTime: 0,
      hitHistory: [] 
    });
    setTimeLeft(settings.duration);
    const initialTargets = Array.from({ length: settings.targetCount }).map(() => generateTarget([]));
    setTargets(initialTargets);
    setGameState(GameState.PLAYING);
  };

  const resumeGame = () => setGameState(GameState.PLAYING);
  const quitToMenu = () => setGameState(GameState.MENU);

  const handleShoot = (raycaster: THREE.Raycaster) => {
    const now = Date.now();
    
    // Find hit
    const ray = raycaster.ray;
    let hitId: string | null = null;
    let hitTarget: TargetData | null = null;
    let minDistance = Infinity;

    // Raycast against math spheres for high performance
    targets.forEach(target => {
      const sphereCenter = new THREE.Vector3(...target.position);
      // Hitbox is slightly larger than visual radius for better feel
      const sphere = new THREE.Sphere(sphereCenter, settings.targetSize * 1.1);
      
      if (ray.intersectsSphere(sphere)) {
        const distance = sphereCenter.distanceTo(ray.origin);
        if (distance < minDistance) {
          minDistance = distance;
          hitId = target.id;
          hitTarget = target;
        }
      }
    });

    const isHit = !!hitId;

    setStats(prev => {
      const newShots = prev.shotsFired + 1;
      const newHits = isHit ? prev.shotsHit + 1 : prev.shotsHit;
      
      let newHistory = prev.hitHistory;
      let newAvgReaction = prev.avgReactionTime;

      if (isHit && hitTarget) {
        const reactionTime = now - hitTarget.spawnTime;
        newHistory = [...prev.hitHistory, {
          time: settings.duration - timeLeft,
          reactionTime,
          distance: minDistance
        }];
        
        // Recalculate Average
        const totalReaction = newHistory.reduce((acc, h) => acc + h.reactionTime, 0);
        newAvgReaction = totalReaction / newHistory.length;
      }

      return {
        ...prev,
        shotsFired: newShots,
        shotsHit: newHits,
        accuracy: newShots > 0 ? (newHits / newShots) * 100 : 0,
        score: prev.score + (isHit ? 100 : 0),
        avgReactionTime: newAvgReaction,
        hitHistory: newHistory
      };
    });

    if (hitId) {
      setTargets(prev => {
        const remaining = prev.filter(t => t.id !== hitId);
        remaining.push(generateTarget(remaining));
        return remaining;
      });
    }
  };

  return (
    <div className="relative w-full h-full font-sans text-white select-none bg-black">
      {/* 3D Scene */}
      <Canvas 
        shadows 
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 2.0, 5]} fov={75} />
        <color attach="background" args={['#111']} />
        <fog attach="fog" args={['#111', 10, 60]} />
        
        <ShootingRangeEnvironment />
        
        <group>
          {targets.map((target) => (
            <Target key={target.id} position={target.position} size={settings.targetSize} />
          ))}
          <Player gameState={gameState} onShoot={handleShoot} />
        </group>
      </Canvas>

      {/* Crosshair Overlay */}
      {gameState === GameState.PLAYING && <Crosshair type={settings.crosshair} />}

      {/* HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 min-w-[120px]">
            <div className="text-4xl font-bold text-[#00ffcc] tracking-wider">{stats.score}</div>
            <div className="text-xs text-gray-400 font-bold tracking-widest">{t.score}</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`text-6xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-right min-w-[120px]">
             <div className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</div>
             <div className="text-xs text-gray-400 font-bold tracking-widest">{t.accuracy}</div>
          </div>
        </div>
      )}

      {/* Menus */}
      {gameState === GameState.MENU && (
        <MenuScreen settings={settings} setSettings={setSettings} onStart={startGame} />
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50" style={{ cursor: 'default' }} onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-4 w-[300px] pointer-events-auto">
            <h2 className="text-4xl font-black text-white text-center mb-8 italic">{t.paused}</h2>
            <button onClick={resumeGame} className="w-full py-3 bg-[#00ffcc] text-black font-bold rounded hover:bg-[#00eebb]">{t.resume}</button>
            <button onClick={startGame} className="w-full py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600">{t.restart}</button>
            <button onClick={() => setGameState(GameState.MENU)} className="w-full py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600">{t.settings}</button>
            <button onClick={quitToMenu} className="w-full py-3 bg-red-600 text-white font-bold rounded hover:bg-red-500">{t.mainMenu}</button>
          </div>
        </div>
      )}

      {gameState === GameState.FINISHED && (
        <Scoreboard stats={stats} settings={settings} onRestart={startGame} onMenu={quitToMenu} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
