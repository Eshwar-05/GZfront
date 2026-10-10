import { useEffect, useState } from 'react';
import { Gamepad2, Search, Trophy, History, LogOut, Zap, ArrowUpRight, Play, X, CheckCircle2, AlertCircle, Menu } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const fallbackGames = [
  { id: 'tap-rush', name: 'Tap Rush', category: 'Arcade', description: 'Hit the target as many times as you can in 10 seconds.', emoji: '⚡', color: 'orange', difficulty: 'Easy' },
  { id: 'number-hunt', name: 'Number Hunt', category: 'Puzzle', description: 'Find the hidden number using the fewest guesses.', emoji: '🔢', color: 'violet', difficulty: 'Medium' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', category: 'Strategy', description: 'Outsmart the computer in this classic strategy game.', emoji: '❎', color: 'cyan', difficulty: 'Easy' }
];
async function api(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}
const dateText = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gz_token') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('gz_user') || 'null'); } catch { return null; } });
  const [page, setPage] = useState('Discover'), [games, setGames] = useState(fallbackGames), [scores, setScores] = useState([]);
  const [query, setQuery] = useState(''), [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', identity: '', password: '' });
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [activeGame, setActiveGame] = useState(null), [mobileNav, setMobileNav] = useState(false);
  function notify(message, type = 'success') { setNotice({ message, type }); setTimeout(() => setNotice(null), 3200); }
  useEffect(() => { api('/api/games').then(d => setGames(d.games)).catch(() => {}); }, []);
  useEffect(() => {
    if (!token) return;
    api('/api/auth/me', {}, token).then(d => { setUser(d.user); localStorage.setItem('gz_user', JSON.stringify(d.user)); })
      .catch(() => { setToken(''); setUser(null); localStorage.removeItem('gz_token'); localStorage.removeItem('gz_user'); });
  }, [token]);
  useEffect(() => { if (token) api('/api/scores/me', {}, token).then(d => setScores(d.scores || [])).catch(() => {}); }, [token, page]);
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true);
    try {
      const body = authMode === 'register' ? { username: form.username, email: form.email, password: form.password } : { identity: form.identity, password: form.password };
      const data = await api(`/api/auth/${authMode}`, { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token); setUser(data.user); localStorage.setItem('gz_token', data.token); localStorage.setItem('gz_user', JSON.stringify(data.user));
      setPage('Discover'); notify(`Welcome${authMode === 'register' ? ' to GameZone' : ' back'}, ${data.user.username}!`);
    } catch (e) { notify(e.message, 'error'); } finally { setBusy(false); }
  }
  function logout() { setToken(''); setUser(null); setScores([]); localStorage.removeItem('gz_token'); localStorage.removeItem('gz_user'); setPage('Discover'); notify('You have been logged out.'); }
  async function saveScore(game, score, details = {}) {
    try { await api('/api/scores', { method: 'POST', body: JSON.stringify({ gameId: game.id, score, details }) }, token); const d = await api('/api/scores/me', {}, token); setScores(d.scores || []); notify('Score saved to your history!'); }
    catch (e) { notify(e.message, 'error'); }
  }
  const filteredGames = games.filter(g => `${g.name} ${g.category} ${g.description}`.toLowerCase().includes(query.toLowerCase()));
  const bestScore = scores.reduce((best, s) => Math.max(best, Number(s.score) || 0), 0);
  if (!user) return <AuthScreen mode={authMode} setMode={m => { setAuthMode(m); setNotice(null); }} form={form} setForm={setForm} onSubmit={submitAuth} busy={busy} notice={notice} />;
  const navItems = [{ name: 'Discover', icon: Gamepad2 }, { name: 'My History', icon: History }];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <Brand />
      <div className="nav-label">MENU</div>
      {navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} onClick={() => { setPage(item.name); setMobileNav(false); }}><item.icon size={18}/>{item.name}{item.name === 'My History' && <span className="nav-count">{scores.length}</span>}</button>)}
      <div className="sidebar-bottom"><div className="promo-card"><div className="promo-orb">✦</div><b>Your next high score awaits.</b><p>Pick a game. Set a record. Repeat.</p><button onClick={() => setPage('Discover')}>Explore games <ArrowUpRight size={15}/></button></div>
        <div className="profile-mini"><div className="avatar">{user.username?.slice(0,1).toUpperCase()}</div><div className="profile-info"><b>{user.username}</b><small>Player account</small></div><button className="icon-button" title="Log out" onClick={logout}><LogOut size={17}/></button></div>
      </div>
    </aside>
    {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)}><Menu/></button><div className="breadcrumb">GAMEZONE <span>/</span> <b>{page.toUpperCase()}</b></div><div className="top-actions"><div className="status-pill"><span/> ALL SYSTEMS READY</div><div className="top-avatar">{user.username?.slice(0,1).toUpperCase()}</div></div></header>
      {page === 'Discover' ? <>
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> YOUR ARCADE. YOUR RULES.</div><h1>Ready to<br/><span>play beyond?</span></h1><p>Jump into the action, sharpen your skills, and make every run count. Your next favourite game is one click away.</p><button className="primary-button" onClick={() => document.getElementById('game-library')?.scrollIntoView({ behavior: 'smooth' })}>Explore games <ArrowUpRight size={17}/></button><div className="hero-foot"><div className="online-dots"><i/><i/><i/></div><span>THE ARENA IS YOURS</span></div></div>
          <div className="hero-art"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-grid"/><div className="hero-console">🎮</div><div className="float-tag tag-one"><Zap size={15}/> QUICK PLAY</div><div className="float-tag tag-two"><Trophy size={15}/> CHASE YOUR BEST</div><div className="hero-spark spark-one">✦</div><div className="hero-spark spark-two">✧</div></div></section>
        <section className="stats-row"><Stat icon={<Gamepad2/>} label="GAMES TO PLAY" value={games.length.toString().padStart(2,'0')}/><Stat icon={<Trophy/>} label="GAMES PLAYED" value={new Set(scores.map(s => s.gameId)).size.toString().padStart(2,'0')}/><Stat icon={<Zap/>} label="PERSONAL BEST" value={bestScore.toLocaleString()}/><Stat icon={<History/>} label="SCORES SAVED" value={scores.length.toString().padStart(2,'0')}/></section>
        <section id="game-library" className="library-section"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> THE COLLECTION</div><h2>Choose your <span>game.</span></h2><p>Small games. Big main-character energy.</p></div><label className="search-box"><Search size={17}/><input placeholder="Find your next game..." value={query} onChange={e => setQuery(e.target.value)}/><kbd>/</kbd></label></div>
          <div className="game-grid">{filteredGames.map((game, i) => <GameCard key={game.id} game={game} index={i} onPlay={() => setActiveGame(game)}/>)}{!filteredGames.length && <div className="empty-state">No games match that search. Try another name.</div>}</div>
        </section><footer className="footer"><span>© 2026 GAMEZONE</span><span>BUILT FOR THE LOVE OF PLAY <b>✦</b></span></footer>
      </> : <section className="history-page"><div className="eyebrow"><span className="eyebrow-line"/> YOUR PROGRESS</div><h1>Game <span>history.</span></h1><p className="page-subtitle">Every run counts. Keep an eye on your scores and keep improving.</p><div className="history-summary"><div><small>TOTAL SCORES</small><b>{scores.length}</b></div><div><small>GAMES TRIED</small><b>{new Set(scores.map(s => s.gameId)).size}</b></div><div><small>TOP SCORE</small><b>{bestScore.toLocaleString()}</b></div></div><div className="history-table-wrap"><div className="table-title"><h3>Recent plays</h3><span>{scores.length} records</span></div>{scores.length ? <div className="history-list">{scores.map(s => <div className="history-row" key={s.id}><div className={`history-game-icon ${s.gameId}`}>{games.find(g => g.id === s.gameId)?.emoji || '🎮'}</div><div className="history-game-name"><b>{s.gameName}</b><small>{dateText(s.createdAt)}</small></div><div className="history-score"><small>SCORE</small><b>{Number(s.score).toLocaleString()}</b></div></div>)}</div> : <div className="empty-history"><div>🎯</div><h3>Your story starts here.</h3><p>Play a game and your scores will show up here.</p><button className="primary-button" onClick={() => setPage('Discover')}>Find a game <ArrowUpRight size={16}/></button></div>}</div></section>}
    </main>
    {activeGame && <GameModal game={activeGame} onClose={() => setActiveGame(null)} onSave={saveScore}/>}
    {notice && <div className={`toast ${notice.type}`}><span>{notice.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}</span>{notice.message}</div>}
  </div>;
}
function Brand(){return <div className="brand"><div className="brand-mark"><Gamepad2 size={23}/></div><span>GAME<span className="brand-accent">ZONE</span><small>PLAY BEYOND</small></span></div>}
function Stat({ icon, label, value }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><small>{label}</small><b>{value}</b></div></div>; }
function GameCard({ game, index, onPlay }) { return <article className={`game-card ${game.color}`} style={{ animationDelay: `${index * 80}ms` }}><div className="card-top"><span className="category-tag">{game.category}</span><span className="difficulty">{game.difficulty}</span></div><div className={`game-art art-${game.color}`}><div className="art-glow"/><div className="art-shape shape-a"/><div className="art-shape shape-b"/><span className="game-emoji">{game.emoji}</span><span className="art-number">0{index + 1}</span></div><div className="game-card-content"><h3>{game.name}</h3><p>{game.description}</p><button className="play-button" onClick={onPlay}><Play size={15} fill="currentColor"/> Play now <ArrowUpRight size={16}/></button></div></article>; }

