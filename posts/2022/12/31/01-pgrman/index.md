---
pubdate: 2022-12-31T23:26+09:00
tags: [tech]
---

# PostgreSQLをpg_rmanでちゃんとバックアップしている話

データベースの運用は難しい。私の運用している Pleroma (Mastodon 互換といえば世間的に通じそう) サーバー ([ご隠居](https://xxx.azyobuzi.net/)) は、今まで EC2 + RDS の構成でしたが、さすがに高かった ($50 が円安で厳しくなっていく)。そこで 10 月に KAGOYA CLOUD VPS に移行を行いました。で、登録したら「嘘の住所で登録してない？」とサポートに疑われて、メールチェックしてない間にアカウントが停止されていたのは別の話……。

VPS に移行すると、データベースの管理も当然自分でやることになります。今まで RDS が自動でやっていたことを自分で組み直すのは大変だったので、今年最後の技術ブログをやっておきます。

## 日次バックアップか、もっと頻度を高めるか

もっとも簡単なバックアップは、 pg_dump を使ってデータを SQL ファイルまたは pg_dump 独自形式として出力させてしまう方法でしょうか。 RDS を使う前は1日1回 pg_dump したものを xz で圧縮して Backblaze B2 へアップロードするスクリプトを組んでいました。

しかし、 RDS を経験してしまうと、もっとリッチなバックアップができてしまいます。ワンクリックでスナップショットを取れるし、 PITR とかいうのも使えるらしい。

そもそも、日次バックアップだと障害時に失うデータが多すぎるので若干不安がありました。というわけで、再現してみましょう。

## PostgreSQL のバックアップとは

PostgreSQL のバックアップ方法は大きく次の 3 種類があると、[公式ドキュメント](https://www.postgresql.jp/document/14/html/backup.html)に書いてあります。

1. SQLによるダンプ
2. ファイルシステムレベルのバックアップ
3. 継続的アーカイブ

このうち pg_dump は 1 に相当します。 pg_dump は通常の PostgreSQL クライアントとしてサーバーに接続し、すべてのレコードを SELECT します。メリットは、 SELECT を投げればいいだけなので、何の準備も要らず PostgreSQL が動いてさえいればバックアップができることです。デメリットは、差分バックアップを取るのが難しいことです。もちろん ID が単調増加するテーブルならば、前回取得した ID 以降をバックアップするという手もありますが、アプリケーションに依存します。

ではデメリットを解消し、いつでもサクサクバックアップ取るにはどうしたらいいでしょうか。そこで 2 と 3 の組み合わせです。

2 は PostgreSQL のデータディレクトリをまるっとコピーする方法です。

3 はデータベースへの変更を確実にディスクに記録するために使われる WAL を、バックアップの目的にも転用するものです。通常はデータベースへの変更の書き込みが終わったら用済みな WAL ですが、これ (ログ) をバックアップしておくことで、任意のコミットのタイミングのデータに復元 (ログを再生) することができます。

つまり、2でまるっとデータをコピーし、そこからの差分を3で行えば、それなりに低コストで高頻度かつどのタイミングにも復元できるバックアップができます！ しかし PostgreSQL の標準機能だけでこの方法をやるには、やることが多いので、いくつかのツールが開発されています。比較は「[<cite>PostgreSQLバックアップ実践とバックアップ管理ツールの紹介</cite>]」(https://www.postgresql.jp/sites/default/files/2021-11/jpug-pgcon2021-backup_20211112_.pdf)がわかりやすいです。

今回は PostgreSQL 14 に対応しており、アクティブにメンテナンスされている [pg_rman](https://github.com/ossc-db/pg_rman) を使っていきます。

## pg_rman を使ってみる

pg_rman は PostgreSQL のデータディレクトリと WAL をコピーして世代管理をしてくれるツールです。バックアップ形式は full, incremental, archive の 3 種類があります。 full と incremental はデータディレクトリと WAL を、 archive は WAL アーカイブファイルだけをコピーします。 incremental は前回のデータディレクトリのバックアップから変更があったファイルをコピーします (PostgreSQL のテーブルファイルは最大 1GB なので、多くの場合 incremental バックアップは最低でも 1GB になります)。

バックアップからの復元は、 full, incremental からデータディレクトリを復元し、最後のデータディレクトリのバックアップ以降の WAL アーカイブファイルを読み込むよう PostgreSQL に設定することで実現されます。

では、 pg_rman を使ってみましょう。ここでは Ubuntu 22.04, PostgreSQL 14 を前提とします。 Ubuntu でのインストールは、[こちらの記事](https://watchcontents.com/pg_rman-postgresql-backup/)に書いてあるパッケージを事前にインストールすれば良さそうでした。必要なライブラリをインストールしたら `sudo make install` でシステムの PostgreSQL の拡張ディレクトリにビルドした成果物がコピーされます。

次に /etc/postgresql/14/main/postgresql.conf に次の設定を追加します。

```
# バックアップから復元できるように詳細に WAL を出力する
wal_level = replica

# WAL が 16MB 溜まったらファイルに出力する
archive_mode = on

# 出力したファイルのコピー方法を指定
# 「/home/postgres/arclog」は postgres ユーザーがアクセスできるお好きなディレクトリにしてください
archive_command = 'cp %p /home/postgres/arclog/%f'
```

これで PostgreSQL を再起動すれば、 WAL アーカイブファイルが出力されるようになります。

<div role="note" class="note note-caution">
  <h4 class="note-heading">archive_mode = on の注意</h4>
  <div class="note-content">
    <p>データベースへの変更がすべてファイルに出力されることになるので、ディスクの容量はよく監視するようにしましょう。特にデータベースに大きな変更を加えたり VACUUM をしたりすると様々なページを操作するため大量の WAL アーカイブファイルが出力されます。必要に応じて無効化してください。</p>
  </div>
</div>

次に pg_rman を設定します。 Ubuntu 22.04 ならば pg_rman は `/usr/lib/postgresql/14/bin/pg_rman` にインストールされているはずです。バックアップファイルを置きたい場所と、 WAL アーカイブの保存先 (archive_command で設定したディレクトリ) を、それぞれ環境変数 <var>BACKUP_PATH</var>, <var>ARCLOG_PATH</var> に代入したうえで、 `pg_rman init` コマンドを実行します。

```
sudo -u postgres BACKUP_PATH=/home/postgres/backup ARCLOG_PATH=/home/postgres/arclog /usr/lib/postgresql/14/bin/pg_rman init
```

すると BACKUP_PATH で指定したディレクトリに pg_rman.ini が作成されます。設定項目はこのファイルに書いておくと、毎回コマンドラインオプションで設定する必要がなくて便利です。私のサーバーでは次のような設定になっています。

<figure class="fig-code">
<figcaption>pg_rman.ini</figcaption>

```
# メモ: mkdir /home/postgres; chown postgres:postgres /home/postgres した
ARCLOG_PATH='/home/postgres/arclog'
SRVLOG_PATH='/var/lib/postgresql/14/main/log'
PGDATA=/var/lib/postgresql/14/main
PGCONF_PATH=/etc/postgresql/14/main
COMPRESS_DATA=YES
KEEP_DATA_DAYS=5
KEEP_SRVLOG_DAYS=5
KEEP_ARCLOG_DAYS=1
```

</figure>

これでバックアップの準備は整いました！

このままフルバックアップを行うには次のコマンドを実行します。

```
sudo -u postgres BACKUP_PATH=/home/postgres/backup /usr/lib/postgresql/14/bin/pg_rman backup --backup-mode=full --progress
```

これで PostgreSQL のデータディレクトリと WAL アーカイブファイルがバックアップディレクトリへコピーされます。

## 定期的にバックアップする

実運用に耐えるように、バックアップ作業を自動化しておきます。バックアップは次の構成にします。

- 1日1回 full バックアップ
- 1時間に1回 archive バックアップ

このようにすることで、データの損失は最大でも1時間にすることができます。なお、 incremental バックアップは名前に反してかなり容量を必要とするので、使用していません (full バックアップをしたほうが多少容量が大きくても運用が楽と判断)。

まず、バックアップスクリプトを作成します。

はじめに、バックアップディレクトリを Backblaze B2 にコピーするスクリプトを用意します。

<figure class="fig-code">
<figcaption>backup_sync.sh</figcaption>

```sh
#!/bin/bash
set -eu

# [B2 CLI](https://github.com/Backblaze/B2_Command_Line_Tool) がインストールされている前提
# ログイン
b2 authorize-account [applicationKeyId] [applicationKey]

# バックアップディレクトリを B2 にコピー
# --delete を指定することで、 KEEP_DATA_DAYS 経過したファイルを削除する
b2 sync --delete /home/postgres/backup b2://azyobuzinbackup/backup-postgres/xxxdb

```

</figure>

次に、バックアップを行い、その後 backup_sync.sh を呼び出すスクリプトを用意します。このスクリプトによって、バックアップの定型作業を網羅します。

<figure class="fig-code">
<figcaption>backup_daily.sh</figcaption>

```sh
#!/bin/sh
# Usage: backup_daily.sh --progress
set -eu

export BACKUP_PATH=/home/postgres/backup

/usr/lib/postgresql/14/bin/pg_rman backup --backup-mode=full $@
/usr/lib/postgresql/14/bin/pg_rman validate $@

# KEEP_DATA_DAYS 経過し削除されたバックアップの管理情報を削除する
/usr/lib/postgresql/14/bin/pg_rman purge

backup_sync.sh
```

</figure>

<figure class="fig-code">
<figcaption>backup_hourly.sh</figcaption>

```sh
#!/bin/sh
# Usage: backup_hourly.sh --progress
set -eu
export BACKUP_PATH=/home/postgres/backup

/usr/lib/postgresql/14/bin/pg_rman backup --backup-mode=archive $@
/usr/lib/postgresql/14/bin/pg_rman validate $@

backup_sync.sh
```

</figure>

これのスクリプトを postgres ユーザーの cron または systemd の timer で `User=postgres` で実行すれば、定期バックアップの完成です。

## バックアップから復元する

バックアップをしても復元できることを確認しなければ、いざというときに使えません。とにかく、同じ構成のサーバーを用意できるよう、 cloud-init や Ansible などを使って構成管理をしましょう。

バックアップからの復元には `pg_rman restore` コマンドで一発です。 Backblaze B2 からのダウンロードを含めるとこんな感じになります。

<figure class="fig-code">
<figcaption>restore.sh</figcaption>

```sh
#!/bin/bash
# Usage: restore.sh --progress --recovery-target-time '2022-10-24 22:15:00'

set -eu

export BACKUP_PATH=/home/postgres/backup
export PGDATA=/var/lib/postgresql/14/main

# PostgreSQL を停止
/usr/lib/postgresql/14/bin/pg_ctl stop -m immediate

# Backblaze B2 へログイン
b2 authorize-account [applicationKeyId] [applicationKey]

# ダウンロード
b2 sync --replaceNewer b2://azyobuzinbackup/backup-postgres/xxxdb /home/postgres/backup

# ダウンロードしたファイルに実行権限を付与する
find ${BACKUP_PATH} -type f -name '*.sh' -exec chmod +x \{\} \;

# pg_rman を実行
/usr/lib/postgresql/14/bin/pg_rman restore $@
```

</figure>

このスクリプトを実行した後、 PostgreSQL を普通に使えるようにするには、リカバリーモードを無効化する必要があります。次の手順で WAL のリカバリーとリカバリーモードの終了を行います。

1. PostgreSQL を起動し、 WAL リカバリーの完了を待つ
2. PostgreSQL を終了する
3. /etc/postgresql/14/main/postgresql.conf の最後の行 (pg_rman が勝手に書き加えています) を削除する
4. /etc/postgresql/14/main/pg_rman_recovery.conf を削除する
5. /var/lib/postgresql/14/main/recovery.signal を削除する
6. PostgreSQL を起動する

これで復元完了です！ ちょっと手間はありますが、スクリプト化しておくことでなんとかなるレベルです。

## まとめ

pg_rman を定期実行し Backblaze B2 へバックアップをアップロードするスクリプトを組むことで、単純な pg_dump によるバックアップよりも柔軟に復元できるバックアップ環境を整えることができました。また、復元もスクリプト化することで、いつでもデータベースのクローンを作成することができるようになりました。

これで Pleroma サーバーが突然死しても、みんなの投稿は守られます。黒歴史は消えねえからよ、覚悟しとけよ。

というわけでよいお年を！
