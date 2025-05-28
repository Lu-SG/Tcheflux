@echo off
REM Script para criar a estrutura de pastas e arquivos para o projeto PERN + Bootstrap

REM Define o nome da pasta raiz do projeto
set ROOT_PROJECT_DIR=tcheflux

REM Verifica se a pasta raiz já existe
if exist "%ROOT_PROJECT_DIR%" (
    echo Pasta "%ROOT_PROJECT_DIR%" ja existe.
    goto :eof
)

echo Criando estrutura do projeto: %ROOT_PROJECT_DIR%
mkdir "%ROOT_PROJECT_DIR%"
cd "%ROOT_PROJECT_DIR%"

REM --- Backend ---
echo Criando estrutura do Backend...
mkdir backend
cd backend

REM Arquivos na raiz do backend
echo Criando backend/server.js
type NUL > server.js
echo Criando backend/db.js
type NUL > db.js
echo Criando backend/.env
type NUL > .env
echo Criando backend/package.json
type NUL > package.json

REM Pasta de rotas do backend
mkdir routes
cd routes
echo Criando backend/routes/items.js
type NUL > items.js
cd ..

cd ..

REM --- Frontend ---
echo Criando estrutura do Frontend (Bootstrap puro)...
mkdir frontend
cd frontend

REM Arquivo na raiz do frontend
echo Criando frontend/package.json
type NUL > package.json
echo Criando frontend/index.html
type NUL > index.html

REM Pastas para CSS, JS e Imagens
mkdir css
cd css
echo Criando frontend/css/style.css
type NUL > style.css
cd ..

mkdir js
cd js
echo Criando frontend/js/script.js
type NUL > script.js
cd ..

mkdir img
echo Pasta frontend/img criada.

cd ..

echo.
echo Estrutura do projeto "%ROOT_PROJECT_DIR%" criada com sucesso!

:eof
pause