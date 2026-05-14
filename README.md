# 🏆 Sports Event Manager - Guia Completo

Sistema web completo de gerenciamento de eventos esportivos com UI/UX mobile-first, animações fluídas e sincronização em nuvem.

## 📋 Funcionalidades

### Painel Admin (index.html)
- ✅ Login opcional para administradores
- ✅ Criação e edição de eventos
- ✅ Lista de eventos com cards interativos
- ✅ Lixeira com restauração e expiração automática (30 dias)
- ✅ Sincronização com Supabase

### Página Pública do Evento (evento.html)
- ✅ Visualização completa do evento
- ✅ Confirmação de presença com nome e convidados
- ✅ Lista de espera (reservas) automática
- ✅ Trava de remoção 1h antes do início
- ✅ Mapa do Google Maps (oculto até confirmar presença)
- ✅ Controle de partida (timer, placar, apito)
- ✅ Sorteio automático de times equilibrados
- ✅ Links públicos com snapshot (`?id=...&s=...`)

### Regras de Negócio Preservadas
- ✅ Cálculo dinâmico de valor por pessoa
- ✅ Promoção automática de reserva quando abre vaga
- ✅ Finalização automática por tempo/duração
- ✅ Timer otimizado com pause em background
- ✅ Apito sonoro via Web Audio API

---

## 🚀 Instruções de Deploy

### 1. Vercel (Frontend)

```bash
# Instale a CLI da Vercel
npm install -g vercel

# No diretório do projeto
cd /workspace
vercel login
vercel --prod
```

**Configurações recomendadas:**
- Build Command: Deixe em branco (projeto estático)
- Output Directory: Deixe em branco
- Install Command: Deixe em branco

### 2. Supabase (Backend)

1. **Crie uma conta** em [supabase.com](https://supabase.com)

2. **Crie um novo projeto**

3. **Crie a tabela `events`:**

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  dateTime BIGINT,
  maxParticipants INTEGER,
  totalCost DECIMAL(10,2),
  participants JSONB DEFAULT '[]',
  reserves JSONB DEFAULT '[]',
  status TEXT DEFAULT 'scheduled',
  createdAt BIGINT,
  updatedAt BIGINT,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT 
USING (deleted_at IS NULL);

-- Policy para inserção autenticada
CREATE POLICY "Users can insert events" 
ON events FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy para atualização
CREATE POLICY "Users can update events" 
ON events FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Index para performance
CREATE INDEX idx_events_deleted_at ON events(deleted_at);
CREATE INDEX idx_events_dateTime ON events("dateTime");
```

4. **Obtenha as credenciais:**
   - Settings → API
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`

---

## ⚙️ Configuração

### Variáveis no `script.js`

Edite o topo do arquivo `script.js`:

```javascript
const GOOGLE_MAPS_API_KEY = 'SUA_API_KEY_AQUI';
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';
```

### Google Maps API Key

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Ative a **Maps JavaScript API** e **Geocoding API**
4. Crie credenciais → API Key
5. Restrinja a key para seu domínio (opcional mas recomendado)

---

## 🎨 Design System - Cores do Brasil

O projeto utiliza um design system inspirado nas cores da bandeira brasileira:

### Cores
- `--color-primary`: #009c3b (Verde Brasil)
- `--color-secondary`: #ffdf00 (Amarelo Ouro)
- `--color-accent`: #002776 (Azul Celeste)
- `--color-success`: #009c3b (Verde)
- `--color-error`: #dc3545 (Vermelho)

### Componentes
- **Botões**: Com efeito ripple e estados hover/active
- **Cards**: Com sombra e transição suave
- **Modais**: Com backdrop blur e trap focus
- **Toasts**: Sistema de notificações não-intrusivas
- **Skeleton**: Loading states animados

### Animações
- Todas GPU-acceleradas (transform, opacity)
- Microinterações em botões (scale 0.98 no active)
- Transições de entrada/saída suaves
- Dark mode automático via `prefers-color-scheme`

---

## 📱 Mobile-First

- Layout responsivo com breakpoints em 640px
- Áreas de toque ≥ 44px
- Tipografia escalável com `clamp()`
- Menu adaptável para telas pequenas
- Scoreboard empilha em mobile

---

## ♿ Acessibilidade

- Contraste WCAG AA
- Atributos `aria-*` em componentes interativos
- Navegação por teclado completa
- `:focus-visible` estilizado
- Modais com foco preso (trap focus)
- Fechamento via ESC

---

## 🔧 Estrutura de Arquivos

```
/workspace
├── index.html      # Painel admin
├── evento.html     # Página pública do evento
├── style.css       # Design system e componentes
├── script.js       # Lógica completa do sistema
└── README.md       # Este arquivo
```

---

## 💡 Uso

### Criando um Evento

1. Acesse `index.html`
2. Faça login (qualquer email/senha funciona localmente)
3. Clique em "Novo Evento"
4. Preencha:
   - Nome do evento
   - Data e hora
   - Local (opcional)
   - Máximo de participantes
   - Custo total (opcional)
   - Descrição (opcional)
5. Salve

### Participando de um Evento

1. Acesse o link do evento (`evento.html?id=xxx`)
2. Clique em "Confirmar Presença"
3. Informe seu nome e número de convidados
4. Após confirmar, o mapa será liberado

### Controle da Partida

Disponível apenas após o horário de início ou para admin:

- **Timer**: Inicia/pausa/retoma com duração configurável
- **Placar**: Adicione gols para cada time
- **Apito**: Som duplo via Web Audio API
- **Sortear Times**: Gera times equilibrados automaticamente

---

## 🔄 Sincronização

### LocalStorage (Base)
- Todos os dados são salvos localmente primeiro
- Funciona offline completamente

### Supabase (Cloud)
- Pull a cada 3 segundos
- Upsert automático on change
- Marcação `deleted_at` para soft delete
- Resolução de conflitos por timestamp

---

## 🐛 Troubleshooting

### Eventos não sincronizam
- Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
- Confira se a tabela `events` foi criada
- Verifique as policies de RLS

### Mapa não carrega
- Configure `GOOGLE_MAPS_API_KEY`
- Verifique se as APIs estão ativas no Google Cloud
- Confira restrições de domínio na API Key

### Toasts não aparecem
- Verifique se o container `.toast-container` existe
- Inspecione erros no console do navegador

---

## 📊 Performance

- **CSS**: Variáveis CSS, animações GPU-acceleradas
- **JS**: Debounce em inputs, setInterval otimizado
- **Timer**: Pause automático em background (visibilitychange)
- **Imagens**: Fontes com preconnect
- **Bundle**: Zero dependências externas (exceto Google Maps)

---

## 🔐 Segurança

- Login simples para demo (em produção use autenticação real)
- Validação de formulário no client e server
- XSS prevention com escapeHtml()
- RLS no Supabase para proteção de dados

---

## 📝 Licença

Projeto desenvolvido para fins educacionais e de demonstração.

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

**Feito com ❤️ para organizar melhores partidas!** ⚽🏀🏈
