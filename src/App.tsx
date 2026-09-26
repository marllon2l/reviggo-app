import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import recipesRaw from '../receitas_300.json'
import planRaw from '../plano_21_dias.json'
import { supabase, supabaseEnabled } from './lib/supabase'
import type { PlanDay, Recipe, RecipesFile, Tab } from './types'

const recipes = (recipesRaw as RecipesFile).receitas
const plan = planRaw as PlanDay[]
const subtitle = '300 receitas para você que não aguenta mais conviver com dores e quer voltar a ter energia e liberdade.'

const objectives = [
  'Dores e incômodos físicos',
  'Energia e disposição',
  'Sono e rotina noturna',
  'Intestino e digestão',
  'Peso e saciedade',
  'Circulação',
  'Memória e concentração',
]

const categories = [
  'Cafés da manhã',
  'Almoços e jantares',
  'Lanches',
  'Sopas, caldos e cremes',
  'Sobremesas e doces simples',
  'Sucos e vitaminas',
  'Chás e bebidas',
  'Refeições SOS',
]

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

const writeLocal = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value))

const byCode = (code: string) => recipes.find((recipe) => recipe.codigo === code)

export default function App() {
  const [authReady, setAuthReady] = useState(!supabaseEnabled)
  const [userId, setUserId] = useState<string | null>(() => supabaseEnabled ? null : 'demo')
  const [onboarded, setOnboarded] = useState(() => readLocal('reviggo_onboarded', false))
  const [tab, setTab] = useState<Tab>('hoje')
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [moreView, setMoreView] = useState<string | null>(null)
  const [currentDay, setCurrentDay] = useState(() => readLocal('reviggo_day', 1))
  const [favorites, setFavorites] = useState<string[]>(() => readLocal('reviggo_favorites', []))
  const [completed, setCompleted] = useState<string[]>(() => readLocal('reviggo_completed', []))

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => writeLocal('reviggo_day', currentDay), [currentDay])
  useEffect(() => writeLocal('reviggo_favorites', favorites), [favorites])
  useEffect(() => writeLocal('reviggo_completed', completed), [completed])

  const toggleFavorite = async (recipe: Recipe) => {
    const add = !favorites.includes(recipe.codigo)
    setFavorites((value) => add ? [...value, recipe.codigo] : value.filter((code) => code !== recipe.codigo))
    if (supabase && userId && userId !== 'demo') {
      if (add) {
        await supabase.from('recipe_favorites').upsert({ user_id: userId, recipe_code: recipe.codigo })
      } else {
        await supabase.from('recipe_favorites').delete().eq('user_id', userId).eq('recipe_code', recipe.codigo)
      }
    }
  }

  const markDone = async (recipe: Recipe) => {
    if (!completed.includes(recipe.codigo)) {
      setCompleted((value) => [...value, recipe.codigo])
    }
    if (supabase && userId && userId !== 'demo') {
      await supabase.from('recipe_completions').insert({
        user_id: userId,
        recipe_code: recipe.codigo,
        plan_day: tab === 'hoje' ? currentDay : null,
      })
    }
  }

  if (window.location.pathname === '/upgrade') {
    return (
      <main className="center-screen">
        <div className="brand-mark">R</div>
        <h1>Reviggo</h1>
        <h2>Upgrade</h2>
        <p>Estrutura preparada para uma futura assinatura. Pagamentos ainda não estão ativos.</p>
        <a className="primary button-link" href="/">Voltar ao aplicativo</a>
      </main>
    )
  }

  if (!authReady) return <Loading />
  if (!userId) return <Auth />
  if (!onboarded) return <Onboarding userId={userId} onDone={() => {
    writeLocal('reviggo_onboarded', true)
    setOnboarded(true)
  }} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => {
          setTab('hoje')
          setActiveRecipe(null)
          setMoreView(null)
        }}>Reviggo</button>
        <span>Corpo Revigorado</span>
      </header>

      <main className="content">
        {activeRecipe ? (
          <RecipeDetail
            recipe={activeRecipe}
            favorite={favorites.includes(activeRecipe.codigo)}
            done={completed.includes(activeRecipe.codigo)}
            onBack={() => setActiveRecipe(null)}
            onFavorite={() => void toggleFavorite(activeRecipe)}
            onDone={() => void markDone(activeRecipe)}
            onSwap={() => {
              const same = recipes.filter((item) => item.categoria === activeRecipe.categoria && item.codigo !== activeRecipe.codigo)
              if (same.length) setActiveRecipe(same[Math.floor(Math.random() * same.length)])
            }}
          />
        ) : moreView ? (
          <MoreView
            view={moreView}
            onBack={() => setMoreView(null)}
            currentDay={currentDay}
            completed={completed}
            favorites={favorites}
            onOpen={setActiveRecipe}
            userId={userId}
          />
        ) : (
          <>
            {tab === 'hoje' && <Today currentDay={currentDay} completed={completed} setCurrentDay={setCurrentDay} onOpen={setActiveRecipe} />}
            {tab === 'receitas' && <Recipes favorites={favorites} onOpen={setActiveRecipe} />}
            {tab === 'plano' && <Plan currentDay={currentDay} completed={completed} setCurrentDay={setCurrentDay} onOpen={setActiveRecipe} />}
            {tab === 'favoritos' && <Favorites favorites={favorites} onOpen={setActiveRecipe} />}
            {tab === 'mais' && <More onOpen={setMoreView} />}
          </>
        )}
      </main>

      {!activeRecipe && !moreView && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  )
}

