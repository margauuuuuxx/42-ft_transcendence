DC_FILE = ./services/compose.yml
DC = docker compose -f $(DC_FILE)


.PHONY: all up down build restart logs ps clean fclean re

# Tout : créer le volume et construire/lancer les conteneurs
all: v_dir build up

# Création des volumes si ils n'existent pas
v_dir:
	@echo "📂 Création des volumes si nécessaire..."

# Lancer les conteneurs
up:
	@echo "🚀 Démarrage des conteneurs en arrière-plan..."
	$(DC) up -d
	@echo "✅ Conteneurs démarrés !"

# Arrêter et supprimer les conteneurs
down:
	@echo "🛑 Arrêt et suppression des conteneurs..."
	$(DC) down
	@echo "🧹 Conteneurs arrêtés !"

# Construire/reconstruire les images
build:
	@echo "🔨 Construction des images Docker..."
	$(DC) build
	@echo "🏗️ Images construites !"

# Redémarrer les conteneurs
restart:
	@echo "♻️ Redémarrage des conteneurs..."
	$(DC) restart
	@echo "🔄 Conteneurs redémarrés !"

# Afficher les logs en temps réel
logs:
	@echo "📜 Affichage des logs (Ctrl+C pour quitter)..."
	$(DC) logs -f

# Afficher l'état des conteneurs
ps:
	@echo "📊 État des conteneurs Docker..."
	$(DC) ps

# Nettoyage intermédiaire : conteneurs + réseaux + volumes orphelins
clean:
	@echo "🧹 Nettoyage des conteneurs, réseaux et volumes..."
	$(DC) down --volumes --remove-orphans --rmi all
	@echo "✅ Nettoyage terminé !"

# Nettoyage complet (ici on pourrait aussi supprimer le volume local)
fclean: clean
	@echo "🚿 Nettoyage complet effectué !"

# Rebuild complet : nettoyage + volume + build + up
re: fclean all
