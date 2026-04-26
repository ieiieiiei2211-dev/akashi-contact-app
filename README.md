# Akashi Contact App

明石高専向けの学校連絡ポータルのプロトタイプです。

## 主な機能

- ユーザーログイン
- 学校連絡の作成・送信
- 宛先条件指定
- ユーザー管理
- 既読・未読管理
- アンケート回答・集計
- 添付資料表示
- メール通知ログ
- プッシュ通知
- 通知送信結果の管理画面表示

## 技術構成

- Frontend: React / Vite / TypeScript
- Backend: NestJS / TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Notification:
  - Email: nodemailer
  - Push: web-push / Service Worker

## 必要な開発環境

- Node.js
- PostgreSQL
- Git

## 初回セットアップ

```powershell
cd C:\Users\poetr\akashi-contact-app
cd apps\api
npm install
cd ..\web
npm install