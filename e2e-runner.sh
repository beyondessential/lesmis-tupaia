#!/bin/bash
set -x # echo all commands (after private key so it is not exposed) TODO
set -e # exit if any line fails

# Fetch db dump
#if [ -f db/dump.sql ]; then
#    # Shortcut if db/ is mounted
#    echo "dump.sql exists, skipping fetch"
#else
#    sh ./scripts/bash/dumpDb.sh /root/.ssh/id_rsa_tupaia.pem -t db
#fi

# Start db
#docker run -d --name e2e-db --env POSTGRES_HOST_AUTH_METHOD=trust mdillon/postgis:9.6-alpine
#docker-compose -f e2e-docker-compose.yml up -d e2e-db

# ------------------------------------------
# ------------------------------------------
# Run #1 - reference
# ------------------------------------------
# ------------------------------------------

# start container
#docker-compose -f e2e-docker-compose.yml up -d e2e-web-reference
#docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t bes/tupaia:dev-2021-06-18 --cache-from bes/tupaia:dev-2021-06-18 --target test -f ./Dockerfile /tmp/e2e/reference
#
#docker push bes/tupaia:dev-2021-06-18
#
#docker images
#
docker ps -a
#
## prep: set up and import db
#docker-compose -f e2e-docker-compose.yml exec -T e2e-db psql -U postgres -c "CREATE ROLE tupaia WITH LOGIN ENCRYPTED PASSWORD 'tupaia';"
#docker-compose -f e2e-docker-compose.yml exec -T e2e-db psql -U postgres -c "CREATE ROLE tupaia_read WITH LOGIN ENCRYPTED PASSWORD 'tupaia_read';"
#docker-compose -f e2e-docker-compose.yml exec -T e2e-db psql -U postgres < db/dump.sql
#
## run
#docker-compose -f e2e-docker-compose.yml exec -T e2e-db psql -U postgres -c 'select now();'

# ------------------------------------------
# ------------------------------------------
# Run #2 - current
# ------------------------------------------
# ------------------------------------------






# docker build -t tupaia:e2e-runner -f e2e-runner.Dockerfile .
# docker run -v ~/.ssh:/root/.ssh --name runner tupaia:e2e-runner
#   expects /root/.ssh/id_rsa for github
#   expects /root/.ssh/id_rsa_tupaia for db dump