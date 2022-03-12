FROM node:14


WORKDIR /app
COPY ./package.json /app
COPY ./yarn.lock /app

RUN yarn config set network-timeout 600000 -g
RUN yarn install --frozen-lockfile

COPY ./ /app

ENV NODE_ENV production
RUN yarn build --clean
EXPOSE 1337
CMD ["yarn", "start"]