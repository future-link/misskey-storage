misskey-storage
===

renewal of [misskey-delta/misskey-file](https://github.com/misskey-delta/misskey-file).

about
---

a storage backend service provider.
entrypoint '/v0/' is fully compatible with the [misskey-delta/misskey-file](https://github.com/misskey-delta/misskey-file) project.

config
---
```
cp .env.example .env
```

name|description
--|--
`MS_STORAGE_TYPE`|`S3`, `LOCAL` can be input.
`MS_STORAGE_MAX_SIZE`|limit maximam size of files comming uploaded. this value will be passed to multer's limit 'fileSize' configuration. see https://www.npmjs.com/package/multer#limits. default value is 5MB. (5000000)
`MS_STORAGE_PATH`|if `MS_STORAGE_TYPE` is 'LOCAL', saves uploaded files to this path. default './uploads'.
`MS_PASSKEY`|passkey for uploading to this service.
`MS_INTERNAL_PORT`|standby port of internal endpoints, work with [misskey-delta/misskey-api](https://github.com/misskey-delta/misskey-api).
`MS_PUBLIC_PORT`|standby port of public endpoints, return pictures to users.

if you set `MS_STORAGE_TYPE` to `S3`, must set AWS Environment Credential Variables. see [Loading Credentials in Node.js from Environment Variables](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html).
