misskey-storage
===

about
---

a storage backend service provider, renewal of [misskey-delta/misskey-file](https://github.com/misskey-delta/misskey-file).
backend entrypoint '/v0/' has backward compability with the [misskey-delta/misskey-file](https://github.com/misskey-delta/misskey-file) project.

config
---
```
cp .env.example .env
```

See .env for more details.

If you set `MS_STORAGE_TYPE` to `S3`, must set AWS Environment Credential Variables. see [Loading Credentials in Node.js from Environment Variables](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html).

excellent features than misskey-file
---
+ More clearly
  * client(s) can receive correctly error in request.
+ Capacity limit for each uploaded file
+ Caches as possible
  * graphicsmagick generation object
  * object deliveried from S3