function Loading() {
  return <main className="center-screen"><div className="brand-mark">R</div><h1>Reviggo</h1><p>Preparando seu acesso…</p></main>
}

function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setMessage('')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup' && !result.data.session) setMessage('Cadastro criado. Confira seu e-mail para confirmar o acesso.')
    setLoading(false)
  }

  return (
    <main className="auth">
      <section className="auth-pitch">
        <div className="brand-mark inverse">R</div>
        <p className="eyebrow light">PROGRAMA DE 21 DIAS</p>
        <h1>Reviggo</h1>
        <h2>Protocolo Corpo Revigorado</h2>
        <p className="subtitle">{subtitle}</p>
        <div className="proofs"><span>300 receitas</span><span>Plano de 21 dias</span></div>
      </section>
      <section className="auth-box">
        <h3>{mode === 'login' ? 'Entre no Reviggo' : 'Crie seu acesso'}</h3>
        <p>{mode === 'login' ? 'Continue de onde parou.' : 'Seu acesso ao aplicativo começa aqui.'}</p>
        <form onSubmit={submit}>
          <label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></label>
          <label>Senha<input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" /></label>
          {message && <div className="notice">{message}</div>}
          <button className="primary" disabled={loading}>{loading ? 'Aguarde…' : mode === 'login' ? 'ENTRAR' : 'CRIAR ACESSO'}</button>
        </form>
        <button className="text-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Ainda não tenho acesso' : 'Já tenho uma conta'}
        </button>
      </section>
    </main>
  )
}

function Onboarding({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [household, setHousehold] = useState(1)
  const [time, setTime] = useState(20)
  const [avoid, setAvoid] = useState('')

  const finish = async () => {
    writeLocal('reviggo_settings', { household, time, avoid })
    if (supabase && userId !== 'demo') {
      await supabase.from('profiles').upsert({
        id: userId,
        household_size: household,
        cooking_time_preference: time,
        current_day: 1,
      })
      await supabase.from('user_settings').upsert({
        user_id: userId,
        excluded_foods: avoid.split(',').map((item) => item.trim()).filter(Boolean),
      })
    }
    onDone()
  }

  return (
    <main className="onboarding">
      <div className="brand-mark">R</div>
      <p className="eyebrow">BEM-VINDO AO REVIGGO</p>
      <h1>300 receitas. Um caminho simples para começar.</h1>
      <p>O Protocolo Corpo Revigorado guia seus primeiros 21 dias, mas toda a biblioteca fica liberada desde o primeiro acesso.</p>
      <div className="form-stack">
        <label>Pessoas na sua casa
          <select value={household} onChange={(e) => setHousehold(Number(e.target.value))}>
            {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}{n === 6 ? ' ou mais' : ''}</option>)}
          </select>
        </label>
        <label>Tempo disponível para cozinhar
          <select value={time} onChange={(e) => setTime(Number(e.target.value))}>
            <option value={10}>Até 10 minutos</option>
            <option value={20}>Até 20 minutos</option>
            <option value={30}>Até 30 minutos</option>
            <option value={45}>45 minutos ou mais</option>
          </select>
        </label>
        <label>Alimentos que você evita
          <input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="Ex.: leite, amendoim (opcional)" />
        </label>
      </div>
      <button className="primary" onClick={() => void finish()}>COMEÇAR MEUS 21 DIAS →</button>
      <small>Sem diagnóstico. Essas preferências servem apenas para facilitar seu uso do app.</small>
    </main>
  )
}

