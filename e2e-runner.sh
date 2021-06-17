#!/bin/bash
set -x

# Read E2E_REFERENCE_BRANCH
#set -o allexport
#source e2e-config.env
#set +o allexport

# Clone reference branch
# TODO: change hardcoded dev to be the actual branch
export GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"

git clone --branch dev --depth=1 git@github.com:beyondessential/tupaia.git reference

ls -lha /home/reference

# Fetch db dump
#if [ -f db/dump.sql ]; then
#    # Shortcut if db/ is mounted
#    echo "dump.sql exists, skipping fetch"
#else
#    sh ./scripts/bash/dumpDb.sh /root/.ssh/id_rsa_tupaia.pem -t db
#fi

# Start db
docker-compose up -d e2e-db

# ------------------------------------------
# ------------------------------------------
# Run #1 - reference
# ------------------------------------------
# ------------------------------------------

# start container
docker-compose up -d e2e-web-reference

# prep: set up and import db
docker-compose exec -T e2e-db psql -U postgres -c "CREATE ROLE tupaia WITH LOGIN ENCRYPTED PASSWORD 'tupaia';"
docker-compose exec -T e2e-db psql -U postgres -c "CREATE ROLE tupaia_read WITH LOGIN ENCRYPTED PASSWORD 'tupaia_read';"
docker-compose exec -T e2e-db psql -U postgres < db/dump.sql

# run
docker-compose exec -T e2e-db psql -U postgres -c 'select now();'

# ------------------------------------------
# ------------------------------------------
# Run #2 - current
# ------------------------------------------
# ------------------------------------------






# docker build -t tupaia:e2e-runner -f e2e-runner.Dockerfile .
# docker run -v ~/.ssh:/root/.ssh --name runner tupaia:e2e-runner
#   expects /root/.ssh/id_rsa for github
#   expects /root/.ssh/id_rsa_tupaia for db dump