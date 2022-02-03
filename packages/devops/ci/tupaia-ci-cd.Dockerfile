FROM node:12.18.3-alpine3.11

# install features not available in base alpine distro
RUN apk --no-cache add \
  bash \
  curl \
  git \
  lastpass-cli \
  openssh \
  postgresql-client \
  rsync

# set the workdir so that all following commands run within /tupaia
WORKDIR /tupaia

# get ready for dependencies to be installed via yarn, before copying the rest of the package, so
# that node_modules is built and added to the container cache without changes to code invalidating it
COPY package.json ./
COPY yarn.lock ./
COPY babel.config.json ./
COPY .babelrc-ts.js ./
COPY tsconfig-js.json ./
RUN mkdir ./scripts
COPY scripts/. ./scripts

## copy *just the package.json* of each package so it is ready for yarn install, without adding the
## src directories, so that code changes don't invalidate the container cache before we've run yarn
RUN mkdir -p ./packages/access-policy
COPY packages/access-policy/package.json ./packages/access-policy
RUN mkdir -p ./packages/admin-panel
COPY packages/admin-panel/package.json ./packages/admin-panel
RUN mkdir -p ./packages/admin-panel-server
COPY packages/admin-panel-server/package.json ./packages/admin-panel-server
RUN mkdir -p ./packages/aggregator
COPY packages/aggregator/package.json ./packages/aggregator
RUN mkdir -p ./packages/api-client
COPY packages/api-client/package.json ./packages/api-client
RUN mkdir -p ./packages/auth
COPY packages/auth/package.json ./packages/auth
RUN mkdir -p ./packages/data-api
COPY packages/data-api/package.json ./packages/data-api
RUN mkdir -p ./packages/data-broker
COPY packages/data-broker/package.json ./packages/data-broker
RUN mkdir -p ./packages/data-lake-api
COPY packages/data-lake-api/package.json ./packages/data-lake-api
RUN mkdir -p ./packages/database
COPY packages/database/package.json ./packages/database
RUN mkdir -p ./packages/dhis-api
COPY packages/dhis-api/package.json ./packages/dhis-api
RUN mkdir -p ./packages/entity-server
COPY packages/entity-server/package.json ./packages/entity-server
RUN mkdir -p ./packages/expression-parser
COPY packages/expression-parser/package.json ./packages/expression-parser
RUN mkdir -p ./packages/indicators
COPY packages/indicators/package.json ./packages/indicators
RUN mkdir -p ./packages/kobo-api
COPY packages/kobo-api/package.json ./packages/kobo-api
RUN mkdir -p ./packages/lesmis
COPY packages/lesmis/package.json ./packages/lesmis
RUN mkdir -p ./packages/lesmis-server
COPY packages/lesmis-server/package.json ./packages/lesmis-server
RUN mkdir -p ./packages/meditrak-server
COPY packages/meditrak-server/package.json ./packages/meditrak-server
RUN mkdir -p ./packages/psss
COPY packages/psss/package.json ./packages/psss
RUN mkdir -p ./packages/psss-server
COPY packages/psss-server/package.json ./packages/psss-server
RUN mkdir -p ./packages/report-server
COPY packages/report-server/package.json ./packages/report-server
RUN mkdir -p ./packages/server-boilerplate
COPY packages/server-boilerplate/package.json ./packages/server-boilerplate
RUN mkdir -p ./packages/ui-components
COPY packages/ui-components/package.json ./packages/ui-components
RUN mkdir -p ./packages/utils
COPY packages/utils/package.json ./packages/utils
RUN mkdir -p ./packages/weather-api
COPY packages/weather-api/package.json ./packages/weather-api
RUN mkdir -p ./packages/web-config-server
COPY packages/web-config-server/package.json ./packages/web-config-server
RUN mkdir -p ./packages/web-frontend
COPY packages/web-frontend/package.json ./packages/web-frontend

## run yarn without building internal dependencies, so we can cache that layer without code changes
## within internal dependencies invalidating it
RUN SKIP_BUILD_INTERNAL_DEPENDENCIES=true yarn install --non-interactive --frozen-lockfile

## add content of all internal dependency packages ready for internal dependencies to be built
COPY packages/access-policy/. ./packages/access-policy
COPY packages/admin-panel/. ./packages/admin-panel
COPY packages/aggregator/. ./packages/aggregator
COPY packages/api-client/. ./packages/api-client
COPY packages/auth/. ./packages/auth
COPY packages/database/. ./packages/database
COPY packages/data-api/. ./packages/data-api
COPY packages/data-broker/. ./packages/data-broker
COPY packages/data-lake-api/. ./packages/data-lake-api
COPY packages/dhis-api/. ./packages/dhis-api
COPY packages/expression-parser/. ./packages/expression-parser
COPY packages/indicators/. ./packages/indicators
COPY packages/utils/. ./packages/utils
COPY packages/ui-components/. ./packages/ui-components
COPY packages/weather-api/. ./packages/weather-api
COPY packages/server-boilerplate/. ./packages/server-boilerplate
COPY packages/kobo-api/. ./packages/kobo-api

## build internal dependencies
RUN yarn build-internal-dependencies

# copy everything else from the repo
COPY . ./