function Today({ currentDay, completed, setCurrentDay, onOpen }: {
  currentDay: number
  completed: string[]
  setCurrentDay: (day: number) => void
  onOpen: (recipe: Recipe) => void
}) {
  const day = plan.find((item) => item.dia === currentDay) ?? plan[0]
  const meals = [
    ['Café da manhã', day.cafe],
    ['Almoço', day.almoco],
    ['Lanche', day.lanche],
    ['Jantar', day.jantar],
  ] as const
  const done = meals.filter(([, code]) => completed.includes(code)).length

  return (
    <section className="page">
      <p className="eyebrow">PROTOCOLO CORPO REVIGORADO</p>
      <div className="headline-row"><div><h1>Hoje é o seu Dia {day.dia}</h1><p>Fase {day.fase} · {done} de 4 receitas feitas</p></div><b>{Math.round(day.dia / 21 * 100)}%</b></div>
      <div className="progress"><span style={{ width: `${day.dia / 21 * 100}%` }} /></div>
      <div className="mission"><strong>Missão de hoje</strong><p>{day.missao}</p></div>
      <h2>Suas receitas de hoje</h2>
      <div className="list">
        {meals.map(([label, code]) => {
          const recipe = byCode(code)
          return recipe ? <RecipeRow key={code} recipe={recipe} label={label} done={completed.includes(code)} onOpen={() => onOpen(recipe)} /> : null
        })}
      </div>
      <div className="day-nav">
        <button disabled={day.dia === 1} onClick={() => setCurrentDay(Math.max(1, day.dia - 1))}>← Dia anterior</button>
        <button disabled={day.dia === 21} onClick={() => setCurrentDay(Math.min(21, day.dia + 1))}>Próximo dia →</button>
      </div>
    </section>
  )
}

function Recipes({ favorites, onOpen }: { favorites: string[]; onOpen: (recipe: Recipe) => void }) {
  const [search, setSearch] = useState('')
  const [objective, setObjective] = useState('')
  const [category, setCategory] = useState('')
  const [quick, setQuick] = useState('')

  const filtered = useMemo(() => recipes.filter((recipe) => {
    const q = search.toLowerCase()
    const searchOk = !q || recipe.nome.toLowerCase().includes(q) || recipe.ingredientes.some((item) => item.item.toLowerCase().includes(q))
    const objectiveOk = !objective || recipe.objetivos.includes(objective)
    const categoryOk = !category || recipe.categoria === category
    const quickOk = !quick || recipe.tags_praticas.includes(quick) || (quick === 'favoritos' && favorites.includes(recipe.codigo))
    return searchOk && objectiveOk && categoryOk && quickOk
  }), [search, objective, category, quick, favorites])

  return (
    <section className="page">
      <p className="eyebrow">BIBLIOTECA COMPLETA</p>
      <h1>Encontre uma receita para agora</h1>
      <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar receita ou ingrediente…" />
      <div className="chips">
        <button className={!objective ? 'active' : ''} onClick={() => setObjective('')}>Todas as áreas</button>
        {objectives.map((item) => <button className={objective === item ? 'active' : ''} key={item} onClick={() => setObjective(item)}>{item}</button>)}
      </div>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={quick} onChange={(e) => setQuick(e.target.value)}>
          <option value="">Qualquer perfil</option>
          <option value="até 10 min">Até 10 min</option>
          <option value="econômica">Econômica</option>
          <option value="família">Família</option>
          <option value="freezer">Freezer</option>
          <option value="marmita">Marmita</option>
          <option value="sem fogão">Sem fogão</option>
          <option value="uma panela só">Uma panela só</option>
          <option value="favoritos">Favoritos</option>
        </select>
      </div>
      <p className="count">{filtered.length} receitas encontradas</p>
      <div className="grid">
        {filtered.map((recipe) => <RecipeCard key={recipe.codigo} recipe={recipe} favorite={favorites.includes(recipe.codigo)} onOpen={() => onOpen(recipe)} />)}
      </div>
    </section>
  )
}

