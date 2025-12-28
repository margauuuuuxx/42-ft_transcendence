FROM node:20-bullseye

WORKDIR /usr/src/app

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
EXPOSE 3000

ENTRYPOINT ["/startup.sh"]