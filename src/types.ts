export type Ingredient = { item: string; quantidade: string }

export type Recipe = {
  id: number
  codigo: string
  slug: string
  nome: string
  categoria: string
  objetivos: string[]
  tags_praticas: string[]
  tempo_min: number
  dificuldade: string
  custo: string
  porcoes: number
  ingredientes: Ingredient[]
  preparo: string[]
  substituicoes: string[]
  modo_familia: string
  freezer: string
  reaproveitamento: string
  por_que_esta_aqui: string
  aviso?: string
}

export type RecipesFile = {
  meta: { total: number }
  receitas: Recipe[]
}

export type PlanDay = {
  dia: number
  fase: string
  cafe: string
  almoco: string
  lanche: string
  jantar: string
  missao: string
}

export type Tab = 'hoje' | 'receitas' | 'plano' | 'favoritos' | 'mais'