function Plan({ currentDay, completed, setCurrentDay, onOpen }: {
  currentDay: number
  completed: string[]
  setCurrentDay: (day: number) => void
  onOpen: (recipe: Recipe) => void
}) {
  return (
    <section className="page">
      <p className="eyebrow">PROGRAMA GUIADO</p>
      <h1>Protocolo Corpo Revigorado</h1>
      <p className="lead">Dias 1–7: Facilitar. Dias 8–14: Adaptar. Dias 15–21: Sustentar.</p>
      <div className="day-list">
        {plan.map((day) => {
          const codes = [day.cafe, day.almoco, day.lanche, day.jantar]
          const done = codes.filter((code) => completed.includes(code)).length
          return (
            <article className={currentDay === day.dia ? 'day-card current' : 'day-card'} key={day.dia}>
              <button onClick={() => setCurrentDay(day.dia)}>
                <span><small>Dia {day.dia} · {day.fase}</small><strong>{day.missao}</strong><em>{done}/4 receitas feitas</em></span>
                <b>›</b>
              </button>
              {currentDay === day.dia && <div className="mini-list">{codes.map((code) => {
                const recipe = byCode(code)
                return recipe ? <button key={code} onClick={() => onOpen(recipe)}>{recipe.nome}</button> : null
              })}</div>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Favorites({ favorites, onOpen }: { favorites: string[]; onOpen: (recipe: Recipe) => void }) {
  const items = recipes.filter((recipe) => favorites.includes(recipe.codigo))
  return (
    <section className="page">
      <p className="eyebrow">SEU CADERNO</p>
      <h1>Favoritos</h1>
      {items.length ? <div className="grid">{items.map((recipe) => <RecipeCard key={recipe.codigo} recipe={recipe} favorite onOpen={() => onOpen(recipe)} />)}</div> :
        <div className="empty"><b>♡</b><h2>Nenhuma receita salva ainda</h2><p>Abra uma receita e toque em “Favoritar”.</p></div>}
    </section>
  )
}

function More({ onOpen }: { onOpen: (view: string) => void }) {
  const items = [
    ['compras', 'Lista de compras', 'Itens das receitas da semana'],
    ['trocas', 'Troca Fácil', 'Alternativas quando faltar um ingrediente'],
    ['sos', 'Cozinha SOS', 'Receitas para os dias corridos'],
    ['familia', 'Modo Família', 'Adaptações para mais pessoas'],
    ['freezer', 'Freezer', 'Opções para adiantar a semana'],
    ['progresso', 'Progresso', 'Acompanhe seu uso sem score de saúde'],
    ['perfil', 'Perfil', 'Preferências e conta'],
  ]
  return (
    <section className="page">
      <p className="eyebrow">FERRAMENTAS</p>
      <h1>Mais</h1>
      <div className="menu-list">{items.map(([id, title, text]) => <button key={id} onClick={() => onOpen(id)}><span><strong>{title}</strong><small>{text}</small></span><b>›</b></button>)}</div>
    </section>
  )
}

function MoreView({ view, onBack, currentDay, completed, favorites, onOpen, userId }: {
  view: string
  onBack: () => void
  currentDay: number
  completed: string[]
  favorites: string[]
  onOpen: (recipe: Recipe) => void
  userId: string
}) {
  const titles: Record<string, string> = {
    compras: 'Lista de compras',
    trocas: 'Troca Fácil',
    sos: 'Cozinha SOS',
    familia: 'Modo Família',
    freezer: 'Freezer',
    progresso: 'Progresso',
    perfil: 'Perfil',
  }

  return (
    <section className="page">
      <button className="back" onClick={onBack}>← Voltar</button>
      <h1>{titles[view]}</h1>
      {view === 'compras' && <Shopping currentDay={currentDay} />}
      {view === 'trocas' && <Feature intro="Abra uma receita para ver as substituições que já fazem parte dela." filter={(recipe) => recipe.substituicoes.length > 0} onOpen={onOpen} />}
      {view === 'sos' && <Feature intro="Para o dia que saiu do controle: escolha algo simples e siga em frente." filter={(recipe) => recipe.categoria === 'Refeições SOS' || recipe.tempo_min <= 10} onOpen={onOpen} />}
      {view === 'familia' && <Feature intro="As receitas já trazem orientação de Modo Família." filter={(recipe) => Boolean(recipe.modo_familia)} onOpen={onOpen} />}
      {view === 'freezer' && <Feature intro="Abra a receita para conferir a orientação de freezer." filter={(recipe) => /congel|freezer/i.test(recipe.freezer)} onOpen={onOpen} />}
      {view === 'progresso' && <Tracker currentDay={currentDay} completed={completed} favorites={favorites} userId={userId} />}
      {view === 'perfil' && <Profile userId={userId} />}
    </section>
  )
}

function Shopping({ currentDay }: { currentDay: number }) {
  const start = Math.floor((currentDay - 1) / 7) * 7 + 1
  const days = plan.filter((day) => day.dia >= start && day.dia <= start + 6)
  const ingredients = Array.from(new Set(days.flatMap((day) => [day.cafe, day.almoco, day.lanche, day.jantar]).flatMap((code) => byCode(code)?.ingredientes.map((item) => item.item) ?? []))).sort()
  const [checked, setChecked] = useState<string[]>(() => readLocal(`reviggo_shop_${start}`, []))
  useEffect(() => writeLocal(`reviggo_shop_${start}`, checked), [checked, start])

  return (
    <>
      <p className="lead">Semana {start}–{Math.min(21, start + 6)}. Marque o que já está no carrinho.</p>
      <div className="check-list">{ingredients.map((item) => <label key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => setChecked((value) => value.includes(item) ? value.filter((x) => x !== item) : [...value, item])} /><span>{item}</span></label>)}</div>
    </>
  )
}

function Feature({ intro, filter, onOpen }: { intro: string; filter: (recipe: Recipe) => boolean; onOpen: (recipe: Recipe) => void }) {
  return (
    <>
      <p className="lead">{intro}</p>
      <div className="list">{recipes.filter(filter).slice(0, 30).map((recipe) => <RecipeRow key={recipe.codigo} recipe={recipe} onOpen={() => onOpen(recipe)} />)}</div>
    </>
  )
}

function Tracker({ currentDay, completed, favorites, userId }: { currentDay: number; completed: string[]; favorites: string[]; userId: string }) {
  const [entry, setEntry] = useState(() => readLocal('reviggo_tracker', { energy: 3, sleep: 3, meal_comfort: 3, satiety: 3, note: '' }))

  const save = async () => {
    writeLocal('reviggo_tracker', entry)
    if (supabase && userId !== 'demo') {
      await supabase.from('tracker_entries').insert({ user_id: userId, ...entry })
    }
    alert('Registro salvo.')
  }

  return (
    <>
      <div className="stats"><div><b>{currentDay}</b><span>Dia atual</span></div><div><b>{completed.length}</b><span>Receitas feitas</span></div><div><b>{favorites.length}</b><span>Favoritas</span></div></div>
      <p className="lead">Acompanhamento opcional e não clínico.</p>
      <div className="ratings">
        {[
          ['energy', 'Energia percebida'],
          ['sleep', 'Sono percebido'],
          ['meal_comfort', 'Conforto após refeições'],
          ['satiety', 'Fome/saciedade'],
        ].map(([key, label]) => <label key={key}>{label}<div>{[1,2,3,4,5].map((n) => <button className={(entry as Record<string, number | string>)[key] === n ? 'active' : ''} key={n} onClick={() => setEntry((value) => ({ ...value, [key]: n }))}>{n}</button>)}</div></label>)}
        <label>Nota livre<textarea value={entry.note} onChange={(e) => setEntry((value) => ({ ...value, note: e.target.value }))} /></label>
      </div>
      <button className="primary" onClick={() => void save()}>SALVAR REGISTRO</button>
      <small className="disclaimer">Isto não é diagnóstico, percentual médico ou score de saúde.</small>
    </>
  )
}

function Profile({ userId }: { userId: string }) {
  const saved = readLocal('reviggo_settings', { household: 1, time: 20, avoid: '' })
  const [household, setHousehold] = useState(saved.household)
  const [time, setTime] = useState(saved.time)
  const [avoid, setAvoid] = useState(saved.avoid)

  const save = async () => {
    writeLocal('reviggo_settings', { household, time, avoid })
    if (supabase && userId !== 'demo') {
      await supabase.from('profiles').update({ household_size: household, cooking_time_preference: time }).eq('id', userId)
      await supabase.from('user_settings').upsert({ user_id: userId, excluded_foods: avoid.split(',').map((item: string) => item.trim()).filter(Boolean) })
    }
    alert('Preferências salvas.')
  }

  return (
    <div className="form-stack">
      <label>Pessoas na casa<input type="number" min={1} max={12} value={household} onChange={(e) => setHousehold(Number(e.target.value))} /></label>
      <label>Tempo preferido<select value={time} onChange={(e) => setTime(Number(e.target.value))}><option value={10}>Até 10 min</option><option value={20}>Até 20 min</option><option value={30}>Até 30 min</option><option value={45}>45 min ou mais</option></select></label>
      <label>Alimentos que evita<input value={avoid} onChange={(e) => setAvoid(e.target.value)} /></label>
      <button className="primary" onClick={() => void save()}>SALVAR PREFERÊNCIAS</button>
      {supabase && <button className="secondary danger" onClick={() => void supabase.auth.signOut()}>Sair da conta</button>}
    </div>
  )
}

function RecipeDetail({ recipe, favorite, done, onBack, onFavorite, onDone, onSwap }: {
  recipe: Recipe
  favorite: boolean
  done: boolean
  onBack: () => void
  onFavorite: () => void
  onDone: () => void
  onSwap: () => void
}) {
  const [checked, setChecked] = useState<number[]>([])

  return (
    <article className="recipe-detail">
      <div className="detail-top"><button onClick={onBack}>← Voltar</button><button className={favorite ? 'heart active' : 'heart'} onClick={onFavorite}>{favorite ? '♥' : '♡'} Favoritar</button></div>
      <div className="food-art">R</div>
      <p className="eyebrow">{recipe.categoria}</p>
      <h1>{recipe.nome}</h1>
      <div className="facts"><span>{recipe.tempo_min} min</span><span>{recipe.dificuldade}</span><span>{recipe.custo}</span><span>{recipe.porcoes} porç{recipe.porcoes === 1 ? 'ão' : 'ões'}</span></div>
      <div className="tags">{recipe.objetivos.map((item) => <span key={item}>{item}</span>)}{recipe.tags_praticas.map((item) => <span className="muted-tag" key={item}>{item}</span>)}</div>
      <div className="why"><strong>Por que esta receita está aqui?</strong><p>{recipe.por_que_esta_aqui}</p></div>

      <h2>Ingredientes</h2>
      <div className="check-list ingredients">{recipe.ingredientes.map((ingredient, index) => <label key={index}><input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked((value) => value.includes(index) ? value.filter((n) => n !== index) : [...value, index])} /><span><strong>{ingredient.item}</strong><small>{ingredient.quantidade}</small></span></label>)}</div>

      <h2>Modo de preparo</h2>
      <ol className="steps">{recipe.preparo.map((step, index) => <li key={index}><b>{index + 1}</b><span>{step}</span></li>)}</ol>

      <Info title="Trocas fáceis" lines={recipe.substituicoes} />
      <Info title="Modo família" lines={[recipe.modo_familia]} />
      <Info title="Freezer" lines={[recipe.freezer]} />
      <Info title="Reaproveitamento" lines={[recipe.reaproveitamento]} />

      <div className="detail-actions">
        <button className={done ? 'primary done' : 'primary'} onClick={onDone}>{done ? '✓ RECEITA FEITA' : 'FIZ ESSA RECEITA ✓'}</button>
        <button className="secondary" onClick={onSwap}>Trocar por outra da mesma categoria</button>
      </div>
      <p className="disclaimer">{recipe.aviso ?? 'As áreas de interesse são filtros editoriais. Conteúdo alimentar e educacional; não substitui orientação individual de profissional de saúde.'}</p>
    </article>
  )
}

function Info({ title, lines }: { title: string; lines: string[] }) {
  return <div className="info"><h2>{title}</h2>{lines.filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}</div>
}

function RecipeRow({ recipe, label, done, onOpen }: { recipe: Recipe; label?: string; done?: boolean; onOpen: () => void }) {
  return <button className="recipe-row" onClick={onOpen}><span className="thumb">R</span><span className="recipe-copy">{label && <small>{label}</small>}<strong>{recipe.nome}</strong><em>{recipe.tempo_min} min · {recipe.dificuldade} · {recipe.custo}</em></span><b>{done ? '✓' : '›'}</b></button>
}

function RecipeCard({ recipe, favorite, onOpen }: { recipe: Recipe; favorite?: boolean; onOpen: () => void }) {
  return <button className="recipe-card" onClick={onOpen}><div className="card-art">R{favorite && <span>♥</span>}</div><div><small>{recipe.categoria}</small><strong>{recipe.nome}</strong><em>{recipe.tempo_min} min · {recipe.custo}</em></div></button>
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: Array<[Tab, string, string]> = [
    ['hoje', 'Hoje', '⌂'],
    ['receitas', 'Receitas', '⌕'],
    ['plano', '21 Dias', '✓'],
    ['favoritos', 'Favoritos', '♡'],
    ['mais', 'Mais', '☰'],
  ]
  return <nav className="bottom-nav">{items.map(([id, label, icon]) => <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}><b>{icon}</b><span>{label}</span></button>)}</nav>
}
