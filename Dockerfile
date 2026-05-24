FROM node:22.13.0

WORKDIR /backend

COPY package.json .

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]