FROM node:8-alpine

ADD . /app

# We can't empty field values
ENV MS_STORAGE_TYPE=invalid \
    MS_STORAGE_MAX_SIZE=invalid \
    MS_STORAGE_PATH=invalid \
    MS_STORAGE_CACHE_PATH=invalid \
    MS_PASSKEY=passkey \
    MS_INTERNAL_PORT=8080 \
    MS_PUBLIC_PORT=80 \
    MS_ENABLED_SERVER_SERVICES=invalid \
    AWS_ACCESS_KEY_ID=key \
    AWS_SECRET_ACCESS_KEY=value

ENTRYPOINT ['npm', 'start', '--']
