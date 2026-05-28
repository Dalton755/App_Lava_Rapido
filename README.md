# Lava Rápido | Fluxo Operacional

Aplicativo web mobile first para controlar o fluxo de veículos de um lava rápido usando GitHub Pages, Google Apps Script e Google Sheets.

## Estrutura

```text
.
├── index.html
├── style.css
├── app.js
└── api/
    └── Code.gs
```

## Abas do Google Sheets

Crie uma planilha com as abas abaixo. O Apps Script também tenta criar/ajustar os cabeçalhos quando a aba existe.

### SolicitacoesEmail

`Data_Email`, `Numero_Solicitacao`, `Placa`, `Tipo_Lavagem`, `Fornecedor`, `Responsavel`, `Agencia`, `ID`, `CicloID`

### Movimentacoes

`ID`, `CicloID`, `Placa`, `Tipo_Lavagem`, `Fornecedor`, `Responsavel`, `Agencia`, `Lavador`, `DataEntrada`, `Observacao`

### Lavagens

`ID`, `CicloID`, `Placa`, `Lavador`, `DataInicio`, `DataFim`, `ItensFeitos`, `Observacao`

## Publicar a API no Google Apps Script

1. Abra [script.google.com](https://script.google.com/).
2. Crie um novo projeto.
3. Copie o conteúdo de `api/Code.gs` para o arquivo `Code.gs`.
4. Em `CONFIG.SPREADSHEET_ID`, cole o ID da planilha.
5. Clique em **Implantar > Nova implantação**.
6. Selecione **Aplicativo da Web**.
7. Configure:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
8. Clique em **Implantar** e autorize o acesso.
9. Copie a URL do Web App.

## Configurar o front-end

No arquivo `app.js`, substitua:

```js
API_URL: "COLE_A_URL_DO_APPS_SCRIPT_AQUI"
```

pela URL publicada do Apps Script.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie estes arquivos para a branch principal.
3. Acesse **Settings > Pages**.
4. Em **Build and deployment**, selecione:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Salve e aguarde a URL do GitHub Pages ficar disponível.

## Endpoints

A API recebe `action` na query string para GET e no corpo JSON para POST.

- `GET ?action=painel`
- `GET ?action=fila_solicitacoes`
- `GET ?action=fila_lavagem`
- `POST ?action=criar_movimentacao`
- `POST ?action=criar_lavagem`

## Fluxo

1. A tela inicial carrega os cards do painel e as duas filas.
2. A fila de solicitações mostra registros de `SolicitacoesEmail` cujo `CicloID` ainda não existe em `Movimentacoes`.
3. Ao registrar a movimentação, o Apps Script grava `DataEntrada` automaticamente.
4. A fila de lavagem mostra registros de `Movimentacoes` cujo `CicloID` ainda não existe em `Lavagens`.
5. Ao concluir a lavagem, o Apps Script grava `DataInicio`, `DataFim` e `ItensFeitos`.

## Preparação para evolução

O projeto já separa front-end e API para facilitar futuras entregas:

- OCR de placa
- Login de usuários
- Dashboard avançado
- Relatórios
- Impressão
- PWA
- Notificações

## Observações

- O front-end usa HTML, CSS e JavaScript puro para funcionar diretamente no GitHub Pages.
- O corpo dos POSTs usa `Content-Type: text/plain` para evitar preflight CORS em Apps Script.
- O sistema remove itens das filas por regra de consulta, sem apagar linhas históricas.
