
FROM node:22-alpine as base
    WORKDIR /app

    # build deps for kuzu
    RUN apk add --no-cache \
        libc6-compat \
        git \
        build-base \
        cmake \
        python3


    COPY src ./src
    COPY package*.json ./

    # build kuzu from source
    ENV npm_config_build_from_source=true
    
    # kuzu builds on install if the "npm_config_build_from_source" flag is set
    RUN npm install

    CMD ["npm", "start"]

    