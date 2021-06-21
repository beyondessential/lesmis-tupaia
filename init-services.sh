#!/bin/bash
set -x

PACKAGES=("meditrak-server" "web-config-server" "psss-server" "lesmis-server" "report-server" "entity-server" "web-frontend" "admin-panel" "psss" "lesmis")

HOME_DIRECTORY=/tupaia

for PACKAGE in ${PACKAGES[@]}; do
    echo "Preparing to start ${PACKAGE}"

    cd ${HOME_DIRECTORY}/packages/$PACKAGE

    if [[ $PACKAGE == *server ]]; then
        echo "Starting ${PACKAGE}"

        # Replace dash with underscore, uppercase all
        SAFE_PACKAGE_NAME=$(echo "$PACKAGE" | sed -e "s/-/_/g" | tr 'a-z' 'A-Z')

        SERVER_PORT_ENV_VAR_NAME="PORT_${SAFE_PACKAGE_NAME}"

        SERVER_PORT="${!SERVER_PORT_ENV_VAR_NAME}"

        pm2 start --name $PACKAGE PORT=$SERVER_PORT dist --wait-ready --listen-timeout 15000 --time
    fi
done

echo "Services started"
