# Operação Renascer — Ficha de Agente

Ficha de RPG em React + Vite, com tema "oculto clínico": névoa vermelha,
painéis de vidro escuro, micro-glitch, barras de status reativas e uma mesa de
dados 3D para as rolagens.

Os textos, rótulos e regras da ficha original foram mantidos. O que mudou foi
a engenharia por trás (React), o visual e a experiência de uso.

**Site:** <https://mickaeladev.github.io/Ficha-Operacao-Renascer/>

---

## Stack

- **React 19** + **Vite**
- **@3d-dice/dice-box** para a mesa de dados 3D (física real)
- Sem dependências de UI, animação ou estado externo
- Persistência em `localStorage` (chave `fichaOR`)
- Exportar/Importar JSON compatível com a ficha antiga

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build

```bash
npm run build     # gera a pasta dist/
npm run preview   # testa o build localmente
```

`vite.config.js` usa `base: './'`, então o build funciona em qualquer subpasta
(ex.: `https://usuario.github.io/nome-do-repo/`) sem configuração extra.

### Assets da mesa 3D

Os temas e texturas do dice-box ficam em `public/dice/` e são copiados para
`dist/dice/` no build. Eles já estão versionados no projeto — não é necessário
rodar o `postinstall` do pacote.

O caminho é resolvido em tempo de execução a partir de `import.meta.env.BASE_URL`,
então a mesa funciona tanto em `localhost` quanto em uma subpasta do GitHub Pages.
Se o WebGL falhar, a rolagem continua funcionando sem animação e o resultado é
mostrado normalmente.

---

## Publicando no GitHub Pages

O deploy é automático pelo workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Todo push na `main` roda `npm ci --ignore-scripts`, `npm run build` e publica `dist/`.
2. O Pages está configurado com **Source: GitHub Actions**.
3. Também dá para disparar manualmente em **Actions → Deploy no GitHub Pages → Run workflow**.

O site fica em `https://mickaeladev.github.io/Ficha-Operacao-Renascer/`. O
`vite.config.js` usa `base: './'`, então o build funciona nessa subpasta sem
configuração extra.

Para publicar manualmente (sem Actions), rode `npm run build` e envie o
conteúdo de `dist/` (`index.html`, `assets/` e `dice/`) para a branch
configurada no Pages.

> O `.gitignore` ignora `dist/` e `node_modules/`. O build é gerado no CI; os
> assets 3D ficam versionados em `public/dice/` e são copiados para `dist/dice/`.

---

## Estrutura

```
.
├── .github/workflows/deploy.yml  # deploy automático no GitHub Pages
├── index.html               # entrada do Vite
├── legacy/index.html        # ficha antiga (v1) preservada como referência
├── src/
│   ├── main.jsx
│   ├── App.jsx              # estado, autosave, import/export, atalhos
│   ├── components/
│   │   ├── Atmosphere.jsx   # névoa, scanlines, ruído, vinheta
│   │   ├── Masthead.jsx     # título + ações + indicador de salvamento
│   │   ├── Panel.jsx        # casca padrão das seções
│   │   ├── Field.jsx        # campo + NumberInput com rascunho local
│   │   ├── IdentityPanel.jsx
│   │   ├── AttributesPanel.jsx
│   │   ├── SkillsPanel.jsx
│   │   ├── VitalsPanel.jsx
│   │   ├── DicePanel.jsx    # configuração, último resultado e histórico
│   │   ├── DiceOverlay.jsx  # mesa 3D imersiva com dice-box
│   │   ├── DiceChip.jsx     # peça reutilizável da quebra do cálculo
│   │   ├── InventoryPanel.jsx
│   │   ├── RitualsPanel.jsx
│   │   ├── NotesPanel.jsx   # kanban com drag & drop e seletor (mobile)
│   │   ├── Toasts.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── ScrollTop.jsx
│   ├── hooks/
│   │   ├── useToasts.js
│   │   └── useLeaving.js    # animação de saída antes de remover cards
│   ├── lib/
│   │   ├── rules.js         # atributos, perícias, derivados, níveis das barras
│   │   └── sheet.js         # estado, reducer, normalização e persistência
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── layout.css
│       ├── controls.css
│       └── modules.css
├── public/dice/              # assets da mesa 3D (temas e texturas)
├── vite.config.js
└── package.json
```

---

## Regras (mantidas da v1)

| Derivado | Fórmula |
| --- | --- |
| Vida máx. | `20 + Força × 3 + Vontade` |
| Sanidade máx. | `20 + Intelecto × 3 + Vontade` |
| Ânimo máx. | `Vontade × 2 + Sanidade máx.` |
| Defesa | `(Força + Vontade) × 3` |
| Contaminação máx. | `Vontade × 5` |

**Rolagem:** `d20 + (Atributo)d4 + Perícia`

- Cada ponto do atributo vira **um d4**.
- A perícia entra como valor fixo.
- Contaminação é invertida: quanto **maior** o valor, **pior** o estado da barra.
- Ficha nova começa com todos os atuais em `0` (comportamento da v1).

## Atalhos e detalhes de uso

- **Ctrl + S / Cmd + S**: salva imediatamente.
- Autosave com debounce de 450 ms; o indicador no topo mostra o horário do
  último salvamento.
- **Rolar Teste** abre a mesa 3D em tela cheia; os dados quicam de verdade e o
  total aparece quando param.
- Na mesa, **Rolar de novo** repete com os mesmos dados e **Esc** fecha.
- Barras vitais: `Shift + clique` em `−`/`+` altera 5 pontos.
- Notas: arraste entre colunas no desktop ou use o seletor dentro do card no
  celular.
- Todos os cards mantêm a animação de dissipação ao serem removidos.

## Compatibilidade

- O JSON exportado continua no formato plano da v1 (inclui `vidaMax`,
  `defesa`, etc.), então arquivos antigos importam sem conversão.
- O `localStorage` usa a mesma chave (`fichaOR`). Quem já tinha ficha salva pelo
  site antigo abre a nova versão com tudo carregado.
- Na primeira abertura, a versão nova guarda uma cópia crua da ficha encontrada
  em `fichaOR.backup.v1` e mostra um aviso com o botão **Baixar backup**. A cópia
  só é criada uma vez e nunca sobrescreve a original.
- Quem usava a ficha em outro endereço (outro domínio) deve usar **Importar**
  com o JSON exportado — o navegador não compartilha `localStorage` entre
  origens diferentes.
- “Limpar ficha” apaga também a cópia de segurança.
- A ficha original está preservada em `legacy/index.html` — ela não é incluída
  no build.
