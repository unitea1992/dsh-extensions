# route-guard

DSH の `agent/request` フックで、送信される provider、model、reasoning effort が設定値と一致するか検査します。一致しなければエラーを返します。

```yaml
- insert:
    - id: route-guard
      name: /absolute/path/to/dsh-extensions/extensions/route-guard/src/index.mjs
      config:
        provider: spark-local
        model: DeepSeek-V4.1-Flash-1017
        effort: high
```

任意の `statusDir` を指定すると、登録後に `guard-ready.json`、各リクエストの検査時に `route-observed.json` を書きます。ディレクトリは事前に作成し、他者から読めない権限にしてください。

DSH と dsh-tui の更新や、ほかの `agent/request` フックの登録順序によって挙動が変わる可能性があります。利用する構成で、不一致を送信前に止める試験を行ってください。
