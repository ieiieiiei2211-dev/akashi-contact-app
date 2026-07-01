# 友人向けセットアップ手順

このアプリは GitHub から clone して、各自のPCで起動する。

GitHub:
https://github.com/ieiiieii2211-dev/akashi-contact-app

構成:
- apps/api : NestJS API
- apps/web : React + Vite
- DB : PostgreSQL
- ORM : Prisma

重要:
GitHubだけでは完全には動かない。
GitHubはコード置き場。
APIとDBは友人のPCで起動する必要がある。

必要なもの:
- Git
- Node.js
- npm
- PostgreSQL

セットアップ手順:

1. GitHubから取得

git clone https://github.com/ieiiieii2211-dev/akashi-contact-app.git
cd akashi-contact-app

2. API側の準備

cd apps\api
npm install
copy .env.example .env

3. apps\api\.env を編集する

DATABASE_URL を自分のPostgreSQLに合わせる。

例:
DATABASE_URL="postgresql://postgres:自分のPostgreSQLパスワード@localhost:5432/akashi_contact?schema=public"
PORT=3000
APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

4. PostgreSQLでDBを作る

psql が使える場合:

psql -U postgres

psql が見つからない場合の例:

& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

psqlに入ったら:

CREATE DATABASE akashi_contact;
\q

すでに akashi_contact があると言われたらそのままでよい。

5. Prismaを反映する

cd apps\api
npx prisma generate
npx prisma migrate dev

6. APIを起動する

cd apps\api
npm run start:dev

確認:
http://localhost:3000/users

JSON または [] が出ればAPIは動いている。

7. Web側を準備する

別のPowerShellを開く。

cd akashi-contact-app\apps\web
npm install
npm run dev

確認:
http://localhost:5173

8. よくあるエラー

client password must be a string:
- apps/api/.env の DATABASE_URL が間違っている
- apps/api/src/main.ts に import 'dotenv/config'; がない

psql が見つからない:
- PostgreSQLのbinフォルダをフルパスで指定する

GitHub PagesでAPIが動かない:
- GitHub PagesはReact画面だけ
- NestJS APIとPostgreSQLは別サーバーかローカルPCで動かす必要がある

現在の状態:
- ローカルでは Web / API / PostgreSQL の動作確認済み
- RailwayはTrial Endedで停止中
- 今後さくらインターネットへ移行予定
