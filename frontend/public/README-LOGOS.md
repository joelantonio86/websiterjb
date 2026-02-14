# Logos da Racional Jazz Band

Para que os logos apareçam corretamente no site, você precisa adicionar os seguintes arquivos na pasta `public`:

- `logo.jpeg` - Logo para modo claro
- `logo-dark.png` - Logo para modo escuro

## Como obter os logos

1. Acesse o site em produção: https://www.racionaljazzband.com.br
2. Baixe os arquivos `logo.jpeg` e `logo-dark.png`
3. Coloque-os na pasta `frontend/public/`

## Fallback

Se os arquivos não estiverem disponíveis, o sistema usará automaticamente:
1. Primeiro tenta carregar do site em produção
2. Depois tenta carregar da pasta `public/`
3. Por último, mostra um círculo com as letras "RJB" estilizadas

O componente `Logo.jsx` gerencia automaticamente essas tentativas.
