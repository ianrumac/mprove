FROM node:10.15.0

WORKDIR /usr/src/app
RUN mkdir /usr/src/app/cypress
RUN mkdir /usr/src/app/cypress/plugins

RUN npm config set scripts-prepend-node-path true

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build:test

EXPOSE 4200

CMD [ "yarn", "server" ]