function AuthScreen({ mode, setMode, form, setForm, onSubmit, busy, notice }) {
  return <div className="auth-shell"><div className="auth-visual"><Brand/><div className="auth-visual-copy"><div className="eyebrow"><span className="eyebrow-line"/> WELCOME TO YOUR NEXT OBSESSION</div><h1>Play hard.<br/><span>Level up.</span></h1><p>A universe of quick wins, clever plays, and personal bests. Your arena is waiting.</p><div className="auth-decoration"><div className="auth-disc">🎮</div><div className="auth-orbit orbit-a"/><div className="auth-orbit orbit-b"/><span className="auth-chip chip-a">✦ SKILL</span><span className="auth-chip chip-b">⚡ REPEAT</span></div></div><div className="auth-bottom">MADE FOR THE LOVE OF PLAY <b>✦</b></div></div>
    <div className="auth-panel"><div className="auth-panel-inner"><div className="mobile-brand"><Gamepad2/> GAME<span className="brand-accent">ZONE</span></div><div className="eyebrow"><span className="eyebrow-line"/> PLAYER ACCESS</div><h2>{mode === 'login' ? 'Welcome back.' : 'Join the arena.'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Your next high score is waiting.' : 'Create an account and start your run.'}</p>{notice && <div className={`inline-notice ${notice.type}`}>{notice.message}</div>}
      <form onSubmit={onSubmit} className="auth-form">{mode === 'register' && <><label>PLAYER NAME<input autoComplete="username" minLength="3" maxLength="32" required placeholder="e.g. PixelPilot" value={form.username} onChange={e => setForm({...form, username:e.target.value})}/></label><label>EMAIL ADDRESS<input type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></label></>}{mode === 'login' && <label>USERNAME OR EMAIL<input autoComplete="username" required placeholder="Enter your username or email" value={form.identity} onChange={e => setForm({...form, identity:e.target.value})}/></label>}<label>PASSWORD<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required placeholder="At least 8 characters" value={form.password} onChange={e => setForm({...form, password:e.target.value})}/></label><button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Enter GameZone' : 'Create your account'} <ArrowUpRight size={17}/></button></form>
      <div className="auth-switch">{mode === 'login' ? 'New to GameZone?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Log in'}</button></div><div className="auth-security"><span/> YOUR PROGRESS. YOUR ACCOUNT. YOURS.</div></div></div></div>;
}

function GameModal({ game, onClose, onSave }) {
  const [tapCount, setTapCount] = useState(0), [tapTime, setTapTime] = useState(10), [tapRunning, setTapRunning] = useState(false), [tapDone, setTapDone] = useState(false);
  const [secret] = useState(() => Math.floor(Math.random()*100)+1), [guess, setGuess] = useState(''), [guesses, setGuesses] = useState([]), [guessDone, setGuessDone] = useState(false);
  const [board, setBoard] = useState(Array(9).fill('')), [tttDone, setTttDone] = useState(false), [tttResult, setTttResult] = useState('');
  useEffect(() => { if (!tapRunning) return; if (tapTime <= 0) { setTapRunning(false); setTapDone(true); return; } const id = setTimeout(() => setTapTime(t => t - 1), 1000); return () => clearTimeout(id); }, [tapRunning, tapTime]);
  function startTap(){setTapCount(0);setTapTime(10);setTapDone(false);setTapRunning(true);}
  function submitGuess(e){e.preventDefault();const n=Number(guess);if(!Number.isInteger(n)||n<1||n>100)return;const next=[...guesses,{n,hint:n===secret?'Correct!':n<secret?'Too low':'Too high'}];setGuesses(next);setGuess('');if(n===secret)setGuessDone(true);}
  function checkWinner(b){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,4,8],[0,4,8],[2,4,6]];for(const[a,c,d]of lines)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?'draw':null;}
  function playCell(i){if(board[i]||tttDone)return;const b=[...board];b[i]='X';let winner=checkWinner(b);if(winner){setBoard(b);setTttDone(true);setTttResult(winner==='draw'?'Draw game':'You win!');return;}const empty=b.map((v,j)=>v?-1:j).filter(j=>j>=0);if(empty.length){const pick=empty[Math.floor(Math.random()*empty.length)];b[pick]='O';winner=checkWinner(b);}setBoard(b);if(winner||b.every(Boolean)){setTttDone(true);setTttResult(winner==='X'?'You win!':winner==='O'?'Computer wins':'Draw game');}}
  const tttScore=tttResult==='You win!'?100:tttResult==='Draw game'?25:0;
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="game-modal"><div className="modal-header"><div><span className="modal-kicker">NOW PLAYING</span><h2>{game.emoji} {game.name}</h2></div><button className="icon-button close-button" onClick={onClose}><X/></button></div>
    {game.id==='tap-rush'&&<div className="mini-game"><p>Tap the target as many times as possible before the timer runs out.</p><div className="tap-score"><div><small>TIME LEFT</small><b>{tapTime}s</b></div><div><small>YOUR TAPS</small><b>{tapCount}</b></div></div>{!tapRunning&&!tapDone?<button className="primary-button game-start" onClick={startTap}>Start 10-second run <Play size={16}/></button>:tapDone?<div className="game-result"><h3>Run complete!</h3><p>You scored <b>{tapCount}</b> taps.</p><button className="primary-button" onClick={()=>onSave(game,tapCount,{taps:tapCount})}>Save score <Trophy size={16}/></button><button className="secondary-button" onClick={startTap}>Play again</button></div>:<button className="tap-target" onClick={()=>setTapCount(c=>c+1)}><Zap size={38} fill="currentColor"/><span>TAP!</span></button>}</div>}
    {game.id==='number-hunt'&&<div className="mini-game"><p>Guess the secret number between 1 and 100. Fewer guesses earn a better score.</p><div className="number-display">? <small>SECRET NUMBER</small></div>{!guessDone?<form className="guess-form" onSubmit={submitGuess}><input type="number" min="1" max="100" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="Your guess (1–100)" required/><button className="primary-button">Guess <ArrowUpRight size={16}/></button></form>:<div className="game-result"><h3>🎉 You found it!</h3><p>Number: <b>{secret}</b> · Guesses: <b>{guesses.length}</b></p><button className="primary-button" onClick={()=>onSave(game,Math.max(10,110-guesses.length*10),{guesses:guesses.length})}>Save score <Trophy size={16}/></button></div>}<div className="guess-list">{guesses.slice().reverse().map((g,i)=><span key={i} className={g.hint==='Correct!'?'correct':''}>{g.n} — {g.hint}</span>)}</div></div>}
    {game.id==='tic-tac-toe'&&<div className="mini-game"><p>You are X. The computer is O. Get three in a row to win.</p><div className="ttt-board">{board.map((v,i)=><button key={i} className={`ttt-cell ${v==='X'?'x-cell':'o-cell'}`} onClick={()=>playCell(i)} disabled={!!v||tttDone}>{v}</button>)}</div>{tttDone?<div className="game-result"><h3>{tttResult}</h3><p>Score: {tttScore}</p><button className="primary-button" onClick={()=>onSave(game,tttScore,{result:tttResult})}>Save score <Trophy size={16}/></button><button className="secondary-button" onClick={()=>{setBoard(Array(9).fill(''));setTttDone(false);setTttResult('');}}>Play again</button></div>:<div className="ttt-turn">YOUR TURN <span>✦</span> X</div>}</div>}
    <div className="modal-footer"><span><CheckCircle2 size={15}/> Scores sync to your account</span><button onClick={onClose}>Exit game</button></div>
  </div></div>;
}
