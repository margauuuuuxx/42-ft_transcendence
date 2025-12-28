FROM nginx:stable

# Créer le dossier ssl pour contenir les certificats
RUN mkdir -p /etc/nginx/ssl

COPY default.conf /etc/nginx/conf.d/default.conf

# Copie du script + ajout des droits d'execution
COPY tools/entry_point.sh /usr/local/bin/entry_point.sh
RUN chmod +x /usr/local/bin/entry_point.sh

# Exposer les ports sur lequel Nginx écoute dans le conteneur
EXPOSE 443 80

# Entrypoint sur le script pour générer un certificat ssl
ENTRYPOINT [ "/usr/local/bin/entry_point.sh" ]